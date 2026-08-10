import { demoMarketQuotes } from "@/src/data/markets";
import { findInstrument } from "../instrumentMaster";
import type { MarketDataProvider, MarketDataRequest, MarketQuote } from "../domain";
import { providerCapabilities } from "./capabilities";

const assetMap = { FX: "FX", EQ: "EQUITY", IR: "RATES", COMM: "COMMODITY" } as const;
export class DemoMarketDataProvider implements MarketDataProvider {
  readonly id = "DEMO" as const; readonly capabilities = providerCapabilities.DEMO;
  async getQuotes(request: MarketDataRequest): Promise<MarketQuote[]> {
    const receivedTimestamp = new Date().toISOString();
    return request.instrumentIds.flatMap((instrumentId) => {
      const instrument = findInstrument(instrumentId); if (!instrument) return [];
      const fixture = demoMarketQuotes.find((item) => item.symbol.toLowerCase() === instrument.slug || item.displaySymbol === instrument.symbol); if (!fixture) return [];
      const previousPrice = fixture.history.at(-2) ?? fixture.price; const tickChange = fixture.price - previousPrice;
      return [{ instrumentId: instrument.id, symbol: instrument.symbol, name: instrument.name, assetClass: assetMap[fixture.assetClass], instrumentType: instrument.instrumentType, price: fixture.price, previousPrice, tickChange, tickChangePct: previousPrice ? tickChange / previousPrice * 100 : null, tickDirection: tickChange > 0 ? "UP" : tickChange < 0 ? "DOWN" : "UNCHANGED", bid: null, ask: null, mid: null, spread: null, spreadInPips: null, open: fixture.open, high: fixture.high, low: fixture.low, previousClose: fixture.previousClose, sessionChange: fixture.change, sessionChangePct: fixture.changePercent, volume: null, currency: fixture.currency, exchange: instrument.exchange, marketTimestamp: fixture.marketTimestamp, receivedTimestamp, asOf: fixture.marketTimestamp, latencyMs: null, status: "DEMO", freshness: "AGING", dataMode: request.mode, source: fixture.source, sourceUrl: "/learn/foundations/reference-vs-real-time-data", provider: "DEMO", licensingMode: request.licensingMode, resolution: "frozen scenario", sessionLabel: "ILLUSTRATIVE", history: fixture.history, notice: "Frozen educational scenario; not a current or tradable market observation." }];
    });
  }
}
