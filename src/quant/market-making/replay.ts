import { validateMarketMakingMarketState, valueMarketMakingBook } from "./book";
import type {
  MarketMakingMarketState,
  MarketMakingTrade,
} from "./types";

export interface MarketMakingReplayShock {
  spotMovePercent: number;
  volatilityLevelMove: number;
  skewMove: number;
  rateMove: number;
}

export interface MarketMakingReplayEvent {
  id: string;
  label: string;
  elapsedDays: number;
  shocks: Readonly<Record<string, MarketMakingReplayShock>>;
}

export interface MarketMakingReplayLedgerEntry {
  id: string;
  label: string;
  kind: "market" | "hedge";
  marketPnl: number;
  financingPnl: number;
  liquidityPnl: number;
  wealthChange: number;
  reconciliation: number;
}

export interface MarketMakingReplayState {
  stepIndex: number;
  market: MarketMakingMarketState;
  trades: MarketMakingTrade[];
  financingRate: number;
  cash: number;
  wealth: number;
  initialWealth: number;
  pnl: number;
  ledger: MarketMakingReplayLedgerEntry[];
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

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

function cleanZero(value: number): number {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

function validateReplayEvent(event: MarketMakingReplayEvent): void {
  if (event.id.trim().length === 0 || event.label.trim().length === 0) {
    throw new TypeError("Replay event id and label must be non-empty.");
  }
  requireFinite(event.elapsedDays, "Elapsed days");
  if (event.elapsedDays < 0) throw new RangeError("Elapsed days cannot be negative.");
  for (const shock of Object.values(event.shocks)) {
    for (const [key, value] of Object.entries(shock)) requireFinite(value, key);
    if (shock.spotMovePercent <= -1) throw new RangeError("Spot move must preserve positive spot.");
  }
}

function applyReplayEvent(
  market: MarketMakingMarketState,
  event: MarketMakingReplayEvent,
): MarketMakingMarketState {
  validateReplayEvent(event);
  const knownIds = new Set(market.underlyings.map((underlying) => underlying.id));
  for (const id of Object.keys(event.shocks)) {
    if (!knownIds.has(id)) throw new RangeError(`Unknown underlying: ${id}.`);
  }
  const next: MarketMakingMarketState = {
    valuationTime: market.valuationTime + event.elapsedDays / 365,
    underlyings: market.underlyings.map((underlying) => {
      const shock = event.shocks[underlying.id];
      if (!shock) return { ...underlying, surface: { ...underlying.surface } };
      return {
        ...underlying,
        spot: underlying.spot * (1 + shock.spotMovePercent),
        rate: underlying.rate + shock.rateMove,
        surface: {
          ...underlying.surface,
          atmVolatility: underlying.surface.atmVolatility + shock.volatilityLevelMove,
          skew: underlying.surface.skew + shock.skewMove,
        },
      };
    }),
  };
  validateMarketMakingMarketState(next);
  return next;
}

export function startMarketMakingReplay(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
  financingRate: number,
): MarketMakingReplayState {
  requireFinite(financingRate, "Financing rate");
  const clonedMarket = cloneMarket(market);
  const clonedTrades = cloneTrades(trades);
  const book = valueMarketMakingBook(clonedTrades, clonedMarket);
  const cash = -book.executionValue;
  const wealth = book.modelValue + cash;
  return {
    stepIndex: 0,
    market: clonedMarket,
    trades: clonedTrades,
    financingRate,
    cash,
    wealth,
    initialWealth: wealth,
    pnl: 0,
    ledger: [],
  };
}

export function advanceMarketMakingReplay(
  state: MarketMakingReplayState,
  event: MarketMakingReplayEvent,
): MarketMakingReplayState {
  const nextMarket = applyReplayEvent(state.market, event);
  const beforeBook = valueMarketMakingBook(state.trades, state.market);
  const afterBook = valueMarketMakingBook(state.trades, nextMarket);
  const accruedCash = state.cash * Math.exp(state.financingRate * event.elapsedDays / 365);
  const financingPnl = cleanZero(accruedCash - state.cash);
  const marketPnl = cleanZero(afterBook.modelValue - beforeBook.modelValue);
  const wealth = afterBook.modelValue + accruedCash;
  const wealthChange = cleanZero(wealth - state.wealth);
  const reconciliation = cleanZero(wealthChange - marketPnl - financingPnl);
  const entry: MarketMakingReplayLedgerEntry = {
    id: event.id,
    label: event.label,
    kind: "market",
    marketPnl,
    financingPnl,
    liquidityPnl: 0,
    wealthChange,
    reconciliation,
  };
  return {
    ...state,
    stepIndex: state.stepIndex + 1,
    market: nextMarket,
    trades: cloneTrades(state.trades),
    cash: accruedCash,
    wealth,
    pnl: cleanZero(wealth - state.initialWealth),
    ledger: [...state.ledger.map((item) => ({ ...item })), entry],
  };
}

export function executeMarketMakingReplayHedge(
  state: MarketMakingReplayState,
  tickets: readonly MarketMakingTrade[],
  label: string,
): MarketMakingReplayState {
  if (label.trim().length === 0) throw new TypeError("Hedge ledger label must be non-empty.");
  if (tickets.length === 0 || tickets.some((ticket) => ticket.source !== "hedge")) {
    throw new RangeError("Replay hedge must contain at least one hedge ticket.");
  }
  const existingIds = new Set(state.trades.map((trade) => trade.id));
  for (const ticket of tickets) {
    if (existingIds.has(ticket.id)) throw new RangeError(`Duplicate replay trade id: ${ticket.id}.`);
    existingIds.add(ticket.id);
  }
  const clonedTickets = cloneTrades(tickets);
  const ticketBook = valueMarketMakingBook(clonedTickets, state.market);
  const nextTrades = [...cloneTrades(state.trades), ...clonedTickets];
  const nextBook = valueMarketMakingBook(nextTrades, state.market);
  const cash = state.cash - ticketBook.executionValue;
  const wealth = nextBook.modelValue + cash;
  const liquidityPnl = cleanZero(ticketBook.modelValue - ticketBook.executionValue);
  const wealthChange = cleanZero(wealth - state.wealth);
  const reconciliation = cleanZero(wealthChange - liquidityPnl);
  const entry: MarketMakingReplayLedgerEntry = {
    id: `hedge-${state.ledger.length + 1}`,
    label,
    kind: "hedge",
    marketPnl: 0,
    financingPnl: 0,
    liquidityPnl,
    wealthChange,
    reconciliation,
  };
  return {
    ...state,
    market: cloneMarket(state.market),
    trades: nextTrades,
    cash,
    wealth,
    pnl: cleanZero(wealth - state.initialWealth),
    ledger: [...state.ledger.map((item) => ({ ...item })), entry],
  };
}

export function replayReconciliation(state: MarketMakingReplayState): number {
  const explained = state.ledger.reduce((sum, entry) => sum + entry.wealthChange, 0);
  return cleanZero(state.wealth - state.initialWealth - explained);
}

