"use client";

import { demoMarketPulse } from "@/src/data/markets";
import { pick, useI18n } from "@/src/i18n";

export function MarketPulse() {
  const { locale } = useI18n();
  return (
    <>
      <header className="page-hero section-shell markets-hero"><div><span className="eyebrow">{pick(locale, { en: "MARKET PULSE · LOCAL SCENARIO", es: "PULSO DE MERCADO · ESCENARIO LOCAL" })}</span><h1>{pick(locale, { en: <>WHAT MOVED.<br /><em>WHY A QUANT CARES.</em></>, es: <>QUÉ SE MOVIÓ.<br /><em>POR QUÉ IMPORTA.</em></> })}</h1></div><div className="market-status"><i /><strong>{pick(locale, { en: "DEMO DATA", es: "DATOS DEMO" })}</strong><span>10 AUG 2026 · 09:30 UTC</span></div></header>
      <section className="markets-grid section-shell">
        {demoMarketPulse.map((pulse, index) => <article className="pulse-card" key={pulse.instrument}><header><div><span>{pulse.assetClass}</span><strong>{pulse.instrument}</strong></div><span className="card-index">0{index + 1}</span></header><div className="pulse-price"><strong>{pulse.level}</strong><span className={pulse.direction}>{pulse.move}</span></div><div className="spark-bars" aria-label={`Illustrative recent path for ${pulse.instrument}`}>{pulse.history.map((value, point) => <i key={point} style={{ height: `${value}%` }} />)}</div><section><span>{pick(locale, { en: "WHAT HAPPENED", es: "QUÉ OCURRIÓ" })}</span><p>{locale === "es" ? "Movimiento sintético congelado para demostrar el flujo de escenario y la transmisión del riesgo." : pulse.happened}</p></section><section><span>{pick(locale, { en: "WHY A QUANT CARES", es: "POR QUÉ IMPORTA A UN QUANT" })}</span><div className="impact-tags">{pulse.quantImpact.map((impact) => <b key={impact}>{impact}</b>)}</div></section></article>)}
      </section>
      <section className="scenario-strip section-shell"><div><span className="eyebrow">{pick(locale, { en: "MODEL IMPACT CHAIN", es: "CADENA DE IMPACTO" })}</span><h2>EUR 10Y +5BP</h2></div><div className="impact-flow"><span>{pick(locale, { en: "Market quote", es: "Cotización" })}</span><b>→</b><span>{pick(locale, { en: "Curve rebuild", es: "Reconstruir curva" })}</span><b>→</b><span>{pick(locale, { en: "Discount factors", es: "Factores de descuento" })}</span><b>→</b><span>Swap PV</span><b>→</b><span>{pick(locale, { en: "Risk report", es: "Informe de riesgo" })}</span></div><p>{pick(locale, { en: "Every movement is synthetic and frozen. A real provider can plug into the typed interface without changing presentation or quant logic.", es: "Cada movimiento es sintético y está congelado. Un proveedor real puede conectarse a la interfaz tipada sin cambiar presentación ni lógica quant." })}</p></section>
    </>
  );
}
