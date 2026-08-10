import type { ProviderCapabilities, ProviderId } from "../domain";

export const providerCapabilities: Record<Exclude<ProviderId, "AUTO">, ProviderCapabilities> = {
  ECB: { assetClasses: ["FX", "RATES"], streaming: false, snapshot: true, historical: true, eod: true, websocket: false, maxSubscriptions: 0, supportedIntervals: ["1d"], licensingModes: ["LOCAL_DEVELOPMENT", "PRIVATE_BETA", "PUBLIC_DEMO", "PUBLIC_PRODUCTION"], publicDisplay: true },
  TWELVE_DATA: { assetClasses: ["FX", "EQUITY", "INDEX", "COMMODITY", "CRYPTO"], streaming: true, snapshot: true, historical: true, eod: true, websocket: true, maxSubscriptions: 8, supportedIntervals: ["1m", "5m", "15m", "1h", "1d"], licensingModes: ["LOCAL_DEVELOPMENT", "PRIVATE_BETA"], publicDisplay: false },
  FINNHUB: { assetClasses: ["FX", "EQUITY", "INDEX", "COMMODITY", "CRYPTO"], streaming: true, snapshot: true, historical: true, eod: true, websocket: true, maxSubscriptions: 50, supportedIntervals: ["1m", "5m", "15m", "1h", "1d"], licensingModes: ["LOCAL_DEVELOPMENT", "PRIVATE_BETA"], publicDisplay: false },
  ALPHA_VANTAGE: { assetClasses: ["FX", "EQUITY", "INDEX", "COMMODITY", "CRYPTO"], streaming: false, snapshot: true, historical: true, eod: true, websocket: false, maxSubscriptions: 0, supportedIntervals: ["1m", "5m", "15m", "1h", "1d"], licensingModes: ["LOCAL_DEVELOPMENT", "PRIVATE_BETA"], publicDisplay: false },
  COINBASE: { assetClasses: ["CRYPTO"], streaming: true, snapshot: true, historical: true, eod: false, websocket: true, maxSubscriptions: 25, supportedIntervals: ["tick", "5m", "1h", "1d"], licensingModes: ["LOCAL_DEVELOPMENT", "PRIVATE_BETA"], publicDisplay: false },
  DEMO: { assetClasses: ["FX", "EQUITY", "INDEX", "RATES", "COMMODITY", "CRYPTO"], streaming: false, snapshot: true, historical: true, eod: true, websocket: false, maxSubscriptions: 0, supportedIntervals: ["scenario"], licensingModes: ["LOCAL_DEVELOPMENT", "PRIVATE_BETA", "PUBLIC_DEMO", "PUBLIC_PRODUCTION"], publicDisplay: true },
};

export const providerSourceLinks: Record<Exclude<ProviderId, "AUTO">, string> = {
  ECB: "https://data.ecb.europa.eu/", TWELVE_DATA: "https://twelvedata.com/docs/advanced", FINNHUB: "https://finnhub.io/docs/api", ALPHA_VANTAGE: "https://www.alphavantage.co/documentation/", COINBASE: "https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-overview", DEMO: "/learn/foundations/reference-vs-real-time-data",
};
