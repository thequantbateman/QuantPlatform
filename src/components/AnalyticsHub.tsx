"use client";

import { scenariosForLab } from "@/src/analytics/guidance/scenarios";
import type { AnalyticsDifficulty, AnalyticsLabId } from "@/src/analytics/guidance/types";
import { pick, useI18n } from "@/src/i18n";

interface AnalyticsTool {
  index: string;
  labId: AnalyticsLabId;
  title: { en: string; es: string };
  question: { en: string; es: string };
  output: { en: string; es: string };
  difficulty: AnalyticsDifficulty;
  href: string;
}

const analyticsTools: readonly AnalyticsTool[] = [
  { index: "01", labId: "vanilla", title: { en: "European option pricer", es: "Valorador de opciones europeas" }, question: { en: "How do carry, volatility and moneyness become one arbitrage-consistent premium?", es: "¿Cómo se convierten carry, volatilidad y moneyness en una prima coherente con no arbitraje?" }, output: { en: "Premium, intrinsic/time value and parity residual", es: "Prima, valor intrínseco/temporal y residuo de paridad" }, difficulty: "foundation", href: "/lab?lab=vanilla" },
  { index: "02", labId: "greeks", title: { en: "Greeks dashboard", es: "Panel de griegas" }, question: { en: "Where does local option risk concentrate as the state and clock move?", es: "¿Dónde se concentra el riesgo local de la opción cuando cambian el estado y el reloj?" }, output: { en: "Delta, gamma, vega, theta and rho profiles", es: "Perfiles de delta, gamma, vega, theta y rho" }, difficulty: "practitioner", href: "/lab?lab=greeks" },
  { index: "03", labId: "volatility-surface", title: { en: "Volatility surface workbench", es: "Entorno de superficies de volatilidad" }, question: { en: "How do skew, curvature and term structure reshape option prices?", es: "¿Cómo transforman el skew, la curvatura y la estructura temporal los precios de opciones?" }, output: { en: "Linked heatmap, 3D surface, smile and term slices", es: "Mapa térmico, superficie 3D, sonrisa y cortes temporales enlazados" }, difficulty: "practitioner", href: "/analytics/volatility" },
  { index: "04", labId: "yield-curve", title: { en: "Yield-curve engine", es: "Motor de curvas de tipos" }, question: { en: "What discounting state is implied by the observable market nodes?", es: "¿Qué estado de descuento implican los nodos observables del mercado?" }, output: { en: "Discount factors, zero rates and instantaneous forwards", es: "Factores de descuento, tipos cero y forwards instantáneos" }, difficulty: "practitioner", href: "/lab?lab=curve" },
  { index: "05", labId: "portfolio", title: { en: "Portfolio Greeks & hedging", es: "Griegas y cobertura de cartera" }, question: { en: "How do positions aggregate into risk, scenario P&L and executable hedge tickets?", es: "¿Cómo se agregan las posiciones en riesgo, P&L por escenarios y coberturas ejecutables?" }, output: { en: "Portfolio Greeks, Taylor attribution and hedge comparison", es: "Griegas de cartera, atribución de Taylor y comparación de coberturas" }, difficulty: "front-office", href: "/analytics/portfolio" },
  { index: "06", labId: "strategies", title: { en: "Options strategy & payoff", es: "Estrategias y payoff de opciones" }, question: { en: "Which payoff geometry expresses a market view without hiding tail risk?", es: "¿Qué geometría de payoff expresa una visión de mercado sin ocultar el riesgo de cola?" }, output: { en: "Exact payoff, breakevens, extrema and transferred positions", es: "Payoff exacto, puntos de equilibrio, extremos y posiciones transferidas" }, difficulty: "practitioner", href: "/analytics/strategies" },
  { index: "07", labId: "market-making", title: { en: "Market-making hedge replay", es: "Cobertura y repetición de market making" }, question: { en: "How does client flow become dealer inventory, hedge action and residual P&L?", es: "¿Cómo se convierte el flujo cliente en inventario dealer, cobertura y P&L residual?" }, output: { en: "Dealer inventory, hedge replay and P&L decomposition", es: "Inventario dealer, repetición de coberturas y descomposición de P&L" }, difficulty: "front-office", href: "/lab?lab=market-making" },
];

const journey = [
  { en: "Instrument", es: "Instrumento" },
  { en: "Sensitivities", es: "Sensibilidades" },
  { en: "Surface / curve", es: "Superficie / curva" },
  { en: "Portfolio", es: "Cartera" },
  { en: "Strategy", es: "Estrategia" },
  { en: "Dealer inventory", es: "Inventario dealer" },
] as const;

export function AnalyticsHub() {
  const { locale, t } = useI18n();

  return <div className="analytics-hub">
    <header className="page-hero compact-hero section-shell">
      <span className="eyebrow">QUANT ENGINE · {pick(locale, { en: "DETERMINISTIC", es: "DETERMINISTA" })}</span>
      <h1>{pick(locale, { en: <>ANALYTICS,<br /><em>NOT ORACLES.</em></>, es: <>ANALÍTICA,<br /><em>NO ORÁCULOS.</em></> })}</h1>
      <p>{pick(locale, { en: "Choose a quantitative question, load a controlled experiment and explain the result through the model—not through a black box.", es: "Elige una pregunta cuantitativa, carga un experimento controlado y explica el resultado mediante el modelo, no mediante una caja negra." })}</p>
    </header>

    <nav className="analytics-journey section-shell" aria-label={pick(locale, { en: "Analytics learning progression", es: "Progresión de aprendizaje analítico" })}>
      {journey.map((step, index) => <span key={step.en}><b>{String(index + 1).padStart(2, "0")}</b>{pick(locale, step)}</span>)}
    </nav>

    <section className="analytics-tool-grid section-shell" aria-label={pick(locale, { en: "Quantitative Analytics tools", es: "Herramientas de analítica cuantitativa" })}>
      {analyticsTools.map((tool) => {
        const firstScenario = scenariosForLab(tool.labId)[0];
        return <a href={tool.href} key={tool.labId} data-analytics-tool={tool.labId}>
          <header><span>{tool.index}</span><small>{t(`analytics.guide.difficulty.${tool.difficulty}`)}</small></header>
          <h2>{pick(locale, tool.title)}</h2>
          <p>{pick(locale, tool.question)}</p>
          <dl>
            <div><dt>{pick(locale, { en: "FIRST EXPERIMENT", es: "PRIMER EXPERIMENTO" })}</dt><dd>{firstScenario ? pick(locale, firstScenario.name) : "—"}</dd></div>
            <div><dt>{pick(locale, { en: "PRIMARY OUTPUT", es: "RESULTADO PRINCIPAL" })}</dt><dd>{pick(locale, tool.output)}</dd></div>
          </dl>
          <b>{pick(locale, { en: "OPEN TOOL", es: "ABRIR HERRAMIENTA" })} →</b>
        </a>;
      })}
    </section>

    <section className="method-note section-shell">
      <span>{pick(locale, { en: "AUTHORITY ORDER", es: "ORDEN DE AUTORIDAD" })}</span>
      <p>{pick(locale, { en: "Quant engine for calculations → market providers for observed prices → local Learn corpus for definitions → AI only for explanation and navigation.", es: "Motor quant para cálculos → proveedores para precios observados → corpus local para definiciones → IA solo para explicación y navegación." })}</p>
    </section>
  </div>;
}
