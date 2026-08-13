"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { PredictionsDashboard } from "./markets/PredictionsDashboard";
import { PlatformKnowledgeMap } from "./home/PlatformKnowledgeMap";
import { marketIntelligenceMetrics } from "@/src/data/marketMetrics";
import { homeTickerIds, instrumentMaster } from "@/src/market-data/instrumentMaster";
import type { MarketInstrument } from "@/src/market-data/domain";
import { useMarketQuote, useMarketSnapshot } from "@/src/market-data/client/hooks";
import { formatMarketPrice, formatSessionMove } from "@/src/market-data/normalization";
import { pick, useI18n } from "@/src/i18n";

export function HomePage() {
  const { locale, t } = useI18n();
  const lead = instrumentMaster.filter((instrument) => homeTickerIds.includes(instrument.id));
  useMarketSnapshot(homeTickerIds, "LIVE_STREAM");
  const tasks = [
    { id: "learn", href: "/learn", title: t("home.tasks.learn.title"), copy: t("home.tasks.learn.copy"), cta: t("home.tasks.learn.cta") },
    { id: "analyze", href: "/analytics", title: t("home.tasks.analyze.title"), copy: t("home.tasks.analyze.copy"), cta: t("home.tasks.analyze.cta") },
    { id: "markets", href: "/markets", title: t("home.tasks.markets.title"), copy: t("home.tasks.markets.copy"), cta: t("home.tasks.markets.cta") },
    { id: "ask", href: "/ask", title: t("home.tasks.ask.title"), copy: t("home.tasks.ask.copy"), cta: t("home.tasks.ask.cta") },
  ];
  return <div className="home-terminal">
    <section className="home-lead section-shell">
      <div className="home-title"><span className="eyebrow">{t("home.hero.eyebrow")}</span><h1>{t("home.hero.title")}</h1><p>{t("home.hero.copy")}</p><div className="hero-actions"><a className="button button-primary" href="/learn">{t("home.hero.primary")} <span aria-hidden="true">→</span></a></div></div>
    </section>

    <PlatformKnowledgeMap />

    <section className="home-tasks section-shell" aria-labelledby="home-tasks-title">
      <header><h2 id="home-tasks-title">{t("home.tasks.title")}</h2><p>{t("home.tasks.copy")}</p></header>
      <div className="home-task-grid">
        {tasks.map((task) => <a data-home-task={task.id} href={task.href} key={task.id}><strong>{task.title}</strong><p>{task.copy}</p><span>{task.cta} <i aria-hidden="true">→</i></span></a>)}
      </div>
    </section>

    <section className="home-market-strip section-shell"><div className="module-head"><div><span className="eyebrow">{pick(locale, { en: "MARKET PULSE · SOURCE AWARE", es: "PULSO DE MERCADO · FUENTES EXPLÍCITAS" })}</span><h2>{pick(locale, { en: "Visible inputs, explicit status", es: "Inputs visibles, estado explícito" })}</h2></div><a href="/markets">{pick(locale, { en: "All instruments", es: "Todos los instrumentos" })} →</a></div><div className="home-quotes">{lead.map((instrument) => <HomeQuote instrument={instrument} locale={locale} key={instrument.id} />)}</div></section>

    <section className="home-predictions section-shell"><PredictionsDashboard compactView /></section>

    <section className="home-lower section-shell"><article className="today-concept"><span className="eyebrow">{pick(locale, { en: "TODAY’S CONCEPT · VOLATILITY", es: "CONCEPTO DEL DÍA · VOLATILIDAD" })}</span><h2>{pick(locale, { en: "Realized is measured. Implied is solved.", es: "La realizada se mide. La implícita se resuelve." })}</h2><p>{pick(locale, { en: "One comes from a return path; the other is the model input that reproduces an observed option price. They answer different questions.", es: "Una procede de retornos; la otra es el input que reproduce un precio observado. Responden preguntas distintas." })}</p><div><a className="button button-primary" href="/learn/equity/realized-vs-implied-volatility">{pick(locale, { en: "LEARN THE DIFFERENCE", es: "APRENDER LA DIFERENCIA" })} →</a><a className="text-link" href="/lab?lab=surface">{pick(locale, { en: "Open volatility lab", es: "Abrir laboratorio" })} ↗</a></div></article><article className="home-intelligence"><div className="module-head"><div><span className="eyebrow">{pick(locale, { en: "MARKET INTELLIGENCE", es: "INTELIGENCIA DE MERCADO" })}</span><h2>{pick(locale, { en: "Deterministic context", es: "Contexto determinista" })}</h2></div><a href="/intelligence">{pick(locale, { en: "Full board", es: "Panel completo" })} →</a></div>{lead.slice(0, 4).map((instrument) => <HomeIntelligence instrument={instrument} locale={locale} key={instrument.id} />)}</article></section>

    <section className="home-desk section-shell"><span className="eyebrow">{pick(locale, { en: "FROM THE DESK", es: "DESDE LA MESA" })}</span><div><h2>{pick(locale, { en: "Calibration is not your model.", es: "La calibración no es tu modelo." })}</h2><p>{pick(locale, { en: "The optimizer found parameters. It did not certify assumptions, data quality or hedge behaviour.", es: "El optimizador encontró parámetros. No certificó supuestos, datos ni cobertura." })}</p></div><a className="button button-secondary" href="/desk">{pick(locale, { en: "READ DESK NOTES", es: "LEER NOTAS" })} →</a></section>
  </div>;
}

function HomeQuote({ instrument, locale }: { instrument: MarketInstrument; locale: "en" | "es" }) { const quote = useMarketQuote(instrument.id); return <a href={`/markets/${instrument.slug}`}><span><b>{instrument.symbol}</b><small>{quote ? `${quote.status} · ${quote.source}` : pick(locale, { en: "NORMALIZING", es: "NORMALIZANDO" })}</small></span><strong>{quote ? formatMarketPrice(quote, instrument) : "—"}</strong><em className={(quote?.sessionChange ?? 0) >= 0 ? "positive" : "negative"}>{quote ? formatSessionMove(quote, instrument) : "—"}</em></a>; }
function HomeIntelligence({ instrument, locale }: { instrument: MarketInstrument; locale: "en" | "es" }) { const quote = useMarketQuote(instrument.id); const metric = marketIntelligenceMetrics(quote?.history ?? []); const na = locale === "es" ? "n/d" : "n/a"; return <a href={`/markets/${instrument.slug}`}><b>{instrument.symbol}</b><span>1D {quote?.sessionChangePct === null || quote?.sessionChangePct === undefined ? na : `${quote.sessionChangePct >= 0 ? "+" : ""}${quote.sessionChangePct.toFixed(2)}%`}</span><span>Z {metric.zScore20D?.toFixed(2) ?? na}</span><i>→</i></a>; }
