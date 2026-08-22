import {
  valueMarketMakingBook,
  valueMarketMakingTrade,
  validateMarketMakingMarketState,
} from "./book";
import type {
  MarketMakingBookValuation,
  MarketMakingHedgeOption,
  MarketMakingHedgeTarget,
  MarketMakingMarketState,
  MarketMakingOptionTrade,
  MarketMakingTrade,
  MarketMakingUnderlyingTrade,
} from "./types";

const HEDGE_TOLERANCE = 1e-10;

export interface SuccessfulMarketMakingHedgeProposal {
  status: "ok";
  trades: MarketMakingTrade[];
  tickets: MarketMakingTrade[];
  before: MarketMakingBookValuation;
  after: MarketMakingBookValuation;
  estimatedHedgeFriction: number;
  theoreticalOptionQuantity?: number;
  roundedOptionQuantity?: number;
}

export type MarketMakingHedgeProposal =
  | SuccessfulMarketMakingHedgeProposal
  | {
      status: "unavailable";
      reason:
        | "unknown-underlying"
        | "near-zero-gamma"
        | "near-zero-vega"
        | "expired-hedge-option"
        | "rounding-to-zero"
        | "invalid-hedge";
    };

function requireNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be finite and non-negative.`);
  }
}

function requirePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be finite and positive.`);
  }
}

