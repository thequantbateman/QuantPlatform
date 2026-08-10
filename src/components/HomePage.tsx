"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { Avatar } from "./avatar/Avatar";
import { PredictionsDashboard } from "./markets/PredictionsDashboard";
import { demoMarketQuotes, marketDetailPath } from "@/src/data/markets";
import { marketIntelligenceMetrics } from "@/src/data/marketMetrics";
import { pick, useI18n } from "@/src/i18n";

const learn = [
  ["Foundations", "Probability · pricing measure · numerics", "/learn?asset=Foundations"],
  ["Equity", "Forwards · BSM · Greeks · volatility", "/learn?asset=EQ"],
  ["FX", "Spot · forwards · GK · smile conventions", "/learn?asset=FX"],
  ["Rates", "Discounting · curves · swaps · DV01", "/learn?asset=IR"],
  ["Commodities", "Carry · curves · Black-76 · Asians", "/learn?asset=COMM"],
];

export function HomePage() {
  const { locale } = useI18n(); const lead = demoMarketQuotes.slice(0, 5);
  return <div className="home-terminal">
    <section className="home-lead section-shell">
      <div className="home-title"><span className="eyebrow">THEQUANTBATEMAN · EDUCATION × MARKET INTELLIGENCE</span><h1>{pick(locale, { en: <>QUANTITATIVE FINANCE.<br /><em>MARKETS, MODELS & ANALYTICS.</em></>, es: <>FINANZAS CUANTITATIVAS.<br /><em>MERCADOS, MODELOS Y ANALÍTICA.</em></> })}</h1><p>{pick(locale, { en: "Learn the theory, inspect observed market context, then test the model in one source-aware workspace.", es: "Aprende la teoría, inspecciona el contexto de mercado y prueba el modelo en un espacio con fuentes explícitas." })}</p><div className="hero-actions"><a className="button button-primary" href="/learn">{pick(locale, { en: "START LEARNING", es: "EMPEZAR A APRENDER" })} <span>→</span></a><a className="button button-secondary" href="/markets">{pick(locale, { en: "OPEN MARKETS", es: "ABRIR MERCADOS" })} <span>→</span></a><a className="text-link" href="/analytics">{pick(locale, { en: "Run analytics", es: "Ejecutar analítica" })} ↗</a></div></div>
      <aside className="bateman-signal"><Avatar state="idle" compact interactive /><div><span>BATEMAN · THEMATIC GUIDE</span><p>{pick(locale, { en: "Market price is an observation. Model price is an argument. Keep the lineage visible.", es: "El precio de mercado es una observación. El precio de modelo es un argumento. Muestra la procedencia." })}</p><small>{pick(locale, { en: "Animation states prepared for later iterations", es: "Estados de animación preparados para próximas iteraciones" })}</small></div></aside>
    </section>

    <section className="home-market-strip section-shell"><div className="module-head"><div><span className="eyebrow">MARKET PULSE · SOURCE AWARE</span><h2>{pick(locale, { en: "Visible inputs, explicit status", es: "Inputs visibles, estado explícito" })}</h2></div><a href="/markets">{pick(locale, { en: "All instruments", es: "Todos los instrumentos" })} →</a></div><div className="home-quotes">{lead.map((quote) => <a href={marketDetailPath(quote.symbol)} key={quote.symbol}><span><b>{quote.displaySymbol}</b><small>{quote.status} · {quote.source}</small></span><strong>{quote.currency === "%" ? `${quote.price.toFixed(3)}%` : quote.price < 10 ? quote.price.toFixed(4) : quote.price.toFixed(2)}</strong><em className={quote.changePercent >= 0 ? "positive" : "negative"}>{quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%</em></a>)}</div></section>

    <section className="home-dual section-shell">
      <article className="home-module learn-module"><div className="module-head"><div><span className="eyebrow">LEARN · KNOWLEDGE GRAPH</span><h2>{pick(locale, { en: "From intuition to desk use", es: "De la intuición a la mesa" })}</h2></div><a href="/learn">100+ {pick(locale, { en: "concepts", es: "conceptos" })} →</a></div><div className="learn-list">{learn.map(([title, copy, href], index) => <a href={href} key={title}><span>0{index + 1}</span><div><strong>{title}</strong><small>{copy}</small></div><i>→</i></a>)}</div></article>
      <article className="home-module analytics-module"><div className="module-head"><div><span className="eyebrow">ANALYTICS · LOCAL QUANT ENGINE</span><h2>{pick(locale, { en: "Touch the assumptions", es: "Toca los supuestos" })}</h2></div><a href="/analytics">{pick(locale, { en: "All tools", es: "Todas las herramientas" })} →</a></div><div className="analytics-mini"><a href="/lab?lab=vanilla"><b>EUROPEAN OPTIONS</b><span>BSM · GK · BLACK-76</span><i>↗</i></a><a href="/lab?lab=greeks"><b>RISK GEOMETRY</b><span>Δ · Γ · ν · Θ · ρ</span><i>↗</i></a><a href="/lab?lab=surface"><b>VOLATILITY</b><span>SMILE · SURFACE · SKEW</span><i>↗</i></a><a href="/lab?lab=curve"><b>CURVES</b><span>DF · ZERO · FORWARD</span><i>↗</i></a></div><div className="formula-ribbon">∂V/∂t + ½σ²S²∂²V/∂S² + (r−q)S∂V/∂S − rV = 0</div></article>
    </section>

    <section className="home-predictions section-shell"><PredictionsDashboard compactView /></section>

    <section className="home-lower section-shell"><article className="today-concept"><span className="eyebrow">TODAY’S CONCEPT · VOLATILITY</span><h2>{pick(locale, { en: "Realized is measured. Implied is solved.", es: "La realizada se mide. La implícita se resuelve." })}</h2><p>{pick(locale, { en: "One comes from a return path; the other is the model input that reproduces an observed option price. They answer different questions.", es: "Una procede de retornos; la otra es el input que reproduce un precio observado. Responden preguntas distintas." })}</p><div><a className="button button-primary" href="/learn/equity/realized-vs-implied-volatility">{pick(locale, { en: "LEARN THE DIFFERENCE", es: "APRENDER LA DIFERENCIA" })} →</a><a className="text-link" href="/lab?lab=surface">{pick(locale, { en: "Open volatility lab", es: "Abrir laboratorio" })} ↗</a></div></article><article className="home-intelligence"><div className="module-head"><div><span className="eyebrow">MARKET INTELLIGENCE</span><h2>{pick(locale, { en: "Deterministic context", es: "Contexto determinista" })}</h2></div><a href="/intelligence">{pick(locale, { en: "Full board", es: "Panel completo" })} →</a></div>{demoMarketQuotes.slice(0, 4).map((quote) => { const metric = marketIntelligenceMetrics(quote.history); return <a href={marketDetailPath(quote.symbol)} key={quote.symbol}><b>{quote.displaySymbol}</b><span>1D {metric.return1D >= 0 ? "+" : ""}{metric.return1D.toFixed(2)}%</span><span>Z {metric.zScore20D?.toFixed(2) ?? "n/a"}</span><i>→</i></a>; })}</article></section>

    <section className="home-desk section-shell"><span className="eyebrow">FROM THE DESK</span><div><h2>{pick(locale, { en: "Calibration is not your model.", es: "La calibración no es tu modelo." })}</h2><p>{pick(locale, { en: "The optimizer found parameters. It did not certify assumptions, data quality or hedge behaviour.", es: "El optimizador encontró parámetros. No certificó supuestos, datos ni cobertura." })}</p></div><a className="button button-secondary" href="/desk">{pick(locale, { en: "READ DESK NOTES", es: "LEER NOTAS" })} →</a></section>
  </div>;
}
