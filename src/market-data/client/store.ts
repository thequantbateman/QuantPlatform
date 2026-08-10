"use client";

import { findInstrument, mappingsFor } from "../instrumentMaster";
import type { InstrumentId, MarketQuote, MarketSnapshot, MarketTick, ProviderHealth } from "../domain";
import { classifyFreshness, quoteFromTick } from "../normalization";

type Listener = () => void;
class MarketStateStore {
  private quotes = new Map<InstrumentId, MarketQuote>(); private listeners = new Map<InstrumentId, Set<Listener>>(); private healthListeners = new Set<Listener>(); private health: ProviderHealth = { state: "DISCONNECTED", checkedAt: new Date(0).toISOString(), lastSuccessfulQuote: null, lastError: null, latencyMs: null, subscriptionCount: 0 };
  getQuote = (id: InstrumentId): MarketQuote | undefined => this.quotes.get(id);
  subscribe = (id: InstrumentId, listener: Listener): (() => void) => { const listeners = this.listeners.get(id) ?? new Set(); listeners.add(listener); this.listeners.set(id, listeners); return () => { listeners.delete(listener); if (!listeners.size) this.listeners.delete(id); }; };
  subscribeHealth = (listener: Listener): (() => void) => { this.healthListeners.add(listener); return () => this.healthListeners.delete(listener); };
  getHealth = (): ProviderHealth => this.health;
  setHealth(next: ProviderHealth): void { this.health = next; this.healthListeners.forEach((listener) => listener()); }
  applySnapshot(snapshot: MarketSnapshot): void { for (const quote of snapshot.quotes) this.setQuote(quote); }
  applyCoinbaseTick(tick: MarketTick, fields: { sessionChangePct: number | null; high: number | null; low: number | null; volume: number | null }): void { const instrument = findInstrument(tick.instrumentId); if (!instrument) return; const previous = this.quotes.get(tick.instrumentId) ?? null; const mapping = mappingsFor(tick.instrumentId, "COINBASE")[0]; this.setQuote(quoteFromTick(instrument, tick, previous, { sourceUrl: mapping?.sourceUrl, sessionChangePct: fields.sessionChangePct, high: fields.high, low: fields.low, volume: fields.volume })); }
  refreshFreshness(now = Date.now()): void { for (const [id, quote] of this.quotes) { const instrument = findInstrument(id); if (!instrument || quote.status !== "LIVE") continue; const freshness = classifyFreshness(instrument, quote.status, quote.receivedTimestamp, now); if (freshness !== quote.freshness) this.setQuote({ ...quote, freshness, status: freshness === "STALE" || freshness === "OFFLINE" ? "STALE" : quote.status }); } }
  private setQuote(quote: MarketQuote): void { this.quotes.set(quote.instrumentId, quote); this.listeners.get(quote.instrumentId)?.forEach((listener) => listener()); }
}

export const marketStateStore = new MarketStateStore();
