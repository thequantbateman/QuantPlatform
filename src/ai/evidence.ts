import { assetPath, contentCatalog } from "@/src/content/catalog";
import { instrumentMaster } from "@/src/market-data/instrumentMaster";
import { MarketDataRouter, licensingModeFromEnv } from "@/src/market-data/router";
import { formatMarketPrice, formatSessionMove } from "@/src/market-data/normalization";

export interface AssistantEvidence { tool: "market_data" | "learn" | "analytics" | "navigation"; answer: string; sources: { label: string; href: string; status: string }[]; }

const normalized = (value: string) => value.toLowerCase().replaceAll("/", "").replaceAll("€", "e").replaceAll(" ", "");

export async function resolveEvidence(question: string, resolveMarketData = false): Promise<AssistantEvidence> {
  const term = question.toLowerCase();
  const compactTerm = normalized(term); const instrument = instrumentMaster.find((item) => compactTerm.includes(normalized(item.symbol)) || compactTerm.includes(normalized(item.slug)));
  if (instrument) {
    if (!resolveMarketData) return { tool: "market_data", answer: `${instrument.symbol} is available through the normalized market-data router. Open its data passport for the current value, provider, status, market timestamp and as-of semantics; no price is inferred by the assistant.`, sources: [{ label: `${instrument.symbol} data passport`, href: `/markets/${instrument.slug}`, status: "NORMALIZED MARKET STATE" }] };
    const [quote] = await new MarketDataRouter().getQuotes({ instrumentIds: [instrument.id], mode: "LIVE_SNAPSHOT", provider: "AUTO", licensingMode: licensingModeFromEnv(process.env) });
    if (quote?.price !== null && quote?.price !== undefined) return { tool: "market_data", answer: `${instrument.symbol} is ${formatMarketPrice(quote, instrument)}; displayed session change ${formatSessionMove(quote, instrument)}. Status ${quote.status}, source ${quote.source}, as of ${quote.asOf}. This is an observed or explicitly labelled reference/demo value, not a tradable quote or model forecast.`, sources: [{ label: `${instrument.symbol} data passport`, href: `/markets/${instrument.slug}`, status: `${quote.status} · ${quote.source}` }, ...(quote.sourceUrl ? [{ label: "Verify provider input", href: quote.sourceUrl, status: "EXTERNAL SOURCE" }] : [])] };
    return { tool: "market_data", answer: `${instrument.symbol} is currently unavailable from a legally displayable configured provider. No value was fabricated.`, sources: [{ label: `${instrument.symbol} data passport`, href: `/markets/${instrument.slug}`, status: "UNAVAILABLE" }] };
  }
  if (/(use|run|calculate|price)/.test(term) && /(option|greek|delta|gamma|vega|theta|rho|implied vol|black.scholes|garman|black.76)/.test(term)) return { tool: "analytics", answer: "A numerical answer requires explicit model, spot or forward, strike, maturity, rates, volatility, option type and notional. Open the deterministic analytics tool; its output, assumptions and data lineage take authority over any language-model explanation.", sources: [{ label: "European option analytics", href: "/lab?lab=vanilla", status: "LOCAL QUANT ENGINE" }] };
  const concept = contentCatalog.find((entry) => term.includes(entry.title.toLowerCase())) ?? contentCatalog.find((entry) => entry.tags.some((tag) => term.includes(tag.toLowerCase())));
  if (concept) return { tool: "learn", answer: `${concept.title}: ${concept.description} ${concept.intuition} Market use: ${concept.marketUse}`, sources: [{ label: concept.title, href: `/learn/${assetPath(concept.assetClass)}/${concept.slug}`, status: `REVIEWED ${concept.lastReviewed}` }] };
  if (/price|greek|delta|gamma|vega|theta|rho|implied vol|black.scholes|garman|black.76/.test(term)) return { tool: "analytics", answer: "A numerical answer requires explicit model, spot or forward, strike, maturity, rates, volatility, option type and notional. Open the deterministic analytics tool; its output, assumptions and data lineage take authority over any language-model explanation.", sources: [{ label: "European option analytics", href: "/lab?lab=vanilla", status: "LOCAL QUANT ENGINE" }] };
  if (/prediction|probability|polymarket/.test(term)) return { tool: "navigation", answer: "Prediction-market probabilities are loaded from Polymarket’s public read-only Gamma and CLOB APIs. They are observed contract prices, not calibrated real-world forecasts. Open the dashboard for current source timestamps and availability.", sources: [{ label: "Prediction markets", href: "/markets/predictions", status: "PUBLIC READ ONLY" }] };
  return { tool: "navigation", answer: "I can ground answers in the Learn corpus, displayed market data, prediction markets or deterministic analytics. Name a concept or instrument, or provide complete pricing inputs.", sources: [{ label: "Unified Learn catalog", href: "/learn", status: "LOCAL REVIEWED CORPUS" }] };
}
