import { findInstrument, mappingsFor } from "./instrumentMaster";
import type { LicensingMode, MarketDataProvider, MarketDataRequest, MarketQuote, MarketSnapshot, ProviderId } from "./domain";
import { unavailableQuote } from "./normalization";
import { providerCapabilities } from "./providers/capabilities";
import { DemoMarketDataProvider } from "./providers/demo";
import { EcbMarketDataProvider } from "./providers/ecb";

export class MarketDataRouter {
  private readonly providers = new Map<ProviderId, MarketDataProvider>();
  constructor(providers: MarketDataProvider[] = [new EcbMarketDataProvider(), new DemoMarketDataProvider()]) { for (const provider of providers) this.providers.set(provider.id, provider); }
  resolveProvider(instrumentId: string, request: MarketDataRequest): Exclude<ProviderId, "AUTO"> {
    if (request.provider !== "AUTO") return request.provider;
    const instrument = findInstrument(instrumentId); if (!instrument) return "DEMO";
    if (mappingsFor(instrumentId, "ECB").length && ["FX", "RATES"].includes(instrument.assetClass)) return "ECB";
    if (instrument.assetClass === "CRYPTO" && request.mode === "LIVE_STREAM" && ["LOCAL_DEVELOPMENT", "PRIVATE_BETA"].includes(request.licensingMode)) return "COINBASE";
    return "DEMO";
  }
  async getQuotes(request: MarketDataRequest): Promise<MarketQuote[]> {
    const byProvider = new Map<Exclude<ProviderId, "AUTO">, string[]>(); for (const id of request.instrumentIds) { const provider = this.resolveProvider(id, request); byProvider.set(provider, [...(byProvider.get(provider) ?? []), id]); }
    const quotes: MarketQuote[] = []; const resolved = new Set<string>();
    for (const [providerId, instrumentIds] of byProvider) {
      const provider = this.providers.get(providerId);
      if (provider && provider.capabilities.licensingModes.includes(request.licensingMode)) { try { const result = await provider.getQuotes({ ...request, instrumentIds, provider: providerId }); result.forEach((quote) => resolved.add(quote.instrumentId)); quotes.push(...result); } catch { /* each unresolved instrument receives an explicit unavailable state below */ } }
    }
    for (const id of request.instrumentIds) if (!resolved.has(id)) { const instrument = findInstrument(id); if (instrument) quotes.push(unavailableQuote(instrument, request.mode, this.resolveProvider(id, request) === "COINBASE" ? "Waiting for the public Coinbase WebSocket snapshot." : "No legally displayable provider is configured for this instrument and mode.")); }
    return request.instrumentIds.flatMap((id) => quotes.find((quote) => quote.instrumentId === id) ?? []);
  }
  async snapshot(request: MarketDataRequest): Promise<MarketSnapshot> { const createdAt = new Date().toISOString(); const quotes = await this.getQuotes(request); const asOf = quotes.map((quote) => quote.asOf).sort().at(-1) ?? request.asOf ?? createdAt; return { snapshotId: `ephemeral-${request.mode.toLowerCase()}-${createdAt}`, mode: request.mode, requestedAsOf: request.asOf ?? createdAt, asOf, createdAt, timezone: "UTC", quotes, providerMetadata: [...new Set(quotes.map((quote) => quote.provider))].map((provider) => ({ provider, status: quotes.some((quote) => quote.provider === provider && quote.status !== "OFFLINE") ? "AVAILABLE" : "WAITING", detail: provider === "COINBASE" ? "Client public WebSocket; private-beta display only." : "Server-normalized provider." })), notes: ["Quotes retain their own as-of timestamps; mixed states are visible rather than silently aligned."], streamingAllowed: request.mode === "LIVE_STREAM" && ["LOCAL_DEVELOPMENT", "PRIVATE_BETA"].includes(request.licensingMode) } }
}

export function licensingModeFromEnv(env: Record<string, string | undefined>): LicensingMode { const value = env.MARKET_DATA_LICENSE_MODE; return value === "LOCAL_DEVELOPMENT" || value === "PUBLIC_DEMO" || value === "PUBLIC_PRODUCTION" ? value : "PRIVATE_BETA"; }
export function sanitizedProviderCatalog() { return Object.entries(providerCapabilities).map(([id, capabilities]) => ({ id, ...capabilities, configured: id === "ECB" || id === "DEMO" || id === "COINBASE" })); }
