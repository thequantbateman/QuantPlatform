import { validateMarketMakingMarketState, valueMarketMakingBook } from "./book";
import type {
  MarketMakingMarketState,
  MarketMakingShock,
  MarketMakingSnapshot,
  MarketMakingTrade,
} from "./types";

export interface MarketMakingScenarioExplain {
  base: ReturnType<typeof valueMarketMakingBook>;
  shocked: ReturnType<typeof valueMarketMakingBook>;
  shockedMarket: MarketMakingMarketState;
  actual: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
  approximate: number;
  residual: number;
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

function cloneTrades(trades: readonly MarketMakingTrade[]): MarketMakingTrade[] {
  return trades.map((trade) => ({ ...trade }));
}

function cleanZero(value: number): number {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

function validateShock(shock: MarketMakingShock): void {
  for (const [label, value] of Object.entries(shock)) {
    if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
  }
  if (shock.spotMovePercent <= -1) throw new RangeError("Spot move must preserve positive spot.");
  if (shock.elapsedDays < 0) throw new RangeError("Elapsed days cannot be negative.");
}

export function createMarketMakingSnapshot(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
): MarketMakingSnapshot {
  validateMarketMakingMarketState(market);
  valueMarketMakingBook(trades, market);
  return { trades: cloneTrades(trades), market: cloneMarket(market) };
}

export function shockMarketMakingMarket(
  market: MarketMakingMarketState,
  underlyingId: string,
  shock: MarketMakingShock,
): MarketMakingMarketState {
  validateMarketMakingMarketState(market);
  validateShock(shock);
  let found = false;
  const shockedMarket: MarketMakingMarketState = {
    valuationTime: market.valuationTime + shock.elapsedDays / 365,
    underlyings: market.underlyings.map((underlying) => {
      if (underlying.id !== underlyingId) return { ...underlying, surface: { ...underlying.surface } };
      found = true;
      const next = {
        ...underlying,
        spot: underlying.spot * (1 + shock.spotMovePercent),
        rate: underlying.rate + shock.rateMove,
        surface: {
          ...underlying.surface,
          atmVolatility: underlying.surface.atmVolatility + shock.volatilityLevelMove,
          skew: underlying.surface.skew + shock.skewMove,
        },
      };
      return next;
    }),
  };
  if (!found) throw new RangeError(`Unknown underlying: ${underlyingId}.`);
  validateMarketMakingMarketState(shockedMarket);
  return shockedMarket;
}

export function explainMarketMakingScenario(
  snapshot: MarketMakingSnapshot,
  underlyingId: string,
  shock: MarketMakingShock,
): MarketMakingScenarioExplain {
  const base = valueMarketMakingBook(snapshot.trades, snapshot.market);
  const baseUnderlying = base.byUnderlying.find((candidate) => candidate.underlyingId === underlyingId);
  const underlying = snapshot.market.underlyings.find((candidate) => candidate.id === underlyingId);
  if (!baseUnderlying || !underlying) throw new RangeError(`Unknown underlying: ${underlyingId}.`);
  const shockedMarket = shockMarketMakingMarket(snapshot.market, underlyingId, shock);
  const shocked = valueMarketMakingBook(snapshot.trades, shockedMarket);
  const spotMove = underlying.spot * shock.spotMovePercent;
  const delta = cleanZero(baseUnderlying.greeks.delta * spotMove);
  const gamma = cleanZero(0.5 * baseUnderlying.greeks.gamma * spotMove ** 2);
  const vega = cleanZero(baseUnderlying.greeks.vega * (shock.volatilityLevelMove / 0.01));
  const theta = cleanZero(baseUnderlying.greeks.theta * shock.elapsedDays);
  const rho = cleanZero(baseUnderlying.greeks.rho * (shock.rateMove / 0.01));
  const approximate = cleanZero(delta + gamma + vega + theta + rho);
  const actual = cleanZero(shocked.modelValue - base.modelValue);
  return {
    base,
    shocked,
    shockedMarket,
    actual,
    delta,
    gamma,
    vega,
    theta,
    rho,
    approximate,
    residual: cleanZero(actual - approximate),
  };
}

