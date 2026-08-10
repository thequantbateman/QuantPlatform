import type { DataStatus, MarketDataProvider, MarketMetadata, MarketQuote } from "./markets";
import { MockMarketDataProvider } from "./markets";

type FetchLike = typeof fetch;
export type ProviderEnvironment = "PUBLIC_REFERENCE" | "PUBLIC_DEMO" | "LICENSED_SERVER";
export interface ProviderCapabilities { quotes: boolean; history: boolean; search: boolean; streaming: boolean; assetClasses: string[]; redistribution: "PUBLIC" | "LICENSE_REQUIRED" | "INTERNAL_ONLY"; }
export interface ProviderHealth { state: "HEALTHY" | "DEGRADED" | "UNAVAILABLE"; checkedAt: string; latencyMs: number | null; detail: string; }
export interface StreamSubscription { unsubscribe(): void; }
export interface StreamingMarketDataProvider extends MarketDataProvider { subscribe(symbols: string[], onQuote: (quote: MarketQuote) => void, onState: (health: ProviderHealth) => void): StreamSubscription; }

export const providerCapabilities = {
  demo: { quotes: true, history: true, search: true, streaming: false, assetClasses: ["FX", "EQ", "IR", "COMM"], redistribution: "PUBLIC" },
  ecb: { quotes: false, history: true, search: false, streaming: false, assetClasses: ["FX", "IR"], redistribution: "PUBLIC" },
  twelveData: { quotes: true, history: true, search: true, streaming: true, assetClasses: ["FX", "EQ", "COMM"], redistribution: "LICENSE_REQUIRED" },
} satisfies Record<string, ProviderCapabilities>;

export class TwelveDataMarketDataProvider implements MarketDataProvider {
  constructor(private readonly apiKey: string, private readonly fetcher: FetchLike = fetch) {}
  async getQuote(symbol: string): Promise<MarketQuote | null> {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await this.fetcher(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(this.apiKey)}`, { signal: controller.signal });
      if (response.status === 429) throw new Error("Twelve Data rate limit reached.");
      if (!response.ok) throw new Error(`Twelve Data unavailable (${response.status}).`);
      const raw = await response.json() as Record<string, string>;
      if (raw.status === "error") throw new Error(raw.message || "Twelve Data error.");
      const now = new Date().toISOString(); const price = Number(raw.close);
      return { symbol: symbol.replace("/", "").toUpperCase(), displaySymbol: symbol, name: raw.name || symbol, assetClass: symbol.includes("/") ? "FX" : "EQ", price, change: Number(raw.change), changePercent: Number(raw.percent_change), open: Number(raw.open), high: Number(raw.high), low: Number(raw.low), previousClose: Number(raw.previous_close), currency: raw.currency || "", marketTimestamp: raw.datetime ? new Date(raw.datetime).toISOString() : now, receivedTimestamp: now, status: "NEAR_REAL_TIME", source: "Twelve Data", history: [price], pricerMode: symbol.includes("/") ? "fx" : "equity" };
    } finally { clearTimeout(timer); }
  }
  async getQuotes(symbols: string[]) { return (await Promise.all(symbols.map((symbol) => this.getQuote(symbol)))).filter((quote): quote is MarketQuote => Boolean(quote)); }
  async getHistoricalSeries() { return []; }
  async searchSymbols(): Promise<MarketMetadata[]> { return []; }
  async getMarketStatus(): Promise<DataStatus> { return "NEAR_REAL_TIME"; }
  async getMetadata(): Promise<MarketMetadata | null> { return null; }
}

export function createServerMarketDataProvider(env: Record<string, string | undefined>): MarketDataProvider {
  return env.TWELVE_DATA_API_KEY ? new TwelveDataMarketDataProvider(env.TWELVE_DATA_API_KEY) : new MockMarketDataProvider();
}

export function selectMarketDataProvider(env: Record<string, string | undefined>, requested: "AUTO" | "DEMO" | "TWELVE_DATA" = "AUTO"): { provider: MarketDataProvider; name: string; environment: ProviderEnvironment; capabilities: ProviderCapabilities } {
  const licensed = Boolean(env.TWELVE_DATA_API_KEY) && env.MARKET_DATA_DISPLAY_LICENSE === "confirmed";
  if (requested === "TWELVE_DATA" && !licensed) throw new Error("Twelve Data display requires a server key and confirmed display licence.");
  if (licensed && requested !== "DEMO") return { provider: new TwelveDataMarketDataProvider(env.TWELVE_DATA_API_KEY!), name: "Twelve Data", environment: "LICENSED_SERVER", capabilities: providerCapabilities.twelveData };
  return { provider: new MockMarketDataProvider(), name: "TQB frozen scenario", environment: "PUBLIC_DEMO", capabilities: providerCapabilities.demo };
}
