import { Avatar } from "./avatar/Avatar";
import Link from "next/link";

const assetCards = [
  { code: "FX", label: "Foreign Exchange", meta: "Spot · Forwards · Smile", note: "Two curves. One convention error away from trouble.", href: "/learn?asset=FX" },
  { code: "EQ", label: "Equity", meta: "Options · Greeks · Volatility", note: "The model is simple. The surface has other plans.", href: "/learn?asset=EQ" },
  { code: "IR", label: "Interest Rates", meta: "Curves · Swaps · Bootstrapping", note: "Every tenor remembers what you did to it.", href: "/learn?asset=IR" },
  { code: "COMM", label: "Commodities", meta: "Carry · Curves · Options", note: "Storage is a model parameter with a warehouse.", href: "/learn?asset=COMM" },
];

const desk = [
  { tag: "MODEL DEBATE", title: "Is Local Vol Actually Useful?", copy: "A precise answer to a question that deserves better than ‘it fits the smile’." },
  { tag: "MARKET NOTE", title: "Sticky Delta vs Sticky Strike", copy: "What are we actually assuming when spot moves and the surface refuses to sit still?" },
  { tag: "QUANT THOUGHT", title: "Calibration is not your model", copy: "The optimizer found parameters. It did not certify your assumptions." },
];

export function HomePage() {
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-copy">
          <span className="eyebrow">THEQUANTBATEMAN · EST. 2026</span>
          <h1>QUANT FINANCE,<br /><em>VISUALLY EXPLAINED.</em></h1>
          <p className="hero-sub">Models. Markets. Mathematics.<br />No PowerPoint.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/lab">Enter the lab <span>↗</span></a>
            <Link className="button button-secondary" href="/learn">Start learning <span>→</span></Link>
          </div>
          <div className="hero-proof">
            <div><strong>04</strong><span>interactive labs</span></div>
            <div><strong>40+</strong><span>model notes</span></div>
            <div><strong>00</strong><span>live-data pretences</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="market-tape"><span>SPX 6,389.45</span><span>EURUSD 1.1642</span><span>EUR 10Y 2.71%</span></div>
          <div className="avatar-stage">
            <span className="avatar-kicker">ORIGINAL FICTIONAL CHARACTER · MVP STATE 01</span>
            <Avatar state="idle" />
            <blockquote>“Your option isn’t cheap.<br />Your volatility assumption is.”</blockquote>
          </div>
          <div className="hero-formula">∂V/∂t + ½σ²S²∂²V/∂S² + (r−q)S∂V/∂S − rV = 0</div>
        </div>
      </section>

      <section className="asset-section section-shell">
        <div className="section-heading"><div><span className="eyebrow">KNOWLEDGE GRAPH</span><h2>CHOOSE YOUR MARKET.</h2></div><p>Start with intuition. Reveal the mathematics when you are ready. Finish with the view from the desk.</p></div>
        <div className="asset-grid">
          {assetCards.map((asset, index) => (
            <a className="asset-card" href={asset.href} key={asset.code}>
              <span className="card-index">0{index + 1}</span>
              <div className={`asset-monogram monogram-${asset.code.toLowerCase()}`}>{asset.code}</div>
              <h3>{asset.label}</h3><span>{asset.meta}</span><p>{asset.note}</p><b>Explore {asset.code} <i>→</i></b>
            </a>
          ))}
        </div>
      </section>

      <section className="lab-feature">
        <div className="section-shell lab-feature-grid">
          <div>
            <span className="eyebrow light">QUANT LAB · EXPERIMENT 03</span>
            <h2>DON’T READ<br />THE MODEL.<br /><em>TOUCH IT.</em></h2>
            <p>Deform a synthetic volatility surface. Rotate it. Slice it. Then ask what the skew is actually pricing.</p>
            <a className="button button-light" href="/lab?lab=surface">Open volatility surface <span>↗</span></a>
          </div>
          <div className="mini-surface" aria-label="Illustrative volatility surface preview">
            <div className="surface-header"><span>SYNTHETIC_SURFACE_03</span><span>ATM 18.40% · SKEW −7.25</span></div>
            <div className="wire-grid">
              {Array.from({ length: 56 }, (_, index) => <i key={index} style={{ "--height": `${28 + ((index * 17) % 42) + Math.abs((index % 8) - 4) * 7}%` } as React.CSSProperties} />)}
            </div>
            <div className="surface-readout"><span>0.80 <b>MONEYNESS</b> 1.20</span><span>3M <b>MATURITY</b> 3Y</span></div>
          </div>
        </div>
      </section>

      <section className="desk-section section-shell">
        <div className="section-heading"><div><span className="eyebrow">FROM THE DESK</span><h2>NOTES WITH<br /><em>CONSEQUENCES.</em></h2></div><a className="text-link" href="/desk">Read all desk notes →</a></div>
        <div className="editorial-grid">
          {desk.map((article, index) => (
            <article className={`editorial-card editorial-${index + 1}`} key={article.title}>
              <span className="eyebrow">{article.tag} · 0{index + 1}</span><h3>{article.title}</h3><p>{article.copy}</p><a href="/desk">Read note <span>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="frontier-section section-shell">
        <div className="frontier-intro"><span className="eyebrow">QUANT FRONTIER</span><h2>THE EDGE,<br />WITHOUT THE HYPE.</h2><p>Separate desk-standard tools from active research. Know what is promising, what is production-ready, and what still needs a very patient reviewer.</p></div>
        <div className="frontier-list">
          {[
            ["01", "Rough Volatility", "ACTIVE RESEARCH", "Short-scale structure and the remarkably inconvenient Hurst exponent."],
            ["02", "Differentiable Pricing", "EMERGING", "Risk and calibration as first-class derivatives of the pricing program."],
            ["03", "Machine Learning Surrogates", "ACTIVE DEPLOYMENT", "Fast approximations, controlled domains, absolutely no magical thinking."],
          ].map(([index, title, status, copy]) => <a href="/research" key={title}><span>{index}</span><div><h3>{title}</h3><p>{copy}</p></div><b>{status}</b><i>↗</i></a>)}
        </div>
      </section>

      <section className="ask-banner">
        <div className="section-shell ask-banner-grid">
          <Avatar state="amused" compact />
          <div><span className="eyebrow light">ASK THEQUANTBATEMAN</span><h2>“WHY DOES GAMMA<br />EXPLODE NEAR MATURITY?”</h2><p>Ask for intuition. Go deeper. Show the mathematics. Switch to desk view.</p></div>
          <a className="button button-light" href="/ask">Ask the quant <span>→</span></a>
        </div>
      </section>
    </>
  );
}
