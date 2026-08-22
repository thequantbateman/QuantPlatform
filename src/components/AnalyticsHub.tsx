"use client";

import { pick, useI18n } from "@/src/i18n";

const tools = [
  ["01", "European option pricer", "Valorador de opciones europeas", "BSM · Garman–Kohlhagen · Black-76", "BSM · Garman–Kohlhagen · Black-76", "/lab?lab=vanilla"],
  ["02", "Greeks dashboard", "Panel de griegas", "Delta · Gamma · Vega · Theta · Rho", "Delta · Gamma · Vega · Theta · Rho", "/lab?lab=greeks"],
  ["03", "Volatility surface workbench", "Entorno de superficies de volatilidad", "3D · Heatmap · Smile · Term · Scenarios", "3D · Mapa térmico · Sonrisa · Plazo · Escenarios", "/analytics/volatility"],
  ["04", "Yield-curve engine", "Motor de curvas de tipos", "Discount factors · Zeroes · Forwards", "Factores de descuento · Tipos cero · Forwards", "/lab?lab=curve"],
  ["05", "Portfolio Greeks & hedging", "Griegas y cobertura de cartera", "Aggregate risk · Scenarios · Taylor P&L · Hedge tickets", "Riesgo agregado · Escenarios · P&L de Taylor · Coberturas", "/analytics/portfolio"],
  ["06", "Options strategy & payoff", "Estrategias y payoff de opciones", "22 presets · Exact breakevens · Settlement · Transfer", "22 presets · Puntos de equilibrio exactos · Liquidación · Transferencia", "/analytics/strategies"],
  ["07", "Market-making hedge replay", "Cobertura y repetición de market making", "Client flow · Dealer risk · Hedge friction · Replay", "Flujo cliente · Riesgo dealer · Fricción · Repetición", "/lab?lab=market-making"],
] as const;

export function AnalyticsHub() {
  const { locale } = useI18n();
  return <div className="analytics-hub"><header className="page-hero compact-hero section-shell"><span className="eyebrow">QUANT ENGINE · {pick(locale, { en: "DETERMINISTIC", es: "DETERMINISTA" })}</span><h1>{pick(locale, { en: <>ANALYTICS,<br /><em>NOT ORACLES.</em></>, es: <>ANALÍTICA,<br /><em>NO ORÁCULOS.</em></> })}</h1><p>{pick(locale, { en: "Inspect assumptions, move parameters and reproduce every number through the platform’s typed pricing engine.", es: "Inspecciona supuestos, mueve parámetros y reproduce cada cifra mediante el motor de valoración tipado." })}</p></header><section className="analytics-tool-grid section-shell">{tools.map(([index, en, es, copyEn, copyEs, href]) => <a href={href} key={en}><span>{index}</span><h2>{locale === "es" ? es : en}</h2><p>{locale === "es" ? copyEs : copyEn}</p><b>{pick(locale, { en: "OPEN TOOL", es: "ABRIR HERRAMIENTA" })} →</b></a>)}</section><section className="method-note section-shell"><span>{pick(locale, { en: "AUTHORITY ORDER", es: "ORDEN DE AUTORIDAD" })}</span><p>{pick(locale, { en: "Quant engine for calculations → market providers for observed prices → local Learn corpus for definitions → AI only for explanation and navigation.", es: "Motor quant para cálculos → proveedores para precios observados → corpus local para definiciones → IA solo para explicación y navegación." })}</p></section></div>;
}
