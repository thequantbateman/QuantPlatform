import type { PredictionBook, PredictionEvent, PredictionHistoryPoint, PredictionMarket, PredictionStats, PredictionTrade } from "./domain";
import { normalizeRestBook } from "./book";
import { flattenMarkets, normalizeGammaEvents, normalizeGammaMarket } from "./normalize";

const GAMMA = "https://gamma-api.polymarket.com";
const CLOB = "https://clob.polymarket.com";
const DATA = "https://data-api.polymarket.com";

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord => value !== null && typeof value === "object" ? value as UnknownRecord : {};
const numberOrNull = (value: unknown): number | null => Number.isFinite(Number(value)) ? Number(value) : null;
const text = (value: unknown): string => value === null || value === undefined ? "" : String(value);

async function publicJson(url: string, timeoutMs = 7_500): Promise<unknown> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json", "user-agent": "TheQuantBateman/0.1 public-read-only" } });
    if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
    return await response.json() as unknown;
  } finally { clearTimeout(timer); }
}

export interface DiscoveryRequest { limit?: number; offset?: number; query?: string; tagId?: string; order?: "volume" | "liquidity" | "volume24hr" | "updatedAt" }
export interface DiscoveryResult { events: PredictionEvent[]; markets: PredictionMarket[]; receivedAt: string; source: string }

export function compactPredictionDiscovery(discovery: DiscoveryResult, marketsPerEvent = 8): DiscoveryResult {
  const events = discovery.events.map((event) => ({ ...event, description: event.description.slice(0, 480), markets: [...event.markets].filter((market) => market.active && !market.closed).sort((left, right) => right.volume24h - left.volume24h || right.volume - left.volume).slice(0, marketsPerEvent).map((market) => ({ ...market, description: "" })) }));
  return { ...discovery, events, markets: flattenMarkets(events) };
}

export async function discoverPredictionEvents(request: DiscoveryRequest = {}): Promise<DiscoveryResult> {
  const limit = Math.min(100, Math.max(1, request.limit ?? 40)); const query = request.query?.trim();
  const params = new URLSearchParams(); let path = "/events";
  if (query) { path = "/public-search"; params.set("q", query.slice(0, 100)); params.set("limit_per_type", String(Math.min(limit, 25))); }
  else {
    params.set("active", "true"); params.set("closed", "false"); params.set("limit", String(limit)); params.set("offset", String(Math.max(0, request.offset ?? 0))); params.set("order", request.order ?? "volume"); params.set("ascending", "false");
    if (request.tagId) params.set("tag_id", request.tagId);
  }
  const payload = await publicJson(`${GAMMA}${path}?${params}`); const events = normalizeGammaEvents(query ? record(payload).events : payload).filter((event) => event.active && !event.closed && event.markets.some((market) => market.active && !market.closed));
  return { events, markets: flattenMarkets(events).filter((market) => market.active && !market.closed), receivedAt: new Date().toISOString(), source: "Polymarket Gamma API" };
}

export async function getPredictionEvent(slugOrId: string): Promise<PredictionEvent | null> {
  const safe = slugOrId.slice(0, 180); const key = /^\d+$/.test(safe) ? "id" : "slug";
  const payload = await publicJson(`${GAMMA}/events?${key}=${encodeURIComponent(safe)}&limit=1`);
  return normalizeGammaEvents(payload)[0] ?? null;
}

export async function getPredictionMarket(marketId: string, event?: PredictionEvent): Promise<PredictionMarket | null> {
  if (event) return event.markets.find((market) => market.id === marketId || market.slug === marketId || market.conditionId === marketId) ?? null;
  const payload = await publicJson(`${GAMMA}/markets/${encodeURIComponent(marketId.slice(0, 180))}`);
  const market = record(payload); const syntheticEvent = { id: text(record(Array.isArray(market.events) ? market.events[0] : {}).id) || `market-${marketId}`, slug: text(record(Array.isArray(market.events) ? market.events[0] : {}).slug) || text(market.slug), title: text(market.question), category: "Other" };
  return normalizeGammaMarket(payload, syntheticEvent);
}

export async function getPredictionHistory(tokenId: string, range = "7d"): Promise<PredictionHistoryPoint[]> {
  const options: Record<string, { interval: string; fidelity: string }> = { "1h": { interval: "1d", fidelity: "1" }, "1d": { interval: "1d", fidelity: "5" }, "7d": { interval: "1w", fidelity: "30" }, "30d": { interval: "1m", fidelity: "120" }, all: { interval: "all", fidelity: "1440" } };
  const selected = options[range] ?? options["7d"]; const params = new URLSearchParams({ market: tokenId, ...selected }); const payload = record(await publicJson(`${CLOB}/prices-history?${params}`));
  return (Array.isArray(payload.history) ? payload.history : []).flatMap((value): PredictionHistoryPoint[] => { const item = record(value); const time = numberOrNull(item.t); const probability = numberOrNull(item.p); return time !== null && probability !== null && probability >= 0 && probability <= 1 ? [{ timestamp: time < 10_000_000_000 ? time * 1_000 : time, probability }] : []; });
}

export async function getPredictionBook(tokenId: string): Promise<PredictionBook> { return normalizeRestBook(await publicJson(`${CLOB}/book?token_id=${encodeURIComponent(tokenId)}`)); }

export async function getPredictionTrades(market: PredictionMarket, limit = 50): Promise<PredictionTrade[]> {
  const payload = await publicJson(`${DATA}/trades?market=${encodeURIComponent(market.conditionId)}&limit=${Math.min(100, Math.max(1, limit))}`);
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((value): PredictionTrade[] => { const item = record(value); const price = numberOrNull(item.price); const size = numberOrNull(item.size); const timestamp = numberOrNull(item.timestamp); const tokenId = text(item.asset); if (price === null || size === null || timestamp === null || !tokenId) return []; const transactionHash = text(item.transactionHash) || null; return [{ identity: transactionHash || `${market.id}:${tokenId}:${timestamp}:${price}:${size}:${text(item.side)}`, marketId: market.id, tokenId, timestamp: timestamp < 10_000_000_000 ? timestamp * 1_000 : timestamp, price, size, side: text(item.side) === "SELL" ? "SELL" : "BUY", transactionHash }]; });
}

export async function getPredictionStats(market: PredictionMarket): Promise<PredictionStats> {
  const [openInterestResult, holdersResult] = await Promise.allSettled([
    publicJson(`${DATA}/oi?market=${encodeURIComponent(market.conditionId)}`),
    publicJson(`${DATA}/holders?market=${encodeURIComponent(market.conditionId)}&limit=20`),
  ]);
  const oiPayload = openInterestResult.status === "fulfilled" && Array.isArray(openInterestResult.value) ? record(openInterestResult.value[0]) : {};
  const holdersPayload = holdersResult.status === "fulfilled" && Array.isArray(holdersResult.value) ? holdersResult.value : [];
  const holders = holdersPayload.reduce((sum, value) => sum + (Array.isArray(record(value).holders) ? (record(value).holders as unknown[]).length : 0), 0);
  return { marketId: market.id, observedAt: Date.now(), volume: market.volume, volume24h: market.volume24h, liquidity: market.liquidity, openInterest: numberOrNull(oiPayload.value) ?? market.openInterest, holders: holders || null };
}

export const polymarketEndpoints = { gamma: GAMMA, clob: CLOB, data: DATA, websocket: "wss://ws-subscriptions-clob.polymarket.com/ws/market" } as const;
