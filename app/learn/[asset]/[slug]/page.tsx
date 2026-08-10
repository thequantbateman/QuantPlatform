import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/src/components/AppShell";
import { Formula } from "@/src/components/content/Formula";
import { assetPath, contentCatalog, findByTitle, findContent } from "@/src/content/catalog";

type PageProps = { params: Promise<{ asset: string; slug: string }> };

export function generateStaticParams() {
  return contentCatalog.map((entry) => ({ asset: assetPath(entry.assetClass), slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { asset, slug } = await params;
  const entry = findContent(asset, slug);
  return entry ? { title: entry.title, description: entry.description } : { title: "Concept not found" };
}

export default async function ConceptPage({ params }: PageProps) {
  const { asset, slug } = await params;
  const entry = findContent(asset, slug);
  if (!entry) return <AppShell><div className="not-found section-shell"><span className="eyebrow">404 · KNOWLEDGE GRAPH</span><h1>Concept not found.</h1><Link className="button button-primary" href="/learn">Return to Learn</Link></div></AppShell>;
  const related = entry.relatedTopics.map(findByTitle).filter(Boolean);
  return (
    <AppShell>
      <article className="concept-page section-shell">
        <header className="concept-hero">
          <div className="breadcrumb"><Link href="/learn">Learn</Link><span>/</span><a href={`/learn?asset=${entry.assetClass}`}>{entry.assetClass}</a><span>/</span><b>{entry.title}</b></div>
          <div className="concept-labels"><span className={`asset-badge badge-${entry.assetClass.toLowerCase()}`}>{entry.assetClass}</span><span className="difficulty-badge">{entry.difficulty}</span><span className="difficulty-badge">{entry.type}</span></div>
          <h1>{entry.title}</h1><p>{entry.description}</p>
          <div className="concept-meta"><span>Reviewed {entry.lastReviewed}</span><span>{entry.authors[0]}</span><span>{entry.labs.length ? `${entry.labs.length} linked labs` : "Reading note"}</span></div>
        </header>
        <div className="concept-layout">
          <aside className="concept-toc"><span>IN THIS MODEL</span>{["Intuition", "Mathematics", "Assumptions", "Market use", "Desk view", "Related"].map((section, index) => <a href={`#${section.toLowerCase().replace(" ", "-")}`} key={section}><b>0{index + 1}</b>{section}</a>)}<a className="toc-lab" href="/lab">Open linked lab ↗</a></aside>
          <div className="concept-body">
            <section id="intuition"><SectionNumber number="01" label="INTUITION" /><h2>Build the mental model first.</h2><p className="lead-copy">{entry.intuition}</p><div className="definition-box"><span>ONE-LINE DEFINITION</span><p>{entry.description}</p></div></section>
            <section id="mathematics"><SectionNumber number="02" label="MATHEMATICS" /><h2>Now make it exact.</h2><Formula latex={entry.mathematics} /><p>Notation follows the platform convention: decimal rates and volatilities, year-fraction time, and continuously compounded rates unless stated otherwise.</p></section>
            <section id="assumptions"><SectionNumber number="03" label="ASSUMPTIONS" /><h2>Every model has a price.</h2><div className="assumption-list">{entry.assumptions.map((assumption, index) => <div key={assumption}><span>{String(index + 1).padStart(2, "0")}</span><p>{assumption}</p></div>)}</div><blockquote className="bateman-quote">“An unstated convention is not a shortcut. It is a future reconciliation break.”<cite>— THEQUANTBATEMAN</cite></blockquote></section>
            <section id="market-use"><SectionNumber number="04" label="MARKET USE" /><h2>Why a quant cares.</h2><p className="lead-copy">{entry.marketUse}</p><div className="progression"><span>Intuition</span><b>→</b><span>Mathematics</span><b>→</b><span>Implementation</span><b>→</b><span>Desk risk</span></div></section>
            <section id="desk-view"><SectionNumber number="05" label="DESK VIEW" /><div className="desk-view-box"><span>FRONT OFFICE VIEW</span><h2>The hedge has opinions.</h2><p>{entry.deskView}</p><a href={`/ask?topic=${encodeURIComponent(entry.title)}`}>Ask Bateman about this model →</a></div></section>
            <section id="related"><SectionNumber number="06" label="RELATED CONCEPTS" /><h2>Continue through the graph.</h2><div className="related-grid">{related.length ? related.map((item) => item && <a key={item.slug} href={`/learn/${assetPath(item.assetClass)}/${item.slug}`}><span>{item.assetClass} · {item.difficulty}</span><strong>{item.title}</strong><p>{item.description}</p></a>) : <Link href="/learn"><span>KNOWLEDGE GRAPH</span><strong>Explore all concepts</strong><p>Choose the next dependency or market application.</p></Link>}</div></section>
          </div>
        </div>
      </article>
    </AppShell>
  );
}

function SectionNumber({ number, label }: { number: string; label: string }) {
  return <div className="section-number"><span>{number}</span><b>{label}</b></div>;
}
