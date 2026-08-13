import type { Locale } from "@/src/i18n";

export type PlatformMapNodeKind = "platform" | "track" | "workflow";

export interface PlatformMapNode {
  id: string;
  kind: PlatformMapNodeKind;
  label: { en: string; es: string };
  description: { en: string; es: string };
  href: string;
  trackId?: string;
  x: number;
  y: number;
}

export interface PlatformMapEdge {
  source: string;
  target: string;
}

export interface LocalizedPlatformMapNode extends Omit<PlatformMapNode, "label" | "description"> {
  label: string;
  description: string;
}

export interface LocalizedPlatformMap {
  nodes: LocalizedPlatformMapNode[];
  edges: PlatformMapEdge[];
}

export const platformMapRouteAllowlist: readonly string[] = ["/learn", "/analytics", "/markets", "/ask"];

export const platformMapNodes: PlatformMapNode[] = [
  {
    id: "academy",
    kind: "platform",
    label: { en: "Academy", es: "Academia" },
    description: { en: "Structured quantitative-finance learning paths.", es: "Itinerarios estructurados de finanzas cuantitativas." },
    href: "/learn",
    x: 50,
    y: 8,
  },
  {
    id: "foundations",
    kind: "track",
    label: { en: "Foundations", es: "Fundamentos" },
    description: { en: "Probability, measures and pricing foundations.", es: "Fundamentos de probabilidad, medidas y valoración." },
    href: "/learn#track-foundations",
    trackId: "foundations",
    x: 12,
    y: 34,
  },
  {
    id: "volatility",
    kind: "track",
    label: { en: "Volatility", es: "Volatilidad" },
    description: { en: "From realized volatility to calibrated surfaces.", es: "De la volatilidad realizada a superficies calibradas." },
    href: "/learn#track-volatility",
    trackId: "volatility",
    x: 27,
    y: 56,
  },
  {
    id: "rates",
    kind: "track",
    label: { en: "Rates", es: "Tipos" },
    description: { en: "Discounting, curves, products and rate dynamics.", es: "Descuento, curvas, productos y dinámica de tipos." },
    href: "/learn#track-rates",
    trackId: "rates",
    x: 43,
    y: 34,
  },
  {
    id: "numerical-finance",
    kind: "track",
    label: { en: "Numerical Finance", es: "Finanzas numéricas" },
    description: { en: "Simulation, convergence and transform pricing.", es: "Simulación, convergencia y valoración por transformadas." },
    href: "/learn#track-numerical-finance",
    trackId: "numerical-finance",
    x: 58,
    y: 56,
  },
  {
    id: "greeks-hedging",
    kind: "track",
    label: { en: "Greeks & Hedging", es: "Griegas y cobertura" },
    description: { en: "Sensitivities, hedge design and P&L attribution.", es: "Sensibilidades, diseño de coberturas y atribución de P&L." },
    href: "/learn#track-greeks-hedging",
    trackId: "greeks-hedging",
    x: 73,
    y: 34,
  },
  {
    id: "risk-xva",
    kind: "track",
    label: { en: "Risk & xVA", es: "Riesgo y xVA" },
    description: { en: "Exposure, valuation adjustments and model governance.", es: "Exposición, ajustes de valoración y gobernanza de modelos." },
    href: "/learn#track-risk-xva",
    trackId: "risk-xva",
    x: 88,
    y: 56,
  },
  {
    id: "markets",
    kind: "workflow",
    label: { en: "Markets", es: "Mercados" },
    description: { en: "Inspect labelled market and reference data.", es: "Consulta datos de mercado y referencia etiquetados." },
    href: "/markets",
    x: 25,
    y: 86,
  },
  {
    id: "analytics",
    kind: "workflow",
    label: { en: "Analytics / Pricing", es: "Analítica / Valoración" },
    description: { en: "Run deterministic pricing and risk workflows.", es: "Ejecuta flujos deterministas de valoración y riesgo." },
    href: "/analytics",
    x: 50,
    y: 78,
  },
  {
    id: "ask",
    kind: "workflow",
    label: { en: "Ask", es: "Preguntar" },
    description: { en: "Ask a grounded question across learning and analytics.", es: "Formula una pregunta fundamentada sobre aprendizaje y analítica." },
    href: "/ask",
    x: 75,
    y: 86,
  },
];

export const platformMapEdges: PlatformMapEdge[] = [
  { source: "academy", target: "foundations" },
  { source: "academy", target: "volatility" },
  { source: "academy", target: "rates" },
  { source: "academy", target: "numerical-finance" },
  { source: "academy", target: "greeks-hedging" },
  { source: "academy", target: "risk-xva" },
  { source: "foundations", target: "numerical-finance" },
  { source: "foundations", target: "volatility" },
  { source: "foundations", target: "rates" },
  { source: "numerical-finance", target: "volatility" },
  { source: "numerical-finance", target: "rates" },
  { source: "volatility", target: "greeks-hedging" },
  { source: "rates", target: "risk-xva" },
  { source: "greeks-hedging", target: "risk-xva" },
  { source: "volatility", target: "analytics" },
  { source: "rates", target: "analytics" },
  { source: "numerical-finance", target: "analytics" },
  { source: "greeks-hedging", target: "analytics" },
  { source: "risk-xva", target: "analytics" },
  { source: "markets", target: "analytics" },
  { source: "analytics", target: "ask" },
];

export function getPlatformMapSelection(
  selectedId: string,
  nodes: readonly PlatformMapNode[] = platformMapNodes,
  edges: readonly PlatformMapEdge[] = platformMapEdges,
): PlatformMapNode[] {
  if (!nodes.some((node) => node.id === selectedId)) return [];
  const selectedIds = new Set([selectedId]);
  for (const edge of edges) {
    if (edge.source === selectedId) selectedIds.add(edge.target);
    if (edge.target === selectedId) selectedIds.add(edge.source);
  }
  return nodes.filter((node) => selectedIds.has(node.id));
}

export function getLocalizedPlatformMap(locale: Locale): LocalizedPlatformMap {
  return {
    nodes: platformMapNodes.map(({ label, description, ...node }) => ({
      ...node,
      label: label[locale],
      description: description[locale],
    })),
    edges: platformMapEdges.map((edge) => ({ ...edge })),
  };
}
