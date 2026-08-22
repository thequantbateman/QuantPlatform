import { assetPath, contentCatalog } from "./catalog";
import { localizeEntry } from "./localization";
import { demoMarketQuotes, marketDetailPath } from "../data/markets";
import type { Locale } from "../i18n";

export type PlatformSearchSource = "core" | "academy";
export type PlatformSearchItemKind = "concept" | "lesson" | "track" | "market" | "tool";

export interface PlatformSearchItem {
  id: string;
  source: PlatformSearchSource;
  kind: PlatformSearchItemKind;
  title: string;
  description: string;
  meta: string;
  href: string;
  keywords: readonly string[];
}

export interface PlatformSearchOptions {
  limit?: number;
}

const coreTools: Array<{
  id: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
  meta: string;
  href: string;
  keywords: readonly string[];
}> = [
  {
    id: "option-pricer",
    title: { en: "European option pricer", es: "Valorador de opciones europeas" },
    description: { en: "BSM, Garman–Kohlhagen and Black-76", es: "BSM, Garman–Kohlhagen y Black-76" },
    meta: "ANALYTICS · LAB",
    href: "/lab?lab=vanilla",
    keywords: ["price", "option", "precio", "opción", "bsm", "black scholes", "garman kohlhagen", "black 76", "analytics", "lab"],
  },
  {
    id: "greeks-dashboard",
    title: { en: "Greeks dashboard", es: "Panel de griegas" },
    description: { en: "Delta, gamma, vega, theta and rho", es: "Delta, gamma, vega, theta y rho" },
    meta: "ANALYTICS · LAB",
    href: "/lab?lab=greeks",
    keywords: ["greeks", "griegas", "delta", "gamma", "vega", "theta", "rho", "analytics", "lab"],
  },
  {
    id: "portfolio-greeks-hedging",
    title: { en: "Portfolio Greeks & hedging", es: "Griegas y cobertura de cartera" },
    description: { en: "Aggregate risk, full repricing, Taylor P&L and hedge tickets", es: "Riesgo agregado, revaloración completa, P&L de Taylor y operaciones de cobertura" },
    meta: "ANALYTICS · PORTFOLIO",
    href: "/analytics/portfolio",
    keywords: ["portfolio", "cartera", "greeks", "griegas", "delta", "gamma", "vega", "hedge", "hedging", "cobertura", "scenario", "pnl", "risk"],
  },
  {
    id: "options-strategy-payoff",
    title: { en: "Options strategy & payoff", es: "Estrategias y payoff de opciones" },
    description: { en: "Exact payoff algebra, spreads, settlement and terminal economics", es: "Álgebra exacta de payoff, spreads, liquidación y economía terminal" },
    meta: "ANALYTICS · STRATEGY",
    href: "/analytics/strategies",
    keywords: ["option", "opción", "strategy", "estrategia", "payoff", "profit", "breakeven", "spread", "straddle", "strangle", "collar", "iron condor", "butterfly"],
  },
  {
    id: "market-making-hedge-replay",
    title: { en: "Market-making hedge replay", es: "Cobertura y repetición de market making" },
    description: { en: "Client flow, dealer Greeks, hedge friction, scenarios and cash reconciliation", es: "Flujo cliente, griegas del dealer, fricción de cobertura, escenarios y conciliación de caja" },
    meta: "ANALYTICS · MARKET MAKING",
    href: "/lab?lab=market-making",
    keywords: ["market maker", "market making", "client flow", "dealer", "hedge", "hedging", "cobertura", "delta", "vega", "replay", "blotter", "liquidity", "spread"],
  },
  {
    id: "prediction-workstation",
    title: { en: "Prediction workstation", es: "Estación de mercados de predicción" },
    description: { en: "Live events, L2 books, trades and public analytics", es: "Eventos en vivo, libros L2, operaciones y analítica pública" },
    meta: "MARKETS · LIVE PUBLIC",
    href: "/markets/predictions",
    keywords: ["predictions", "predicción", "probability", "events", "order book", "trades", "screener"],
  },
  {
    id: "market-intelligence",
    title: { en: "Market intelligence", es: "Inteligencia de mercado" },
    description: { en: "Returns, realized volatility, z-scores and range", es: "Retornos, volatilidad realizada, z-scores y rangos" },
    meta: "INTELLIGENCE",
    href: "/intelligence",
    keywords: ["market", "mercado", "intelligence", "inteligencia", "return", "realized volatility", "z score", "range", "analytics"],
  },
  {
    id: "quant-research",
    title: { en: "Quant research", es: "Investigación cuantitativa" },
    description: { en: "Frontier models and implementation notes", es: "Modelos de frontera y notas de implementación" },
    meta: "RESEARCH",
    href: "/research",
    keywords: ["research", "investigación", "rough volatility", "differentiable pricing", "monte carlo"],
  },
];

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function canonicalSearchHref(href: string): string {
  const normalized = href.trim();
  if (normalized === "/") return normalized;
  return normalized.replace(/\/(?=[?#]|$)/, "");
}

export function createCoreSearchItems(locale: Locale): PlatformSearchItem[] {
  const concepts: PlatformSearchItem[] = contentCatalog.map((source) => {
    const localized = localizeEntry(source, locale);
    return {
      id: `content-${assetPath(source.assetClass)}-${source.slug}`,
      source: "core",
      kind: "concept",
      title: localized.title,
      description: localized.description,
      meta: `${localized.assetClass} · ${localized.difficulty}`,
      href: `/learn/${assetPath(source.assetClass)}/${source.slug}`,
      keywords: [source.title, localized.title, source.description, localized.description, source.assetClass, source.type, source.difficulty, ...source.tags],
    };
  });
  const markets: PlatformSearchItem[] = demoMarketQuotes.map((quote) => ({
    id: `market-${quote.symbol.toLocaleLowerCase("en")}`,
    source: "core",
    kind: "market",
    title: quote.displaySymbol,
    description: quote.name,
    meta: `${quote.assetClass} · ${quote.status}`,
    href: marketDetailPath(quote.symbol),
    keywords: [quote.symbol, quote.name, quote.assetClass, "market", "quote", "mercado", "cotización"],
  }));
  const tools: PlatformSearchItem[] = coreTools.map((tool) => ({
    ...tool,
    source: "core",
    kind: "tool",
    title: tool.title[locale],
    description: tool.description[locale],
  }));
  return [...concepts, ...markets, ...tools];
}

export function mergeSearchItems(...indexes: ReadonlyArray<readonly PlatformSearchItem[]>): PlatformSearchItem[] {
  const merged: PlatformSearchItem[] = [];
  const indexesByHref = new Map<string, number>();
  for (const item of indexes.flat()) {
    const href = canonicalSearchHref(item.href);
    const existingIndex = indexesByHref.get(href);
    if (existingIndex === undefined) {
      indexesByHref.set(href, merged.length);
      merged.push({ ...item, href });
      continue;
    }
    if (item.source === "academy" && merged[existingIndex]?.source !== "academy") merged[existingIndex] = { ...item, href };
  }
  return merged;
}

function relevanceScore(item: PlatformSearchItem, normalizedQuery: string): number {
  const queryTokens = normalizedQuery.split(" ");
  const title = normalizeSearchText(item.title);
  const description = normalizeSearchText(item.description);
  const meta = normalizeSearchText(item.meta);
  const href = normalizeSearchText(item.href);
  const keywords = normalizeSearchText(item.keywords.join(" "));
  const searchable = `${title} ${description} ${meta} ${href} ${keywords}`;
  if (!queryTokens.every((token) => searchable.includes(token))) return 0;

  const titleTokens = title.split(" ");
  const keywordTokens = keywords.split(" ");
  let score = 1;
  if (title === normalizedQuery) score += 1_000;
  if (title.startsWith(normalizedQuery)) score += 700;
  else if (title.includes(normalizedQuery)) score += 500;
  for (const token of queryTokens) {
    if (titleTokens.includes(token)) score += 180;
    else if (titleTokens.some((candidate) => candidate.startsWith(token))) score += 140;
    else if (title.includes(token)) score += 100;
    if (keywordTokens.includes(token)) score += 60;
    else if (keywords.includes(token)) score += 30;
    if (description.includes(token)) score += 20;
    if (meta.includes(token)) score += 10;
    if (href.includes(token)) score += 5;
  }
  return score;
}

export function suggestPlatformItems(items: readonly PlatformSearchItem[], limit = 8): PlatformSearchItem[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (safeLimit === 0) return [];
  const buckets = new Map<PlatformSearchItemKind, PlatformSearchItem[]>();
  for (const item of items) {
    const bucket = buckets.get(item.kind) ?? [];
    bucket.push(item);
    buckets.set(item.kind, bucket);
  }
  const suggestions: PlatformSearchItem[] = [];
  for (let depth = 0; suggestions.length < safeLimit; depth += 1) {
    let added = false;
    for (const bucket of buckets.values()) {
      const item = bucket[depth];
      if (!item) continue;
      suggestions.push(item);
      added = true;
      if (suggestions.length === safeLimit) break;
    }
    if (!added) break;
  }
  return suggestions;
}

export function searchPlatformItems(
  items: readonly PlatformSearchItem[],
  query: string,
  options: PlatformSearchOptions = {},
): PlatformSearchItem[] {
  const limit = Math.max(0, Math.floor(options.limit ?? 10));
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return suggestPlatformItems(items, limit);
  return items
    .map((item, index) => ({ item, index, score: relevanceScore(item, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ item }) => item);
}
