/* eslint-disable @next/next/no-html-link-for-pages */
import { LearnCatalog } from "@/src/components/content/LearnCatalog";
import { contentCatalog } from "@/src/content/catalog";
import { academyLessons, volatilityTrack } from "@/src/content/academy/catalog";

const futureTracks = [
  ["02", "Rates & curves", "Discounting → OIS → multi-curve → Hull–White → HJM", "NEXT"],
  ["03", "Numerical finance", "Monte Carlo → schemes → Fourier / COS → PDE", "QUEUED"],
  ["04", "Risk & hedging", "Greeks → P&L attribution → VaR / ES → model risk", "QUEUED"],
];

export function AcademyLanding({ initialAsset }: { initialAsset?: string }) {
  return <div className="academy-home">
    <header className="academy-hero section-shell"><div><span className="eyebrow">ACADEMY V2 · MATHEMATICS TO THE DESK</span><h1>LEARN THE MODEL.<br /><em>CHALLENGE THE HEDGE.</em></h1><p>A structured quantitative-finance curriculum linking derivation, Python, interactive state, market practice and macro transmission.</p><div className="academy-hero-actions"><a className="button button-primary" href="#track-volatility">START VOLATILITY</a><a className="button" href="#academy-catalog">EXPLORE {contentCatalog.length} CONCEPTS</a></div></div><aside><span>ACADEMY CONTRACT</span><dl><div><dt>Complete track</dt><dd>Volatility</dd></div><div><dt>Deep lessons</dt><dd>{academyLessons.length.toString().padStart(2, "0")}</dd></div><div><dt>Dynamic labs</dt><dd>{academyLessons.length.toString().padStart(2, "0")}</dd></div><div><dt>Data mode</dt><dd>Synthetic · explicit</dd></div></dl><p>Every volatility stage now shares the full derivation, implementation, scenario and desk contract.</p></aside></header>
    <section className="academy-track section-shell" id="track-volatility"><header><div><span className="eyebrow">01 · COMPLETE FLAGSHIP TRACK</span><h2>{volatilityTrack.title}</h2><p>{volatilityTrack.description}</p></div><div><b>{volatilityTrack.nodes.length}</b><span>DEEP · DYNAMIC STAGES</span></div></header><div className="track-path">{volatilityTrack.nodes.map((node, index) => <a href={node.href} className="deep" key={node.id}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{node.stage}</small><b>{node.title}</b></div><em>{node.level} · LAB</em><i>→</i></a>)}</div><footer><div><span>CONTRACT</span><p><i /> Derivation · Python · scenarios · desk</p></div><a href="/learn/volatility/volatility-surface#interactive">OPEN FLAGSHIP SURFACE LAB →</a></footer></section>
    <section className="academy-roadmap section-shell"><header><span className="eyebrow">SEQUENTIAL DEPTH</span><h2>One production-grade track at a time.</h2></header><div>{futureTracks.map(([index, title, copy, status]) => <article key={title}><span>{index}</span><b>{status}</b><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <div id="academy-catalog" className="academy-catalog-heading section-shell"><span className="eyebrow">PRESERVED KNOWLEDGE GRAPH</span><h2>Explore every concept.</h2><p>The existing typed catalog remains intact and now sits beneath the sequenced flagship curriculum.</p></div>
    <LearnCatalog initialAsset={initialAsset} showHero={false} />
  </div>;
}
