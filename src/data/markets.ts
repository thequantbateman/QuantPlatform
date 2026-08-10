export type AssetClass = "FX" | "EQ" | "IR" | "COMM";
export type DataStatus = "LIVE" | "NEAR_REAL_TIME" | "DELAYED" | "EOD" | "REFERENCE" | "DEMO";
export type DataOrigin = "MARKET" | "USER" | "REFERENCE" | "MODEL" | "CALIBRATED";

export interface DataLineage { origin: DataOrigin; source: string; timestamp: string; }
export interface MarketQuote {
  symbol: string;
  displaySymbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  currency: string;
  marketTimestamp: string;
  receivedTimestamp: string;
  status: DataStatus;
  source: string;
  history: number[];
  pricerMode?: "equity" | "fx" | "forward";
  learnSlug?: string;
}
export interface HistoricalRequest { symbol: string; interval: "1D" | "5D" | "1M" | "3M" | "1Y"; start?: string; end?: string; }
export interface MarketMetadata { symbol: string; exchange?: string; timezone: string; currency: string; source: string; }
export interface MarketDataProvider {
  getQuote(symbol: string): Promise<MarketQuote | null>;
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
  getHistoricalSeries(request: HistoricalRequest): Promise<number[]>;
  searchSymbols(query: string): Promise<MarketMetadata[]>;
  getMarketStatus(symbol: string): Promise<DataStatus>;
  getMetadata(symbol: string): Promise<MarketMetadata | null>;
}

const at = "2026-08-08T20:00:00Z";
const refAt = "2026-08-08T08:00:00Z";
export const demoMarketQuotes: MarketQuote[] = [
  { symbol: "EURUSD", displaySymbol: "EUR/USD", name: "Euro / US Dollar", assetClass: "FX", price: 1.1642, change: 0.0044, changePercent: 0.38, open: 1.1601, high: 1.1668, low: 1.1588, previousClose: 1.1598, currency: "USD", marketTimestamp: at, receivedTimestamp: at, status: "DEMO", source: "TQB frozen scenario", history: [1.158,1.16,1.159,1.161,1.162,1.161,1.163,1.1642], pricerMode: "fx", learnSlug: "/learn/fx/fx-forwards" },
  { symbol: "GBPUSD", displaySymbol: "GBP/USD", name: "Sterling / US Dollar", assetClass: "FX", price: 1.3482, change: -0.0011, changePercent: -0.08, open: 1.3491, high: 1.351, low: 1.345, previousClose: 1.3493, currency: "USD", marketTimestamp: at, receivedTimestamp: at, status: "DEMO", source: "TQB frozen scenario", history: [1.35,1.349,1.351,1.348,1.347,1.349,1.3482], pricerMode: "fx" },
  { symbol: "USDJPY", displaySymbol: "USD/JPY", name: "US Dollar / Japanese Yen", assetClass: "FX", price: 147.52, change: 0.46, changePercent: 0.31, open: 147.08, high: 147.77, low: 146.91, previousClose: 147.06, currency: "JPY", marketTimestamp: at, receivedTimestamp: at, status: "DEMO", source: "TQB frozen scenario", history: [146.9,147.1,147.0,147.3,147.4,147.2,147.52], pricerMode: "fx" },
  { symbol: "AAPL", displaySymbol: "AAPL", name: "Apple Inc.", assetClass: "EQ", price: 218.44, change: 2.25, changePercent: 1.04, open: 216.8, high: 219.15, low: 215.92, previousClose: 216.19, currency: "USD", marketTimestamp: at, receivedTimestamp: at, status: "DEMO", source: "TQB frozen scenario", history: [214,215,214.6,216,216.5,217.4,218.44], pricerMode: "equity", learnSlug: "/learn/equity/black-scholes" },
  { symbol: "MSFT", displaySymbol: "MSFT", name: "Microsoft Corp.", assetClass: "EQ", price: 522.04, change: -1.83, changePercent: -0.35, open: 523.2, high: 525.1, low: 520.8, previousClose: 523.87, currency: "USD", marketTimestamp: at, receivedTimestamp: at, status: "DEMO", source: "TQB frozen scenario", history: [526,524,525,523,522,523,522.04], pricerMode: "equity" },
  { symbol: "ESTR", displaySymbol: "€STR", name: "Euro short-term rate", assetClass: "IR", price: 2.185, change: 0, changePercent: 0, open: 2.185, high: 2.185, low: 2.185, previousClose: 2.185, currency: "%", marketTimestamp: "2026-07-27T00:00:00Z", receivedTimestamp: refAt, status: "REFERENCE", source: "European Central Bank", history: [2.18,2.18,2.185,2.185,2.185] },
  { symbol: "BRENT", displaySymbol: "BRENT", name: "Brent front-month proxy", assetClass: "COMM", price: 71.84, change: 0.81, changePercent: 1.14, open: 71.1, high: 72.2, low: 70.72, previousClose: 71.03, currency: "USD", marketTimestamp: at, receivedTimestamp: at, status: "DEMO", source: "TQB frozen scenario", history: [69.8,70.4,70.1,70.9,71.2,71.0,71.84], pricerMode: "forward", learnSlug: "/learn/commodities/forward-curves" },
  { symbol: "GOLD", displaySymbol: "GOLD", name: "Gold spot proxy", assetClass: "COMM", price: 2418.3, change: 7.4, changePercent: 0.31, open: 2411, high: 2423, low: 2405, previousClose: 2410.9, currency: "USD", marketTimestamp: at, receivedTimestamp: at, status: "DEMO", source: "TQB frozen scenario", history: [2398,2404,2401,2410,2412,2415,2418.3], pricerMode: "forward" },
];

export class MockMarketDataProvider implements MarketDataProvider {
  async getQuote(symbol: string) { return demoMarketQuotes.find((quote) => quote.symbol === symbol.toUpperCase()) ?? null; }
  async getQuotes(symbols: string[]) { return demoMarketQuotes.filter((quote) => symbols.includes(quote.symbol)); }
  async getHistoricalSeries({ symbol }: HistoricalRequest) { return (await this.getQuote(symbol))?.history ?? []; }
  async searchSymbols(query: string) { const key = query.toLowerCase(); return demoMarketQuotes.filter((quote) => `${quote.symbol} ${quote.name}`.toLowerCase().includes(key)).map((quote) => ({ symbol: quote.symbol, timezone: "UTC", currency: quote.currency, source: quote.source })); }
  async getMarketStatus(symbol: string) { return (await this.getQuote(symbol))?.status ?? "DEMO"; }
  async getMetadata(symbol: string) { const quote = await this.getQuote(symbol); return quote ? { symbol: quote.symbol, timezone: "UTC", currency: quote.currency, source: quote.source } : null; }
}

export function findMarketQuote(symbol: string) { return demoMarketQuotes.find((quote) => quote.symbol.toLowerCase() === symbol.toLowerCase()); }
export function marketDetailPath(symbol: string) { return `/markets/${symbol.toLowerCase()}`; }
