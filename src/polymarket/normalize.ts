import type { PredictionEvent, PredictionMarket } from "./domain";

type UnknownRecord = Record<string, unknown>;
const asRecord = (value: unknown): UnknownRecord => value !== null && typeof value === "object" ? value as UnknownRecord : {};
const asString = (value: unknown, fallback = ""): string => typeof value === "string" ? value : value === null || value === undefined ? fallback : String(value);
const asNumber = (value: unknown): number | null => Number.isFinite(Number(value)) ? Number(value) : null;
const asBoolean = (value: unknown): boolean => value === true || value === "true" || value === 1;
const asDate = (value: unknown): string | null => {
  if (!value) return null;
  const date = new Date(asString(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try { const parsed = JSON.parse(value) as unknown; return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
}

function categoryOf(event: UnknownRecord): string {
  const tags = Array.isArray(event.tags) ? event.tags.map(asRecord) : [];
  return asString(event.category) || asString(asRecord(tags[0]).label) || "Other";
}

export function normalizeGammaMarket(value: unknown, eventValue: unknown = {}): PredictionMarket | null {
  const market = asRecord(value); const event = asRecord(eventValue); const embeddedEvent = asRecord(Array.isArray(market.events) ? market.events[0] : {});
  const id = asString(market.id); const eventId = asString(event.id ?? embeddedEvent.id);
  const labels = parseStringArray(market.outcomes); const prices = parseStringArray(market.outcomePrices).map(asNumber);
  const tokenIds = parseStringArray(market.clobTokenIds);
  if (!id || !eventId || labels.length === 0 || labels.length !== tokenIds.length) return null;
  const outcomes = labels.map((label, index) => ({ index, label, tokenId: tokenIds[index], price: prices[index] ?? null }));
  const yesIndex = outcomes.findIndex((outcome) => outcome.label.toLowerCase() === "yes");
  const primaryOutcomeIndex = yesIndex >= 0 ? yesIndex : 0;
  const bid = asNumber(market.bestBid); const ask = asNumber(market.bestAsk); const last = asNumber(market.lastTradePrice);
  const mid = bid !== null && ask !== null ? (bid + ask) / 2 : null;
  const probability = outcomes[primaryOutcomeIndex]?.price ?? mid ?? last;
  const slug = asString(market.slug, id);
  return {
    id, eventId, conditionId: asString(market.conditionId, id), slug,
    question: asString(market.question, asString(event.title, "Untitled market")),
    description: asString(market.description, asString(event.description)), category: categoryOf(event),
    endDate: asDate(market.endDate ?? event.endDate), outcomes, primaryOutcomeIndex,
    probability: probability !== null && probability >= 0 && probability <= 1 ? probability : null,
    bid, ask, mid, spread: bid !== null && ask !== null ? ask - bid : asNumber(market.spread), lastTradePrice: last,
    change1d: asNumber(market.oneDayPriceChange), change1w: asNumber(market.oneWeekPriceChange),
    volume: asNumber(market.volumeNum ?? market.volume) ?? 0, volume24h: asNumber(market.volume24hrClob ?? market.volume24hr) ?? 0,
    liquidity: asNumber(market.liquidityNum ?? market.liquidity) ?? 0, openInterest: asNumber(market.openInterest ?? event.openInterest),
    active: asBoolean(market.active), closed: asBoolean(market.closed), acceptingOrders: asBoolean(market.acceptingOrders),
    negativeRisk: asBoolean(market.negRisk ?? event.negRisk), minTickSize: asNumber(market.orderPriceMinTickSize), minOrderSize: asNumber(market.orderMinSize),
    updatedAt: asDate(market.updatedAt ?? event.updatedAt) ?? new Date(0).toISOString(),
    sourceUrl: `https://polymarket.com/event/${encodeURIComponent(asString(event.slug, slug))}`,
  };
}

export function normalizeGammaEvents(input: unknown): PredictionEvent[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((eventValue): PredictionEvent[] => {
    const event = asRecord(eventValue); const id = asString(event.id); if (!id) return [];
    const markets = (Array.isArray(event.markets) ? event.markets : []).map((market) => normalizeGammaMarket(market, event)).filter((market): market is PredictionMarket => market !== null);
    const tags = (Array.isArray(event.tags) ? event.tags : []).map((tag) => asString(asRecord(tag).label)).filter(Boolean);
    const slug = asString(event.slug, id);
    return [{
      id, slug, title: asString(event.title, "Untitled event"), description: asString(event.description), category: categoryOf(event), tags,
      seriesId: asString(event.seriesSlug ?? asRecord(Array.isArray(event.series) ? event.series[0] : {}).id) || null,
      resolutionSource: asString(event.resolutionSource), startDate: asDate(event.startDate), endDate: asDate(event.endDate),
      active: asBoolean(event.active), closed: asBoolean(event.closed), negativeRisk: asBoolean(event.negRisk),
      volume: asNumber(event.volume) ?? markets.reduce((sum, market) => sum + market.volume, 0),
      liquidity: asNumber(event.liquidity) ?? markets.reduce((sum, market) => sum + market.liquidity, 0),
      openInterest: asNumber(event.openInterest), updatedAt: asDate(event.updatedAt) ?? new Date(0).toISOString(),
      sourceUrl: `https://polymarket.com/event/${encodeURIComponent(slug)}`, markets, marketCount: markets.length,
    }];
  });
}

export function flattenMarkets(events: PredictionEvent[]): PredictionMarket[] { return events.flatMap((event) => event.markets); }

export function isMacroPrediction(market: PredictionMarket): boolean {
  return /fed|interest rate|inflation|cpi|gdp|recession|tariff|treasury|oil|gold|bitcoin|ethereum|s&p|nasdaq|econom|finance|central bank|ecb|bank of england|exchange rate|jobs|unemployment/i.test(`${market.question} ${market.category}`);
}
