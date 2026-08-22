import { valueMarketMakingBook } from "./book";
import type {
  MarketMakingMarketState,
  MarketMakingTrade,
} from "./types";

export interface MarketMakingHigherOrderDiagnostics {
  vanna: number;
  volga: number;
  charm: number;
  color: number;
  veta: number;
  volatilityBump: number;
  timeBumpDays: number;
  boundarySensitive: boolean;
}

function cloneMarket(market: MarketMakingMarketState): MarketMakingMarketState {
  return {
    valuationTime: market.valuationTime,
    underlyings: market.underlyings.map((underlying) => ({
      ...underlying,
      surface: { ...underlying.surface },
    })),
  };
}

function bumpVolatility(
  market: MarketMakingMarketState,
  underlyingId: string,
  move: number,
): MarketMakingMarketState {
  const bumped = cloneMarket(market);
  const underlying = bumped.underlyings.find((candidate) => candidate.id === underlyingId);
  if (!underlying) throw new RangeError(`Unknown underlying: ${underlyingId}.`);
  underlying.surface.atmVolatility += move;
  if (underlying.surface.atmVolatility < 0) {
    throw new RangeError("Volatility bump cannot produce negative ATM volatility.");
  }
  return bumped;
}

function bumpTime(
  market: MarketMakingMarketState,
  elapsedDays: number,
): MarketMakingMarketState {
  const bumped = cloneMarket(market);
  bumped.valuationTime += elapsedDays / 365;
  if (bumped.valuationTime < 0) throw new RangeError("Time bump cannot precede the reference date.");
  return bumped;
}

function riskFor(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
  underlyingId: string,
) {
  const risk = valueMarketMakingBook(trades, market).byUnderlying.find(
    (candidate) => candidate.underlyingId === underlyingId,
  );
  if (!risk) throw new RangeError(`Unknown underlying: ${underlyingId}.`);
  return risk.greeks;
}

export function calculateMarketMakingDiagnostics(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
  underlyingId: string,
  volatilityBump = 0.005,
  timeBumpDays = 1,
): MarketMakingHigherOrderDiagnostics {
  if (!Number.isFinite(volatilityBump) || volatilityBump <= 0) {
    throw new RangeError("Volatility bump must be finite and positive.");
  }
  if (!Number.isFinite(timeBumpDays) || timeBumpDays <= 0) {
    throw new RangeError("Time bump must be finite and positive.");
  }

  const baseUnderlying = market.underlyings.find((candidate) => candidate.id === underlyingId);
  if (!baseUnderlying) throw new RangeError(`Unknown underlying: ${underlyingId}.`);
  if (baseUnderlying.surface.atmVolatility < volatilityBump) {
    throw new RangeError("Volatility bump crosses the zero-volatility boundary.");
  }
  const volUp = riskFor(trades, bumpVolatility(market, underlyingId, volatilityBump), underlyingId);
  const volDown = riskFor(trades, bumpVolatility(market, underlyingId, -volatilityBump), underlyingId);
  const perVolPoint = 0.01 / (2 * volatilityBump);

  const base = riskFor(trades, market, underlyingId);
  const dayFraction = timeBumpDays / 365;
  const canUseCentralTime = market.valuationTime >= dayFraction;
  const timeUp = riskFor(trades, bumpTime(market, timeBumpDays), underlyingId);
  const timeDown = canUseCentralTime
    ? riskFor(trades, bumpTime(market, -timeBumpDays), underlyingId)
    : base;
  const timeDenominator = canUseCentralTime ? 2 * timeBumpDays : timeBumpDays;
  const remainingTimes = trades.flatMap((trade) =>
    trade.underlyingId === underlyingId && trade.instrument === "option"
      ? [Math.max(trade.maturity - market.valuationTime, 0)]
      : [],
  );
  const boundarySensitive =
    !canUseCentralTime || remainingTimes.some((remaining) => remaining <= 2 * dayFraction);

  return {
    vanna: (volUp.delta - volDown.delta) * perVolPoint,
    volga: (volUp.vega - volDown.vega) * perVolPoint,
    charm: (timeUp.delta - timeDown.delta) / timeDenominator,
    color: (timeUp.gamma - timeDown.gamma) / timeDenominator,
    veta: (timeUp.vega - timeDown.vega) / timeDenominator,
    volatilityBump,
    timeBumpDays,
    boundarySensitive,
  };
}
