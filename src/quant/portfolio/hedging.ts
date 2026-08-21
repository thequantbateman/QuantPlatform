import type {
  OptionPosition,
  PortfolioMarketState,
  PortfolioPosition,
  PortfolioValuation,
  UnderlyingPosition,
} from "./types";
import {
  validatePosition,
  valuePortfolio,
  valuePosition,
} from "./valuation";

const HEDGE_TOLERANCE = 1e-10;

export type OptionHedgeTarget = "gamma" | "vega";

export interface SuccessfulHedgeProposal {
  status: "ok";
  positions: PortfolioPosition[];
  tickets: PortfolioPosition[];
  before: PortfolioValuation;
  after: PortfolioValuation;
}

export type HedgeProposal =
  | SuccessfulHedgeProposal
  | {
      status: "unavailable";
      reason: "near-zero-gamma" | "near-zero-vega" | "invalid-hedge";
    };

function uniqueId(book: readonly PortfolioPosition[], base: string): string {
  const ids = new Set(book.map((position) => position.id));
  if (!ids.has(base)) return base;
  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function stockTicket(
  book: readonly PortfolioPosition[],
  market: PortfolioMarketState,
  signedQuantity: number,
  baseId: string,
): UnderlyingPosition {
  return {
    id: uniqueId(book, baseId),
    instrument: "underlying",
    direction: signedQuantity >= 0 ? "long" : "short",
    quantity: Math.abs(signedQuantity),
    multiplier: 1,
    entryPrice: market.spot,
  };
}

export function proposeDeltaHedge(
  book: readonly PortfolioPosition[],
  market: PortfolioMarketState,
): SuccessfulHedgeProposal {
  const before = valuePortfolio(book, market);
  const ticket = stockTicket(book, market, -before.greeks.delta, "delta-hedge");
  const positions = [...book, ticket];
  return {
    status: "ok",
    positions,
    tickets: [ticket],
    before,
    after: valuePortfolio(positions, market),
  };
}

export function proposeOptionHedge(
  book: readonly PortfolioPosition[],
  market: PortfolioMarketState,
  hedgeOption: OptionPosition,
  target: OptionHedgeTarget,
): HedgeProposal {
  try {
    validatePosition(hedgeOption);
    const before = valuePortfolio(book, market);
    const oneContract = valuePosition(
      { ...hedgeOption, direction: "long", quantity: 1 },
      market,
    );
    const hedgeGreek = oneContract.greeks[target];
    if (!Number.isFinite(hedgeGreek) || Math.abs(hedgeGreek) < HEDGE_TOLERANCE) {
      return {
        status: "unavailable",
        reason: target === "gamma" ? "near-zero-gamma" : "near-zero-vega",
      };
    }
    const signedOptionQuantity = -before.greeks[target] / hedgeGreek;
    const optionTicket: OptionPosition = {
      ...hedgeOption,
      id: uniqueId(book, `${target}-hedge-option`),
      direction: signedOptionQuantity >= 0 ? "long" : "short",
      quantity: Math.abs(signedOptionQuantity),
    };
    const afterOptionBook = [...book, optionTicket];
    const afterOption = valuePortfolio(afterOptionBook, market);
    const underlyingTicket = stockTicket(
      afterOptionBook,
      market,
      -afterOption.greeks.delta,
      `${target}-hedge-delta`,
    );
    const positions = [...afterOptionBook, underlyingTicket];
    return {
      status: "ok",
      positions,
      tickets: [optionTicket, underlyingTicket],
      before,
      after: valuePortfolio(positions, market),
    };
  } catch {
    return { status: "unavailable", reason: "invalid-hedge" };
  }
}

export function applyHedgeProposal(
  proposal: SuccessfulHedgeProposal,
): PortfolioPosition[] {
  return proposal.positions.map((position) => ({ ...position }));
}
