import type { PredictionBook, PredictionBookLevel, PredictionLivePatch, PredictionTrade } from "./domain";

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord => value !== null && typeof value === "object" ? value as UnknownRecord : {};
const numberOrNull = (value: unknown): number | null => Number.isFinite(Number(value)) ? Number(value) : null;
const text = (value: unknown): string => value === null || value === undefined ? "" : String(value);
const timestamp = (value: unknown): number => {
  const number = Number(value);
  if (!Number.isFinite(number)) return Date.now();
  return number < 10_000_000_000 ? number * 1_000 : number;
};

function levels(value: unknown, descending: boolean): PredictionBookLevel[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): PredictionBookLevel[] => {
    const item = record(entry); const price = numberOrNull(item.price); const size = numberOrNull(item.size);
    return price !== null && size !== null && size > 0 ? [{ price, size }] : [];
  }).sort((left, right) => descending ? right.price - left.price : left.price - right.price);
}

export function buildBook(marketId: string, tokenId: string, bids: PredictionBookLevel[], asks: PredictionBookLevel[], observedAt = Date.now(), hash: string | null = null): PredictionBook {
  const sortedBids = [...bids].filter((level) => level.size > 0).sort((left, right) => right.price - left.price);
  const sortedAsks = [...asks].filter((level) => level.size > 0).sort((left, right) => left.price - right.price);
  const bestBid = sortedBids[0]?.price ?? null; const bestAsk = sortedAsks[0]?.price ?? null;
  const bidDepth = sortedBids.reduce((sum, level) => sum + level.size, 0); const askDepth = sortedAsks.reduce((sum, level) => sum + level.size, 0);
  return { marketId, tokenId, bids: sortedBids, asks: sortedAsks, bestBid, bestAsk, mid: bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null, spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null, bidDepth, askDepth, imbalance: bidDepth + askDepth > 0 ? (bidDepth - askDepth) / (bidDepth + askDepth) : null, observedAt, hash };
}

export function normalizeRestBook(value: unknown): PredictionBook {
  const item = record(value); const marketId = text(item.market); const tokenId = text(item.asset_id);
  return buildBook(marketId, tokenId, levels(item.bids, true), levels(item.asks, false), timestamp(item.timestamp), text(item.hash) || null);
}

export class PredictionBookState {
  readonly tokenToMarket: ReadonlyMap<string, string>;
  private books = new Map<string, PredictionBook>();
  private lastByToken = new Map<string, number>();
  private trades = new Set<string>();

  constructor(tokenToMarket: ReadonlyMap<string, string>) { this.tokenToMarket = tokenToMarket; }

  get(tokenId: string): PredictionBook | undefined { return this.books.get(tokenId); }
  isStale(tokenId: string, now = Date.now(), thresholdMs = 30_000): boolean { return now - (this.lastByToken.get(tokenId) ?? 0) > thresholdMs; }

  apply(message: unknown): PredictionLivePatch[] {
    const messages = Array.isArray(message) ? message : [message];
    return messages.flatMap((value) => this.applyOne(record(value)));
  }

  private applyOne(item: UnknownRecord): PredictionLivePatch[] {
    const eventType = text(item.event_type); const tokenId = text(item.asset_id); const marketId = this.tokenToMarket.get(tokenId) || text(item.market) || "";
    const observedAt = timestamp(item.timestamp);
    if (eventType === "book" && tokenId) {
      if (observedAt < (this.lastByToken.get(tokenId) ?? 0)) return [];
      const book = buildBook(marketId, tokenId, levels(item.bids, true), levels(item.asks, false), observedAt, text(item.hash) || null);
      this.books.set(tokenId, book); this.lastByToken.set(tokenId, observedAt);
      return [{ type: "book", book }, { type: "quote", marketId, tokenId, bid: book.bestBid, ask: book.bestAsk, mid: book.mid, spread: book.spread, last: null, observedAt, sourceEvent: "book" }];
    }
    if (eventType === "price_change") {
      const changes = Array.isArray(item.price_changes) ? item.price_changes : [];
      return changes.flatMap((changeValue): PredictionLivePatch[] => {
        const change = record(changeValue); const assetId = text(change.asset_id); if (!assetId) return [];
        if (observedAt < (this.lastByToken.get(assetId) ?? 0)) return [];
        const current = this.books.get(assetId) ?? buildBook(this.tokenToMarket.get(assetId) ?? marketId, assetId, [], [], observedAt);
        const side = text(change.side); const price = numberOrNull(change.price); const size = numberOrNull(change.size); let bids = current.bids; let asks = current.asks;
        if (price !== null && size !== null) {
          const update = (source: PredictionBookLevel[]) => size === 0 ? source.filter((level) => level.price !== price) : [...source.filter((level) => level.price !== price), { price, size }];
          if (side === "BUY") bids = update(bids); else if (side === "SELL") asks = update(asks);
        }
        const book = buildBook(current.marketId, assetId, bids, asks, observedAt, text(change.hash) || current.hash);
        const explicitBid = numberOrNull(change.best_bid); const explicitAsk = numberOrNull(change.best_ask);
        if (explicitBid !== null) book.bestBid = explicitBid; if (explicitAsk !== null) book.bestAsk = explicitAsk;
        book.mid = book.bestBid !== null && book.bestAsk !== null ? (book.bestBid + book.bestAsk) / 2 : null;
        book.spread = book.bestBid !== null && book.bestAsk !== null ? book.bestAsk - book.bestBid : null;
        this.books.set(assetId, book); this.lastByToken.set(assetId, observedAt);
        return [{ type: "book", book }, { type: "quote", marketId: book.marketId, tokenId: assetId, bid: book.bestBid, ask: book.bestAsk, mid: book.mid, spread: book.spread, last: null, observedAt, sourceEvent: "price_change" }];
      });
    }
    if ((eventType === "best_bid_ask" || eventType === "last_trade_price") && tokenId) {
      if (observedAt < (this.lastByToken.get(tokenId) ?? 0)) return [];
      const current = this.books.get(tokenId); const bid = numberOrNull(item.best_bid) ?? current?.bestBid ?? null; const ask = numberOrNull(item.best_ask) ?? current?.bestAsk ?? null; const last = numberOrNull(item.price);
      const patches: PredictionLivePatch[] = [{ type: "quote", marketId, tokenId, bid, ask, mid: bid !== null && ask !== null ? (bid + ask) / 2 : null, spread: bid !== null && ask !== null ? ask - bid : null, last, observedAt, sourceEvent: eventType }];
      if (eventType === "last_trade_price" && last !== null) {
        const size = numberOrNull(item.size) ?? 0; const transactionHash = text(item.transaction_hash) || null; const identity = transactionHash || `${marketId}:${tokenId}:${observedAt}:${last}:${size}:${text(item.side)}`;
        if (!this.trades.has(identity)) { this.trades.add(identity); if (this.trades.size > 2_000) this.trades = new Set([...this.trades].slice(-1_000)); const trade: PredictionTrade = { identity, marketId, tokenId, timestamp: observedAt, price: last, size, side: text(item.side) === "SELL" ? "SELL" : "BUY", transactionHash }; patches.push({ type: "trade", trade }); }
      }
      this.lastByToken.set(tokenId, observedAt); return patches;
    }
    if (["new_market", "market_resolved", "tick_size_change"].includes(eventType)) return [{ type: "lifecycle", marketId, event: eventType as "new_market" | "market_resolved" | "tick_size_change", observedAt }];
    return [];
  }
}
