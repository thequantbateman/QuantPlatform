import type { DataStatus, MarketDataProvider, MarketMetadata, MarketQuote } from "./markets";
import { MockMarketDataProvider } from "./markets";

type FetchLike = typeof fetch;
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
