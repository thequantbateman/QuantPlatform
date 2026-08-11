"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { PredictionsDashboard } from "./markets/PredictionsDashboard";
import { marketIntelligenceMetrics } from "@/src/data/marketMetrics";
import { homeTickerIds, instrumentMaster } from "@/src/market-data/instrumentMaster";
import type { MarketInstrument } from "@/src/market-data/domain";
import { useMarketQuote, useMarketSnapshot } from "@/src/market-data/client/hooks";
import { formatMarketPrice, formatSessionMove } from "@/src/market-data/normalization";
import { pick, useI18n } from "@/src/i18n";

const learn = [
  ["Foundations", "Probability · pricing measure · numerics", "/learn?asset=Foundations"],
  ["Equity", "Forwards · BSM · Greeks · volatility", "/learn?asset=EQ"],
  ["FX", "Spot · forwards · GK · smile conventions", "/learn?asset=FX"],
  ["Rates", "Discounting · curves · swaps · DV01", "/learn?asset=IR"],
  ["Commodities", "Carry · curves · Black-76 · Asians", "/learn?asset=COMM"],
];

export function HomePage() {
  const { locale } = useI18n(); const lead = instrumentMaster.filter((instrument) => homeTickerIds.includes(instrument.id)); useMarketSnapshot(homeTickerIds, "LIVE_STREAM");
  return <div className="home-terminal">
    <section className="home-lead section-shell">
      <div className="home-title"><span className="eyebrow">THEQUANTBATEMAN · EDUCATION × MARKET INTELLIGENCE</span><h1>{pick(locale, { en: <>QUANTITATIVE FINANCE.<br /><em>MARKETS, MODELS & ANALYTICS.</em></>, es: <>FINANZAS CUANTITATIVAS.<br /><em>MERCADOS, MODELOS Y ANALÍTICA.</em></> })}</h1><p>{pick(locale, { en: "Learn the theory, inspect observed market context, then test the model in one source-aware workspace.", es: "Aprende la teoría, inspecciona el contexto de mercado y prueba el modelo en un espacio con fuentes explícitas." })}</p><div className="hero-actions"><a className="button button-primary" href="/learn">{pick(locale, { en: "START LEARNING", es: "EMPEZAR A APRENDER" })} <span>→</span></a><a className="button button-secondary" href="/markets">{pick(locale, { en: "OPEN MARKETS", es: "ABRIR MERCADOS" })} <span>→</span></a><a className="text-link" href="/analytics">{pick(locale, { en: "Run analytics", es: "Ejecutar analítica" })} ↗</a></div></div>
    </section>

    <section className="home-market-strip section-shell"><div className="module-head"><div><span className="eyebrow">MARKET PULSE · SOURCE AWARE</span><h2>{pick(locale, { en: "Visible inputs, explicit status", es: "Inputs visibles, estado explícito" })}</h2></div><a href="/markets">{pick(locale, { en: "All instruments", es: "Todos los instrumentos" })} →</a></div><div className="home-quotes">{lead.map((instrument) => <HomeQuote instrument={instrument} key={instrument.id} />)}</div></section>

    <section className="home-dual section-shell">
      <article className="home-module learn-module"><div className="module-head"><div><span className="eyebrow">LEARN · KNOWLEDGE GRAPH</span><h2>{pick(locale, { en: "From intuition to desk use", es: "De la intuición a la mesa" })}</h2></div><a href="/learn">100+ {pick(locale, { en: "concepts", es: "conceptos" })} →</a></div><div className="learn-list">{learn.map(([title, copy, href], index) => <a href={href} key={title}><span>0{index + 1}</span><div><strong>{title}</strong><small>{copy}</small></div><i>→</i></a>)}</div></article>
      <article className="home-module analytics-module"><div className="module-head"><div><span className="eyebrow">ANALYTICS · LOCAL QUANT ENGINE</span><h2>{pick(locale, { en: "Touch the assumptions", es: "Toca los supuestos" })}</h2></div><a href="/analytics">{pick(locale, { en: "All tools", es: "Todas las herramientas" })} →</a></div><div className="analytics-mini"><a href="/lab?lab=vanilla"><b>EUROPEAN OPTIONS</b><span>BSM · GK · BLACK-76</span><i>↗</i></a><a href="/lab?lab=greeks"><b>RISK GEOMETRY</b><span>Δ · Γ · ν · Θ · ρ</span><i>↗</i></a><a href="/lab?lab=surface"><b>VOLATILITY</b><span>SMILE · SURFACE · SKEW</span><i>↗</i></a><a href="/lab?lab=curve"><b>CURVES</b><span>DF · ZERO · FORWARD</span><i>↗</i></a></div><div className="formula-ribbon">∂V/∂t + ½σ²S²∂²V/∂S² + (r−q)S∂V/∂S − rV = 0</div></article>
    </section>

    <section className="home-predictions section-shell"><PredictionsDashboard compactView /></section>

    <section className="home-lower section-shell"><article className="today-concept"><span className="eyebrow">TODAY’S CONCEPT · VOLATILITY</span><h2>{pick(locale, { en: "Realized is measured. Implied is solved.", es: "La realizada se mide. La implícita se resuelve." })}</h2><p>{pick(locale, { en: "One comes from a return path; the other is the model input that reproduces an observed option price. They answer different questions.", es: "Una procede de retornos; la otra es el input que reproduce un precio observado. Responden preguntas distintas." })}</p><div><a className="button button-primary" href="/learn/equity/realized-vs-implied-volatility">{pick(locale, { en: "LEARN THE DIFFERENCE", es: "APRENDER LA DIFERENCIA" })} →</a><a className="text-link" href="/lab?lab=surface">{pick(locale, { en: "Open volatility lab", es: "Abrir laboratorio" })} ↗</a></div></article><article className="home-intelligence"><div className="module-head"><div><span className="eyebrow">MARKET INTELLIGENCE</span><h2>{pick(locale, { en: "Deterministic context", es: "Contexto determinista" })}</h2></div><a href="/intelligence">{pick(locale, { en: "Full board", es: "Panel completo" })} →</a></div>{lead.slice(0, 4).map((instrument) => <HomeIntelligence instrument={instrument} key={instrument.id} />)}</article></section>

    <section className="home-desk section-shell"><span className="eyebrow">FROM THE DESK</span><div><h2>{pick(locale, { en: "Calibration is not your model.", es: "La calibración no es tu modelo." })}</h2><p>{pick(locale, { en: "The optimizer found parameters. It did not certify assumptions, data quality or hedge behaviour.", es: "El optimizador encontró parámetros. No certificó supuestos, datos ni cobertura." })}</p></div><a className="button button-secondary" href="/desk">{pick(locale, { en: "READ DESK NOTES", es: "LEER NOTAS" })} →</a></section>
  </div>;
}

function HomeQuote({ instrument }: { instrument: MarketInstrument }) { const quote = useMarketQuote(instrument.id); return <a href={`/markets/${instrument.slug}`}><span><b>{instrument.symbol}</b><small>{quote ? `${quote.status} · ${quote.source}` : "NORMALIZING"}</small></span><strong>{quote ? formatMarketPrice(quote, instrument) : "—"}</strong><em className={(quote?.sessionChange ?? 0) >= 0 ? "positive" : "negative"}>{quote ? formatSessionMove(quote, instrument) : "—"}</em></a>; }
function HomeIntelligence({ instrument }: { instrument: MarketInstrument }) { const quote = useMarketQuote(instrument.id); const metric = marketIntelligenceMetrics(quote?.history ?? []); return <a href={`/markets/${instrument.slug}`}><b>{instrument.symbol}</b><span>1D {quote?.sessionChangePct === null || quote?.sessionChangePct === undefined ? "n/a" : `${quote.sessionChangePct >= 0 ? "+" : ""}${quote.sessionChangePct.toFixed(2)}%`}</span><span>Z {metric.zScore20D?.toFixed(2) ?? "n/a"}</span><i>→</i></a>; }
