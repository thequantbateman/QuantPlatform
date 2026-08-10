export type InstrumentId = string;
export type MarketAssetClass = "FX" | "EQUITY" | "INDEX" | "RATES" | "COMMODITY" | "CRYPTO";
export type InstrumentType = "FX_SPOT" | "EQUITY_SPOT" | "INDEX_SPOT" | "GOVERNMENT_YIELD" | "REFERENCE_RATE" | "POLICY_RATE" | "COMMODITY_REFERENCE" | "CRYPTO_SPOT";
export type MarketDataMode = "LIVE_STREAM" | "LIVE_SNAPSHOT" | "INTRADAY_SNAPSHOT" | "PREVIOUS_CLOSE" | "END_OF_DAY" | "HISTORICAL";
export type MarketDataStatus = "LIVE" | "NEAR_REAL_TIME" | "DELAYED" | "SNAPSHOT" | "EOD" | "REFERENCE" | "DEMO" | "STALE" | "OFFLINE";
export type MarketDataFreshness = "FRESH" | "AGING" | "STALE" | "OFFLINE";
export type TickDirection = "UP" | "DOWN" | "UNCHANGED";
export type ProviderId = "AUTO" | "ECB" | "TWELVE_DATA" | "FINNHUB" | "ALPHA_VANTAGE" | "COINBASE" | "DEMO";
export type LicensingMode = "LOCAL_DEVELOPMENT" | "PRIVATE_BETA" | "PUBLIC_DEMO" | "PUBLIC_PRODUCTION";

export interface MarketInstrument {
  id: InstrumentId;
  slug: string;
  symbol: string;
  name: string;
  assetClass: MarketAssetClass;
  instrumentType: InstrumentType;
  currency: string;
  exchange: string | null;
  timezone: string;
  session: "24H" | "EXCHANGE" | "REFERENCE";
  baseCurrency?: string;
  quoteCurrency?: string;
  pipSize?: number;
  displayPrecision: number;
  unit?: string;
  pricerMode?: "equity" | "fx" | "forward";
  learnSlug?: string;
}

export interface VendorSymbolMapping {
  instrumentId: InstrumentId;
  provider: Exclude<ProviderId, "AUTO">;
  vendorSymbol: string;
  exchange?: string;
  sourceUrl?: string;
  transform?: "DIRECT" | "ECB_CROSS";
}

export interface MarketTick {
  instrumentId: InstrumentId;
  price: number;
  bid: number | null;
  ask: number | null;
  volume: number | null;
  marketTimestamp: string;
  receivedTimestamp: string;
  source: string;
}

export interface MarketBar {
  instrumentId: InstrumentId;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  interval: "1m" | "5m" | "15m" | "1h" | "1d";
  source: string;
}

export interface MarketQuote {
  instrumentId: InstrumentId;
  symbol: string;
  name: string;
  assetClass: MarketAssetClass;
  instrumentType: InstrumentType;
  price: number | null;
  previousPrice: number | null;
  tickChange: number | null;
  tickChangePct: number | null;
  tickDirection: TickDirection;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  spread: number | null;
  spreadInPips: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  sessionChange: number | null;
  sessionChangePct: number | null;
  volume: number | null;
  currency: string;
  exchange: string | null;
  marketTimestamp: string | null;
  receivedTimestamp: string;
  asOf: string;
  latencyMs: number | null;
  status: MarketDataStatus;
  freshness: MarketDataFreshness;
  dataMode: MarketDataMode;
  source: string;
  sourceUrl: string | null;
  provider: Exclude<ProviderId, "AUTO">;
  licensingMode: LicensingMode;
  resolution: string | null;
  sessionLabel: string;
  history: number[];
  notice: string | null;
}

export interface MarketSnapshot {
  snapshotId: string;
  mode: MarketDataMode;
  requestedAsOf: string;
  asOf: string;
  createdAt: string;
  timezone: string;
  quotes: MarketQuote[];
  providerMetadata: { provider: string; status: string; detail: string }[];
  notes: string[];
  streamingAllowed: boolean;
}

export interface ProviderCapabilities {
  assetClasses: MarketAssetClass[];
  streaming: boolean;
  snapshot: boolean;
  historical: boolean;
  eod: boolean;
  websocket: boolean;
  maxSubscriptions: number;
  supportedIntervals: string[];
  licensingModes: LicensingMode[];
  publicDisplay: boolean;
}

export interface ProviderHealth {
  state: "CONNECTED" | "DEGRADED" | "RATE_LIMITED" | "DISCONNECTED" | "ERROR";
  checkedAt: string;
  lastSuccessfulQuote: string | null;
  lastError: string | null;
  latencyMs: number | null;
  subscriptionCount: number;
}

export interface MarketDataRequest {
  instrumentIds: InstrumentId[];
  mode: MarketDataMode;
  provider: ProviderId;
  asOf?: string;
  interval?: MarketBar["interval"];
  licensingMode: LicensingMode;
}

export interface MarketDataProvider {
  readonly id: Exclude<ProviderId, "AUTO">;
  readonly capabilities: ProviderCapabilities;
  getQuotes(request: MarketDataRequest): Promise<MarketQuote[]>;
  getHistory?(request: MarketDataRequest): Promise<MarketBar[]>;
}

export interface HistoricalMarketDataStore {
  saveSnapshot(snapshot: MarketSnapshot): Promise<void>;
  findSnapshot(snapshotId: string): Promise<MarketSnapshot | null>;
}

export const marketDataModes: MarketDataMode[] = ["LIVE_STREAM", "LIVE_SNAPSHOT", "INTRADAY_SNAPSHOT", "PREVIOUS_CLOSE", "END_OF_DAY", "HISTORICAL"];
export const providerIds: ProviderId[] = ["AUTO", "ECB", "TWELVE_DATA", "FINNHUB", "ALPHA_VANTAGE", "COINBASE", "DEMO"];