function uniqueId(trades: readonly MarketMakingTrade[], base: string): string {
  const ids = new Set(trades.map((trade) => trade.id));
  if (!ids.has(base)) return base;
  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function selectedBook(
  book: MarketMakingBookValuation,
  underlyingId: string,
) {
  return book.byUnderlying.find((candidate) => candidate.underlyingId === underlyingId);
}

function createUnderlyingHedgeTrade(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
  underlyingId: string,
  signedQuantity: number,
  executionCostBps: number,
  baseId: string,
): MarketMakingUnderlyingTrade {
  requireNonNegative(executionCostBps, "Execution cost");
  const underlying = market.underlyings.find((candidate) => candidate.id === underlyingId);
  if (!underlying) throw new RangeError(`Unknown underlying: ${underlyingId}.`);
  const dealerDirection = signedQuantity >= 0 ? "long" : "short";
  const priceAdjustment = underlying.spot * executionCostBps / 10_000;
  return {
    id: uniqueId(trades, baseId),
    instrument: "underlying",
    source: "hedge",
    underlyingId,
    dealerDirection,
    quantity: Math.abs(signedQuantity),
    multiplier: 1,
    referencePrice: underlying.spot,
    executionPrice: underlying.spot + (dealerDirection === "long" ? priceAdjustment : -priceAdjustment),
    executionCostBps,
  };
}

export function proposeMarketMakingDeltaHedge(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
  underlyingId: string,
  executionCostBps: number,
): MarketMakingHedgeProposal {
  try {
    validateMarketMakingMarketState(market);
    const before = valueMarketMakingBook(trades, market);
    const risk = selectedBook(before, underlyingId);
    if (!risk) return { status: "unavailable", reason: "unknown-underlying" };
    const ticket = createUnderlyingHedgeTrade(
      trades,
      market,
      underlyingId,
      -risk.greeks.delta,
      executionCostBps,
      `${underlyingId}-delta-hedge`,
    );
    const nextTrades = [...trades.map((trade) => ({ ...trade })), ticket];
    const after = valueMarketMakingBook(nextTrades, market);
    return {
      status: "ok",
      trades: nextTrades,
      tickets: [ticket],
      before,
      after,
      estimatedHedgeFriction: after.hedgeFriction - before.hedgeFriction,
    };
  } catch {
    return { status: "unavailable", reason: "invalid-hedge" };
  }
}

function roundedSignedQuantity(value: number, lotSize: number): number {
  return Math.sign(value) * Math.round(Math.abs(value) / lotSize) * lotSize;
}

export function proposeMarketMakingOptionHedge(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
  option: MarketMakingHedgeOption,
  target: MarketMakingHedgeTarget,
  underlyingExecutionCostBps = 2,
): MarketMakingHedgeProposal {
  try {
    validateMarketMakingMarketState(market);
    requirePositive(option.multiplier, "Hedge multiplier");
    requirePositive(option.lotSize, "Hedge lot size");
    requireNonNegative(option.halfSpread, "Hedge half-spread");
    requirePositive(option.strike, "Hedge strike");
    requireNonNegative(underlyingExecutionCostBps, "Underlying execution cost");
    if (option.maturity <= market.valuationTime) {
      return { status: "unavailable", reason: "expired-hedge-option" };
    }

    const before = valueMarketMakingBook(trades, market);
    const risk = selectedBook(before, option.underlyingId);
    if (!risk) return { status: "unavailable", reason: "unknown-underlying" };
    const unitTrade: MarketMakingOptionTrade = {
      id: "hedge-unit",
      instrument: "option",
      source: "hedge",
      underlyingId: option.underlyingId,
      dealerDirection: "long",
      optionType: option.optionType,
      quantity: 1,
      multiplier: option.multiplier,
      strike: option.strike,
      maturity: option.maturity,
      referencePrice: 0,
      executionPrice: 0,
      executionHalfSpread: option.halfSpread,
    };
    const unit = valueMarketMakingTrade(unitTrade, market);
    const unitGreek = unit.greeks[target];
    if (!Number.isFinite(unitGreek) || Math.abs(unitGreek) < HEDGE_TOLERANCE) {
      return {
        status: "unavailable",
        reason: target === "gamma" ? "near-zero-gamma" : "near-zero-vega",
      };
    }

    const theoreticalOptionQuantity = -risk.greeks[target] / unitGreek;
    const roundedOptionQuantity = roundedSignedQuantity(theoreticalOptionQuantity, option.lotSize);
    if (Math.abs(roundedOptionQuantity) < HEDGE_TOLERANCE) {
      return { status: "unavailable", reason: "rounding-to-zero" };
    }
    const dealerDirection = roundedOptionQuantity >= 0 ? "long" : "short";
    const executionPrice =
      unit.modelPrice + (dealerDirection === "long" ? option.halfSpread : -option.halfSpread);
    if (executionPrice < 0) return { status: "unavailable", reason: "invalid-hedge" };
    const optionTicket: MarketMakingOptionTrade = {
      ...unitTrade,
      id: uniqueId(trades, `${option.underlyingId}-${target}-hedge-option`),
      dealerDirection,
      quantity: Math.abs(roundedOptionQuantity),
      referencePrice: unit.modelPrice,
      executionPrice,
    };
    const afterOptionTrades = [...trades.map((trade) => ({ ...trade })), optionTicket];
    const afterOption = valueMarketMakingBook(afterOptionTrades, market);
    const remainingRisk = selectedBook(afterOption, option.underlyingId);
    if (!remainingRisk) return { status: "unavailable", reason: "unknown-underlying" };
    const underlyingTicket = createUnderlyingHedgeTrade(
      afterOptionTrades,
      market,
      option.underlyingId,
      -remainingRisk.greeks.delta,
      underlyingExecutionCostBps,
      `${option.underlyingId}-${target}-delta-repair`,
    );
    const nextTrades = [...afterOptionTrades, underlyingTicket];
    const after = valueMarketMakingBook(nextTrades, market);
    return {
      status: "ok",
      trades: nextTrades,
      tickets: [optionTicket, underlyingTicket],
      before,
      after,
      theoreticalOptionQuantity,
      roundedOptionQuantity,
      estimatedHedgeFriction: after.hedgeFriction - before.hedgeFriction,
    };
  } catch {
    return { status: "unavailable", reason: "invalid-hedge" };
  }
}

export function applyMarketMakingHedge(
  proposal: SuccessfulMarketMakingHedgeProposal,
): MarketMakingTrade[] {
  return proposal.trades.map((trade) => ({ ...trade }));
}

