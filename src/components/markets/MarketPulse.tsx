import { demoMarketPulse } from "@/src/data/markets";

export function MarketPulse() {
  return (
    <>
      <header className="page-hero section-shell markets-hero"><div><span className="eyebrow">MARKET PULSE · LOCAL SCENARIO</span><h1>WHAT MOVED.<br /><em>WHY A QUANT CARES.</em></h1></div><div className="market-status"><i /><strong>DEMO DATA</strong><span>10 AUG 2026 · 09:30 UTC</span></div></header>
      <section className="markets-grid section-shell">
        {demoMarketPulse.map((pulse, index) => <article className="pulse-card" key={pulse.instrument}><header><div><span>{pulse.assetClass}</span><strong>{pulse.instrument}</strong></div><span className="card-index">0{index + 1}</span></header><div className="pulse-price"><strong>{pulse.level}</strong><span className={pulse.direction}>{pulse.move}</span></div><div className="spark-bars" aria-label={`Illustrative recent path for ${pulse.instrument}`}>{pulse.history.map((value, point) => <i key={point} style={{ height: `${value}%` }} />)}</div><section><span>WHAT HAPPENED</span><p>{pulse.happened}</p></section><section><span>WHY A QUANT CARES</span><div className="impact-tags">{pulse.quantImpact.map((impact) => <b key={impact}>{impact}</b>)}</div></section></article>)}
      </section>
      <section className="scenario-strip section-shell"><div><span className="eyebrow">MODEL IMPACT CHAIN</span><h2>EUR 10Y +5BP</h2></div><div className="impact-flow"><span>Market quote</span><b>→</b><span>Curve rebuild</span><b>→</b><span>Discount factors</span><b>→</b><span>Swap PV</span><b>→</b><span>Risk report</span></div><p>Every displayed movement is synthetic and frozen. A real provider plugs into the same typed interface without changing presentation or quant logic.</p></section>
    </>
  );
}
