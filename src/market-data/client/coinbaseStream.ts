"use client";

import { findInstrument, mappingsFor } from "../instrumentMaster";
import type { InstrumentId, MarketTick, ProviderHealth } from "../domain";
import { marketStateStore } from "./store";

type CoinbaseTicker = { product_id?: string; price?: string; best_bid?: string; best_ask?: string; volume_24_h?: string; high_24_h?: string; low_24_h?: string; price_percent_chg_24_h?: string };
type CoinbaseMessage = { channel?: string; timestamp?: string; events?: { type?: string; tickers?: CoinbaseTicker[] }[] };

class CoinbaseStreamingClient {
  private socket: WebSocket | null = null; private requested = new Map<InstrumentId, number>(); private reconnectAttempt = 0; private reconnectTimer: number | null = null; private closedByClient = false; private lastQuote: string | null = null;
  watch(instrumentIds: InstrumentId[]): () => void { const eligible = instrumentIds.filter((id) => mappingsFor(id, "COINBASE").length); for (const id of eligible) this.requested.set(id, (this.requested.get(id) ?? 0) + 1); if (eligible.length) this.connect(); this.sync(); return () => { for (const id of eligible) { const count = (this.requested.get(id) ?? 1) - 1; if (count <= 0) this.requested.delete(id); else this.requested.set(id, count); } this.sync(); if (!this.requested.size) this.disconnect(); }; }
  private products(): string[] { return [...this.requested.keys()].flatMap((id) => mappingsFor(id, "COINBASE")[0]?.vendorSymbol ?? []); }
  private connect(): void { if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) return; this.closedByClient = false; this.setHealth("DISCONNECTED", null); const socket = new WebSocket("wss://advanced-trade-ws.coinbase.com"); this.socket = socket; socket.onopen = () => { this.reconnectAttempt = 0; this.setHealth("CONNECTED", null); this.sync(); socket.send(JSON.stringify({ type: "subscribe", channel: "heartbeats" })); }; socket.onmessage = (event) => this.onMessage(String(event.data)); socket.onerror = () => this.setHealth("ERROR", "Coinbase WebSocket transport error"); socket.onclose = () => { this.socket = null; if (this.closedByClient || !this.requested.size) { this.setHealth("DISCONNECTED", null); return; } this.setHealth("DEGRADED", "Feed disconnected; reconnect scheduled"); this.scheduleReconnect(); }; }
  private sync(): void { if (this.socket?.readyState !== WebSocket.OPEN) return; const product_ids = this.products(); if (product_ids.length) this.socket.send(JSON.stringify({ type: "subscribe", channel: "ticker", product_ids })); }
  private onMessage(raw: string): void { let message: CoinbaseMessage; try { message = JSON.parse(raw) as CoinbaseMessage; } catch { return; } if (message.channel !== "ticker") return; const receivedTimestamp = new Date().toISOString(); for (const event of message.events ?? []) for (const ticker of event.tickers ?? []) { const mapping = [...this.requested.keys()].find((id) => mappingsFor(id, "COINBASE")[0]?.vendorSymbol === ticker.product_id); const price = Number(ticker.price); if (!mapping || !Number.isFinite(price)) continue; const tick: MarketTick = { instrumentId: mapping, price, bid: value(ticker.best_bid), ask: value(ticker.best_ask), volume: value(ticker.volume_24_h), marketTimestamp: message.timestamp ?? receivedTimestamp, receivedTimestamp, source: "Coinbase Advanced public WebSocket" }; this.lastQuote = receivedTimestamp; marketStateStore.applyCoinbaseTick(tick, { sessionChangePct: value(ticker.price_percent_chg_24_h), high: value(ticker.high_24_h), low: value(ticker.low_24_h), volume: value(ticker.volume_24_h) }); this.setHealth("CONNECTED", null); } }
  private scheduleReconnect(): void { if (this.reconnectTimer !== null) return; const delay = Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt++) + Math.floor(Math.random() * 250); this.reconnectTimer = window.setTimeout(() => { this.reconnectTimer = null; this.connect(); }, delay); }
  private disconnect(): void { this.closedByClient = true; if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer); this.reconnectTimer = null; this.socket?.close(); this.socket = null; }
  private setHealth(state: ProviderHealth["state"], lastError: string | null): void { marketStateStore.setHealth({ state, checkedAt: new Date().toISOString(), lastSuccessfulQuote: this.lastQuote, lastError, latencyMs: null, subscriptionCount: this.requested.size }); }
}

const value = (input: string | undefined): number | null => Number.isFinite(Number(input)) ? Number(input) : null;
export const coinbaseStreamingClient = new CoinbaseStreamingClient();
export const coinbaseInstrumentIds = ["crypto-btcusd", "crypto-ethusd"].filter((id) => findInstrument(id));
