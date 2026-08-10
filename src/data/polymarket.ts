export interface PredictionMarket {
  id: string;
  eventId: string;
  question: string;
  category: string;
  endDate: string | null;
  probability: number | null;
  outcomes: string[];
  outcomePrices: number[];
  volume: number;
  liquidity: number;
  updatedAt: string;
  tokenId: string | null;
  history: { timestamp: number; probability: number }[];
}

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord => value && typeof value === "object" ? value as UnknownRecord : {};
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const strings = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
};

export function normalizeGammaEvents(input: unknown): PredictionMarket[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((eventValue) => {
    const event = record(eventValue); const markets = Array.isArray(event.markets) ? event.markets : [];
    return markets.map((marketValue) => {
      const market = record(marketValue); const outcomes = strings(market.outcomes); const outcomePrices = strings(market.outcomePrices).map(Number).filter(Number.isFinite); const tokenIds = strings(market.clobTokenIds);
      const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
      return {
        id: String(market.id ?? ""), eventId: String(event.id ?? ""), question: String(market.question ?? event.title ?? "Untitled market"), category: String(event.category ?? "Other"),
        endDate: market.endDate ? String(market.endDate) : null,
        probability: outcomePrices.length ? outcomePrices[yesIndex >= 0 ? yesIndex : 0] : null,
        outcomes, outcomePrices, volume: number(market.volume ?? event.volume), liquidity: number(market.liquidity ?? event.liquidity), updatedAt: String(market.updatedAt ?? event.updatedAt ?? new Date(0).toISOString()), tokenId: tokenIds[yesIndex >= 0 ? yesIndex : 0] ?? null, history: [],
      } satisfies PredictionMarket;
    });
  }).filter((market) => market.id && market.probability !== null && market.probability >= 0 && market.probability <= 1);
}

export function isMacroPrediction(market: PredictionMarket): boolean {
  return /fed|interest rate|inflation|cpi|gdp|recession|tariff|treasury|oil|gold|bitcoin|ethereum|s&p|nasdaq|econom|finance|central bank|ecb|bank of england|exchange rate/i.test(`${market.question} ${market.category}`);
}
