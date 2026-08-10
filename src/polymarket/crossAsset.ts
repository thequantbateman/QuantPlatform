import { findInstrument } from "@/src/market-data/instrumentMaster";
import type { MarketInstrument } from "@/src/market-data/domain";

export interface CuratedEventLink { instrument: MarketInstrument; rationale: string; learnHref: string }
const rules: { pattern: RegExp; instrumentId: string; rationale: string; learnHref: string }[] = [
  { pattern: /ecb|euro area|eurozone|lagarde/i, instrumentId: "rates-ecb-dfr", rationale: "Explicit euro-area policy-rate linkage.", learnHref: "/learn/rates/yield-curves" },
  { pattern: /fed|federal reserve|us rates|interest rate|inflation|cpi|jobs|unemployment/i, instrumentId: "index-spx", rationale: "Curated U.S. macro-risk proxy; association is not causality.", learnHref: "/learn/rates/yield-curves" },
  { pattern: /bitcoin|btc/i, instrumentId: "crypto-btcusd", rationale: "Direct reference to Bitcoin in the event definition.", learnHref: "/learn/foundations/market-price-vs-model-price" },
  { pattern: /ethereum|ether|eth/i, instrumentId: "crypto-ethusd", rationale: "Direct reference to Ether in the event definition.", learnHref: "/learn/foundations/market-price-vs-model-price" },
  { pattern: /oil|brent|opec/i, instrumentId: "comm-brent", rationale: "Direct energy-market relationship.", learnHref: "/learn/commodities/spot-vs-futures" },
  { pattern: /gold/i, instrumentId: "comm-gold", rationale: "Direct reference to gold in the event definition.", learnHref: "/learn/commodities/spot-vs-futures" },
  { pattern: /nasdaq|technology stocks|tech stocks/i, instrumentId: "index-ndx", rationale: "Explicit equity-index relationship.", learnHref: "/learn/equity/realized-vs-implied-volatility" },
  { pattern: /s&p|recession|gdp|economy|economic growth/i, instrumentId: "index-spx", rationale: "Curated broad U.S. equity risk proxy; association is not causality.", learnHref: "/learn/equity/realized-vs-implied-volatility" },
];

export function curatedLinksForEvent(title: string, description = ""): CuratedEventLink[] {
  const value = `${title} ${description}`; const seen = new Set<string>();
  return rules.flatMap((rule): CuratedEventLink[] => { if (!rule.pattern.test(value) || seen.has(rule.instrumentId)) return []; const instrument = findInstrument(rule.instrumentId); if (!instrument) return []; seen.add(rule.instrumentId); return [{ instrument, rationale: rule.rationale, learnHref: rule.learnHref }]; });
}
