import type { MarketDataFreshness, MarketDataMode, MarketDataStatus, MarketInstrument, MarketQuote, MarketTick, TickDirection } from "./domain";

const finite = (value: unknown): number | null => Number.isFinite(Number(value)) ? Number(value) : null;
export const nullableNumber = finite;
export function tickDirection(change: number | null): TickDirection { return change === null || change === 0 ? "UNCHANGED" : change > 0 ? "UP" : "DOWN"; }
export function pipChange(instrument: MarketInstrument, change: number | null): number | null { return change === null || !instrument.pipSize ? null : change / instrument.pipSize; }
export function basisPointChange(change: number | null): number | null { return change === null ? null : change * 100; }

export function freshnessThresholdMs(instrument: MarketInstrument, status: MarketDataStatus): { fresh: number; aging: number } {
  if (["REFERENCE", "EOD", "DEMO"].includes(status)) return { fresh: 36 * 60 * 60_000, aging: 4 * 24 * 60 * 60_000 };
  if (instrument.assetClass === "CRYPTO") return { fresh: 5_000, aging: 20_000 };
  if (instrument.assetClass === "FX") return { fresh: 10_000, aging: 45_000 };
  return { fresh: 30_000, aging: 120_000 };
}

export function classifyFreshness(instrument: MarketInstrument, status: MarketDataStatus, receivedTimestamp: string, now = Date.now()): MarketDataFreshness {
  if (status === "OFFLINE") return "OFFLINE";
  const age = Math.max(0, now - new Date(receivedTimestamp).getTime()); const threshold = freshnessThresholdMs(instrument, status);
  if (age <= threshold.fresh) return "FRESH";
  if (age <= threshold.aging) return "AGING";
  return "STALE";
}

export function quoteFromTick(instrument: MarketInstrument, tick: MarketTick, previous: MarketQuote | null, options: { mode?: MarketDataMode; status?: MarketDataStatus; sourceUrl?: string | null; licensingMode?: MarketQuote["licensingMode"]; sessionChangePct?: number | null; high?: number | null; low?: number | null; volume?: number | null } = {}): MarketQuote {
  const previousPrice = previous?.price ?? tick.price; const change = tick.price - previousPrice; const bid = finite(tick.bid); const ask = finite(tick.ask); const mid = bid !== null && ask !== null ? (bid + ask) / 2 : null; const spread = bid !== null && ask !== null ? ask - bid : null; const sessionChangePct = options.sessionChangePct ?? previous?.sessionChangePct ?? null; const previousClose = sessionChangePct !== null && sessionChangePct !== -100 ? tick.price / (1 + sessionChangePct / 100) : previous?.previousClose ?? null; const sessionChange = previousClose !== null ? tick.price - previousClose : null; const receivedMs = new Date(tick.receivedTimestamp).getTime(); const marketMs = new Date(tick.marketTimestamp).getTime(); const status = options.status ?? "LIVE";
  return { instrumentId: instrument.id, symbol: instrument.symbol, name: instrument.name, assetClass: instrument.assetClass, instrumentType: instrument.instrumentType, price: tick.price, previousPrice, tickChange: change, tickChangePct: previousPrice ? change / previousPrice * 100 : null, tickDirection: tickDirection(change), bid, ask, mid, spread, spreadInPips: spread !== null && instrument.pipSize ? spread / instrument.pipSize : null, open: previous?.open ?? null, high: options.high ?? previous?.high ?? null, low: options.low ?? previous?.low ?? null, previousClose, sessionChange, sessionChangePct, volume: options.volume ?? tick.volume, currency: instrument.currency, exchange: instrument.exchange, marketTimestamp: tick.marketTimestamp, receivedTimestamp: tick.receivedTimestamp, asOf: tick.marketTimestamp, latencyMs: Number.isFinite(receivedMs - marketMs) ? Math.max(0, receivedMs - marketMs) : null, status, freshness: classifyFreshness(instrument, status, tick.receivedTimestamp), dataMode: options.mode ?? "LIVE_STREAM", source: tick.source, sourceUrl: options.sourceUrl ?? previous?.sourceUrl ?? null, provider: "COINBASE", licensingMode: options.licensingMode ?? "PRIVATE_BETA", resolution: "tick", sessionLabel: instrument.session === "24H" ? "24H" : "SESSION", history: [...(previous?.history ?? []), tick.price].slice(-120), notice: "Public unauthenticated stream; private-beta display only under current market-data terms." };
}

export function unavailableQuote(instrument: MarketInstrument, mode: MarketDataMode, notice: string): MarketQuote {
  const now = new Date().toISOString(); return { instrumentId: instrument.id, symbol: instrument.symbol, name: instrument.name, assetClass: instrument.assetClass, instrumentType: instrument.instrumentType, price: null, previousPrice: null, tickChange: null, tickChangePct: null, tickDirection: "UNCHANGED", bid: null, ask: null, mid: null, spread: null, spreadInPips: null, open: null, high: null, low: null, previousClose: null, sessionChange: null, sessionChangePct: null, volume: null, currency: instrument.currency, exchange: instrument.exchange, marketTimestamp: null, receivedTimestamp: now, asOf: now, latencyMs: null, status: "OFFLINE", freshness: "OFFLINE", dataMode: mode, source: "Not configured", sourceUrl: null, provider: "DEMO", licensingMode: "PUBLIC_DEMO", resolution: null, sessionLabel: instrument.session, history: [], notice };
}

export function formatMarketPrice(quote: MarketQuote, instrument: MarketInstrument): string { if (quote.price === null) return "—"; if (instrument.unit === "%") return `${quote.price.toFixed(instrument.displayPrecision)}%`; return quote.price.toLocaleString("en-US", { minimumFractionDigits: instrument.displayPrecision, maximumFractionDigits: instrument.displayPrecision }); }
export function formatTickMove(quote: MarketQuote, instrument: MarketInstrument): string { if (quote.tickChange === null) return "—"; if (instrument.assetClass === "FX" && instrument.pipSize) return `${signed(quote.tickChange / instrument.pipSize, 1)}p`; if (instrument.assetClass === "RATES") return `${signed(basisPointChange(quote.tickChange) ?? 0, 1)}bp`; return signed(quote.tickChange, instrument.displayPrecision);
}
export function formatSessionMove(quote: MarketQuote, instrument: MarketInstrument): string { if (instrument.assetClass === "RATES" && quote.sessionChange !== null) return `${signed(basisPointChange(quote.sessionChange) ?? 0, 1)}bp`; return quote.sessionChangePct === null ? "—" : `${signed(quote.sessionChangePct, 2)}%`; }
const signed = (value: number, precision: number) => `${value > 0 ? "+" : ""}${value.toFixed(precision)}`;
