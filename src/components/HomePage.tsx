"use client";

import { Avatar } from "./avatar/Avatar";
import Link from "next/link";
import { pick, useI18n } from "@/src/i18n";

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
  const { locale } = useI18n();
  const copy = pick(locale, { en: {
    title: <>QUANT FINANCE,<br /><em>VISUALLY EXPLAINED.</em></>, sub: <>Models. Markets. Mathematics.<br />No PowerPoint.</>, lab: "Enter the lab", learn: "Start learning", labs: "interactive labs", notes: "concept notes", demo: "live-data pretences", graph: "KNOWLEDGE GRAPH", choose: "CHOOSE YOUR MARKET.", graphCopy: "Start with intuition. Reveal the mathematics when ready. Finish with the view from the desk.", touch: <>DON’T READ<br />THE MODEL.<br /><em>TOUCH IT.</em></>, touchCopy: "Deform a synthetic volatility surface. Rotate it. Slice it. Then ask what the skew is pricing.", openSurface: "Open volatility explorer", desk: "FROM THE DESK", deskTitle: <>NOTES WITH<br /><em>CONSEQUENCES.</em></>, readAll: "Read all desk notes", frontier: "THE EDGE, WITHOUT THE HYPE.", frontierCopy: "Separate desk-standard tools from active research. See what is promising, production-ready, or still experimental.", ask: "WHY DOES GAMMA EXPLODE NEAR MATURITY?", askCopy: "Ask for intuition. Go deeper. Show the mathematics. Switch to desk view.", askCta: "Ask the quant",
  }, es: {
    title: <>FINANZAS QUANT,<br /><em>EXPLICADAS VISUALMENTE.</em></>, sub: <>Modelos. Mercados. Matemáticas.<br />Sin PowerPoint.</>, lab: "Entrar al laboratorio", learn: "Empezar a aprender", labs: "laboratorios interactivos", notes: "notas de conceptos", demo: "pretensiones de datos en vivo", graph: "GRAFO DE CONOCIMIENTO", choose: "ELIGE TU MERCADO.", graphCopy: "Empieza por la intuición. Revela las matemáticas cuando estés listo. Termina con la vista de mesa.", touch: <>NO LEAS<br />EL MODELO.<br /><em>TÓCALO.</em></>, touchCopy: "Deforma una superficie de volatilidad sintética. Rótala. Córtala. Pregunta qué valora el skew.", openSurface: "Abrir explorador de volatilidad", desk: "DESDE LA MESA", deskTitle: <>NOTAS CON<br /><em>CONSECUENCIAS.</em></>, readAll: "Leer todas las notas", frontier: "LA FRONTERA, SIN HUMO.", frontierCopy: "Separa herramientas estándar de investigación activa. Distingue lo prometedor, lo productivo y lo experimental.", ask: "¿POR QUÉ EXPLOTA GAMMA CERCA DEL VENCIMIENTO?", askCopy: "Pide intuición. Profundiza. Muestra las matemáticas. Cambia a vista de mesa.", askCta: "Preguntar al quant",
  }});
  const cards = locale === "en" ? assetCards : [
    { ...assetCards[0], label: "Divisas", meta: "Spot · Forwards · Sonrisa", note: "Dos curvas. A un error de convención del desastre." },
    { ...assetCards[1], label: "Renta variable", meta: "Opciones · Griegas · Volatilidad", note: "El modelo es simple. La superficie tiene otros planes." },
    { ...assetCards[2], label: "Tipos de interés", meta: "Curvas · Swaps · Bootstrap", note: "Cada tenor recuerda lo que le hiciste." },
    { ...assetCards[3], label: "Materias primas", meta: "Carry · Curvas · Opciones", note: "El almacenamiento es un parámetro con almacén." },
  ];
  const deskCards = locale === "en" ? desk : [
    { tag: "DEBATE DE MODELO", title: "¿Es realmente útil la volatilidad local?", copy: "Una respuesta precisa a una pregunta que merece algo mejor que «ajusta la sonrisa»." },
    { tag: "NOTA DE MERCADO", title: "Sticky delta frente a sticky strike", copy: "Qué suponemos cuando spot se mueve y la superficie debe decidir cómo seguirlo." },
    { tag: "IDEA QUANT", title: "La calibración no es tu modelo", copy: "El optimizador encontró parámetros. No certificó tus supuestos." },
  ];
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-copy">
          <span className="eyebrow">THEQUANTBATEMAN · EST. 2026</span>
          <h1>{copy.title}</h1>
          <p className="hero-sub">{copy.sub}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/lab">{copy.lab} <span>↗</span></a>
            <Link className="button button-secondary" href="/learn">{copy.learn} <span>→</span></Link>
          </div>
          <div className="hero-proof">
            <div><strong>04</strong><span>{copy.labs}</span></div>
            <div><strong>100+</strong><span>{copy.notes}</span></div>
            <div><strong>00</strong><span>{copy.demo}</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="market-tape"><span>SPX 6,389.45</span><span>EURUSD 1.1642</span><span>EUR 10Y 2.71%</span></div>
          <div className="avatar-stage">
            <span className="avatar-kicker">ORIGINAL FICTIONAL CHARACTER · EDITORIAL SYSTEM 02</span>
            <Avatar state="idle" />
            <blockquote>{pick(locale, { en: <>“Your option isn’t cheap.<br />Your volatility assumption is.”</>, es: <>«Tu opción no es cara.<br />Tu supuesto de volatilidad sí».</> })}</blockquote>
          </div>
          <div className="hero-formula">∂V/∂t + ½σ²S²∂²V/∂S² + (r−q)S∂V/∂S − rV = 0</div>
        </div>
      </section>

      <section className="asset-section section-shell">
        <div className="section-heading"><div><span className="eyebrow">{copy.graph}</span><h2>{copy.choose}</h2></div><p>{copy.graphCopy}</p></div>
        <div className="asset-grid">
          {cards.map((asset, index) => (
            <a className="asset-card" href={asset.href} key={asset.code}>
              <span className="card-index">0{index + 1}</span>
              <div className={`asset-monogram monogram-${asset.code.toLowerCase()}`}>{asset.code}</div>
              <h3>{asset.label}</h3><span>{asset.meta}</span><p>{asset.note}</p><b>{locale === "es" ? "Explorar" : "Explore"} {asset.code} <i>→</i></b>
            </a>
          ))}
        </div>
      </section>

      <section className="lab-feature">
        <div className="section-shell lab-feature-grid">
          <div>
            <span className="eyebrow light">QUANT LAB · EXPERIMENT 03</span>
            <h2>{copy.touch}</h2>
            <p>{copy.touchCopy}</p>
            <a className="button button-light" href="/lab?lab=surface">{copy.openSurface} <span>↗</span></a>
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
        <div className="section-heading"><div><span className="eyebrow">{copy.desk}</span><h2>{copy.deskTitle}</h2></div><a className="text-link" href="/desk">{copy.readAll} →</a></div>
        <div className="editorial-grid">
          {deskCards.map((article, index) => (
            <article className={`editorial-card editorial-${index + 1}`} key={article.title}>
              <span className="eyebrow">{article.tag} · 0{index + 1}</span><h3>{article.title}</h3><p>{article.copy}</p><a href="/desk">{locale === "es" ? "Leer nota" : "Read note"} <span>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="frontier-section section-shell">
        <div className="frontier-intro"><span className="eyebrow">QUANT FRONTIER</span><h2>{copy.frontier}</h2><p>{copy.frontierCopy}</p></div>
        <div className="frontier-list">
          {(locale === "en" ? [
            ["01", "Rough Volatility", "ACTIVE RESEARCH", "Short-scale structure and the remarkably inconvenient Hurst exponent."],
            ["02", "Differentiable Pricing", "EMERGING", "Risk and calibration as first-class derivatives of the pricing program."],
            ["03", "Machine Learning Surrogates", "ACTIVE DEPLOYMENT", "Fast approximations, controlled domains, absolutely no magical thinking."],
          ] : [
            ["01", "Volatilidad rugosa", "INVESTIGACIÓN ACTIVA", "Estructura de corto plazo y el incómodo exponente de Hurst."],
            ["02", "Valoración diferenciable", "EMERGENTE", "Riesgo y calibración como derivadas del programa de valoración."],
            ["03", "Surrogates de ML", "DESPLIEGUE ACTIVO", "Aproximaciones rápidas, dominios controlados y nada de pensamiento mágico."],
          ]).map(([index, title, status, text]) => <a href="/research" key={title}><span>{index}</span><div><h3>{title}</h3><p>{text}</p></div><b>{status}</b><i>↗</i></a>)}
        </div>
      </section>

      <section className="ask-banner">
        <div className="section-shell ask-banner-grid">
          <Avatar state="amused" compact />
          <div><span className="eyebrow light">ASK THEQUANTBATEMAN</span><h2>“{copy.ask}”</h2><p>{copy.askCopy}</p></div>
          <a className="button button-light" href="/ask">{copy.askCta} <span>→</span></a>
        </div>
      </section>
    </>
  );
}
