"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { demoMarketQuotes, marketDetailPath, type AssetClass, type DataStatus } from "@/src/data/markets";
import { pick, useI18n } from "@/src/i18n";

const groups: AssetClass[] = ["FX", "EQ", "IR", "COMM"];
const statusLabel = (status: DataStatus, locale: "en" | "es") => ({ LIVE: "LIVE", NEAR_REAL_TIME: locale === "es" ? "CASI EN TIEMPO REAL" : "NEAR REAL TIME", DELAYED: locale === "es" ? "RETRASADO" : "DELAYED", EOD: "EOD", REFERENCE: locale === "es" ? "REFERENCIA" : "REFERENCE", DEMO: "DEMO" })[status];

export function MarketPulse() {
  const { locale } = useI18n();
  return (
    <>
      <header className="page-hero section-shell markets-hero"><div><span className="eyebrow">{pick(locale, { en: "MARKET BOARD · SOURCE-AWARE", es: "PANEL DE MERCADO · CON FUENTES" })}</span><h1>{pick(locale, { en: <>MARKET →<br /><em>MODEL.</em></>, es: <>MERCADO →<br /><em>MODELO.</em></> })}</h1><p>{pick(locale, { en: "A compact instrument board with explicit provenance. Demo prices are never presented as live quotes.", es: "Un panel compacto con procedencia explícita. Los precios demo nunca se presentan como cotizaciones en vivo." })}</p></div><div className="market-status"><i /><strong>{pick(locale, { en: "REFERENCE + DEMO", es: "REFERENCIA + DEMO" })}</strong><span>{pick(locale, { en: "NO REDISTRIBUTION CLAIMS", es: "SIN AFIRMAR REDISTRIBUCIÓN" })}</span></div></header>
      <section className="market-board section-shell">
        {groups.map((group) => <div className="market-group" key={group}><header><strong>{group}</strong><span>{demoMarketQuotes.filter((quote) => quote.assetClass === group).length} {pick(locale, { en: "instruments", es: "instrumentos" })}</span></header>{demoMarketQuotes.filter((quote) => quote.assetClass === group).map((quote) => <a className="market-row" href={marketDetailPath(quote.symbol)} key={quote.symbol}><span><strong>{quote.displaySymbol}</strong><small>{quote.name}</small></span><b>{quote.currency === "%" ? `${quote.price.toFixed(3)}%` : quote.price < 10 ? quote.price.toFixed(4) : quote.price.toFixed(2)}</b><em className={quote.changePercent >= 0 ? "positive" : "negative"}>{quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%</em><span className={`data-status status-${quote.status.toLowerCase()}`}>{statusLabel(quote.status, locale)}</span><span className="market-source">{quote.source}</span><i>→</i></a>)}</div>)}
      </section>
      <section className="market-branch section-shell"><div><span className="eyebrow">PUBLIC EVENT MARKETS</span><h2>{pick(locale, { en: "Macro probabilities, read only.", es: "Probabilidades macro, solo lectura." })}</h2><p>{pick(locale, { en: "Observed Polymarket prices with volume, liquidity and probability semantics. No wallet or trading controls.", es: "Precios observados de Polymarket con volumen, liquidez y semántica. Sin cartera ni operativa." })}</p></div><a className="button button-primary" href="/markets/predictions">{pick(locale, { en: "OPEN PREDICTIONS", es: "ABRIR PREDICCIONES" })} →</a></section>
      <section className="scenario-strip section-shell"><div><span className="eyebrow">{pick(locale, { en: "GOLDEN WORKFLOW", es: "FLUJO PRINCIPAL" })}</span><h2>Market → Instrument → Model</h2></div><div className="impact-flow"><span>{pick(locale, { en: "Select quote", es: "Elegir cotización" })}</span><b>→</b><span>{pick(locale, { en: "Inspect lineage", es: "Ver procedencia" })}</span><b>→</b><span>{pick(locale, { en: "Open pricer", es: "Abrir pricer" })}</span><b>→</b><span>{pick(locale, { en: "Move risk", es: "Mover riesgo" })}</span></div><p>{pick(locale, { en: "External quote adapters are server-only. Without a licensed display key, the board falls back transparently to frozen scenarios and ECB reference rates.", es: "Los adaptadores externos solo se ejecutan en servidor. Sin una clave con licencia de visualización, el panel usa escenarios congelados y tipos de referencia del BCE de forma transparente." })}</p></section>
    </>
  );
}
