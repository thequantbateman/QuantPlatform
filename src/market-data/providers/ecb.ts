import { findInstrument, mappingsFor } from "../instrumentMaster";
import type { MarketDataProvider, MarketDataRequest, MarketInstrument, MarketQuote } from "../domain";
import { classifyFreshness, tickDirection } from "../normalization";
import { providerCapabilities } from "./capabilities";

type Observation = { date: string; value: number };
type FetchLike = typeof fetch;
const FX_CURRENCIES = ["USD", "GBP", "JPY", "CHF", "AUD", "NZD", "CAD"];
const API = "https://data-api.ecb.europa.eu/service/data";
let cache: { key: string; expires: number; fx: Map<string, Observation[]>; estr: Observation[]; dfr: Observation[] } | null = null;

function parseCsv(text: string, currencyColumn = "CURRENCY"): Map<string, Observation[]> {
  const lines = text.trim().split(/\r?\n/); if (lines.length < 2) return new Map(); const headers = lines[0].split(","); const dateIndex = headers.indexOf("TIME_PERIOD"); const valueIndex = headers.indexOf("OBS_VALUE"); const currencyIndex = headers.indexOf(currencyColumn); const result = new Map<string, Observation[]>();
  for (const line of lines.slice(1)) { const cells = line.split(","); const value = Number(cells[valueIndex]); const date = cells[dateIndex]; const key = currencyIndex >= 0 ? cells[currencyIndex] : "SERIES"; if (!date || !Number.isFinite(value) || !key) continue; const series = result.get(key) ?? []; series.push({ date, value }); result.set(key, series); }
  for (const series of result.values()) series.sort((a, b) => a.date.localeCompare(b.date)); return result;
}

async function getReferenceData(fetcher: FetchLike, asOf?: string): Promise<{ fx: Map<string, Observation[]>; estr: Observation[]; dfr: Observation[] }> {
  const end = asOf?.slice(0, 10); const key = end || "latest"; if (cache && cache.key === key && cache.expires > Date.now()) return cache;
  const suffix = `lastNObservations=45&format=csvdata${end ? `&endPeriod=${encodeURIComponent(end)}` : ""}`;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const [fxResponse, estrResponse, dfrResponse] = await Promise.all([
      fetcher(`${API}/EXR/D.${FX_CURRENCIES.join("+")}.EUR.SP00.A?${suffix}`, { signal: controller.signal, headers: { accept: "text/csv" } }),
      fetcher(`${API}/EST/B.EU000A2X2A25.WT?${suffix}`, { signal: controller.signal, headers: { accept: "text/csv" } }),
      fetcher(`${API}/FM/B.U2.EUR.4F.KR.DFR.LEV?${suffix}`, { signal: controller.signal, headers: { accept: "text/csv" } }),
    ]);
    if (!fxResponse.ok) throw new Error(`ECB FX API returned ${fxResponse.status}`);
    const fx = parseCsv(await fxResponse.text()); const estr = estrResponse.ok ? parseCsv(await estrResponse.text(), "__SERIES__").get("SERIES") ?? [] : []; const dfr = dfrResponse.ok ? parseCsv(await dfrResponse.text(), "__SERIES__").get("SERIES") ?? [] : [];
    cache = { key, expires: Date.now() + 5 * 60_000, fx, estr, dfr }; return cache;
  } finally { clearTimeout(timer); }
}

function fxSeries(instrument: MarketInstrument, data: Map<string, Observation[]>): Observation[] {
  const base = instrument.baseCurrency === "EUR" ? null : data.get(instrument.baseCurrency ?? ""); const quote = instrument.quoteCurrency === "EUR" ? null : data.get(instrument.quoteCurrency ?? ""); const dates = new Set((quote ?? base ?? []).map((item) => item.date)); const byDate = (series: Observation[] | null | undefined) => new Map((series ?? []).map((item) => [item.date, item.value])); const baseMap = byDate(base); const quoteMap = byDate(quote);
  return [...dates].sort().flatMap((date) => { const baseValue = instrument.baseCurrency === "EUR" ? 1 : baseMap.get(date); const quoteValue = instrument.quoteCurrency === "EUR" ? 1 : quoteMap.get(date); return baseValue && quoteValue ? [{ date, value: quoteValue / baseValue }] : []; });
}

function referenceQuote(instrument: MarketInstrument, series: Observation[], request: MarketDataRequest, sourceUrl: string): MarketQuote | null {
  const latest = series.at(-1); if (!latest) return null; const previous = series.at(-2) ?? latest; const receivedTimestamp = new Date().toISOString(); const change = latest.value - previous.value; const actualMode = request.mode === "HISTORICAL" ? "HISTORICAL" : request.mode === "PREVIOUS_CLOSE" ? "PREVIOUS_CLOSE" : "END_OF_DAY"; const marketTimestamp = `${latest.date}T13:15:00Z`; const status = request.mode === "HISTORICAL" ? "EOD" : "REFERENCE";
  return { instrumentId: instrument.id, symbol: instrument.symbol, name: instrument.name, assetClass: instrument.assetClass, instrumentType: instrument.instrumentType, price: latest.value, previousPrice: previous.value, tickChange: change, tickChangePct: previous.value ? change / previous.value * 100 : null, tickDirection: tickDirection(change), bid: null, ask: null, mid: null, spread: null, spreadInPips: null, open: latest.value, high: latest.value, low: latest.value, previousClose: previous.value, sessionChange: change, sessionChangePct: previous.value ? change / previous.value * 100 : null, volume: null, currency: instrument.currency, exchange: instrument.exchange, marketTimestamp, receivedTimestamp, asOf: marketTimestamp, latencyMs: null, status, freshness: classifyFreshness(instrument, status, receivedTimestamp), dataMode: actualMode, source: "European Central Bank", sourceUrl, provider: "ECB", licensingMode: request.licensingMode, resolution: "official daily reference", sessionLabel: "ECB BUSINESS DAY", history: series.map((item) => item.value), notice: request.mode === "LIVE_STREAM" ? "ECB observations are daily reference data, not a live FX stream." : null };
}

export class EcbMarketDataProvider implements MarketDataProvider {
  readonly id = "ECB" as const; readonly capabilities = providerCapabilities.ECB;
  constructor(private readonly fetcher: FetchLike = fetch) {}
  async getQuotes(request: MarketDataRequest): Promise<MarketQuote[]> {
    const data = await getReferenceData(this.fetcher, request.mode === "HISTORICAL" || request.mode === "INTRADAY_SNAPSHOT" ? request.asOf : undefined);
    return request.instrumentIds.flatMap((instrumentId) => { const instrument = findInstrument(instrumentId); const mapping = mappingsFor(instrumentId, "ECB")[0]; if (!instrument || !mapping) return []; let series: Observation[] = []; if (instrument.assetClass === "FX") series = fxSeries(instrument, data.fx); else if (instrument.id === "rates-estr") series = data.estr; else if (instrument.id === "rates-ecb-dfr") series = data.dfr; const quote = referenceQuote(instrument, series, request, mapping.sourceUrl ?? "https://data.ecb.europa.eu/"); return quote ? [quote] : []; });
  }
}

export const __test = { parseCsv, fxSeries };
