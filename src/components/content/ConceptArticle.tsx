"use client";
/* eslint-disable @next/next/no-html-link-for-pages */
import { Formula } from "./Formula";
import { assetPath } from "@/src/content/catalog";
import { localizeEntry } from "@/src/content/localization";
import { legacyNarrativeForEntry } from "@/src/content/narrative";
import type { ContentEntry } from "@/src/content/types";
import { pick, useI18n } from "@/src/i18n";

export function ConceptArticle({ source, relatedSources }: { source: ContentEntry; relatedSources: ContentEntry[] }) {
  const { locale } = useI18n(); const entry = localizeEntry(source, locale); const related = relatedSources.map((item) => localizeEntry(item, locale));
  const narrative = legacyNarrativeForEntry(entry, locale); const sections = narrative.sections;
  return <article className="concept-page section-shell" data-narrative-profile={narrative.profile}>
    <header className="concept-hero"><div className="breadcrumb"><a href="/learn">{pick(locale, { en: "Learn", es: "Aprender" })}</a><span>/</span><a href={`/learn?asset=${entry.assetClass}`}>{entry.assetClass}</a><span>/</span><b>{entry.title}</b></div><div className="concept-labels"><span className={`asset-badge badge-${entry.assetClass.toLowerCase()}`}>{entry.assetClass}</span><span className="difficulty-badge">{entry.difficulty}</span><span className="difficulty-badge">{entry.type}</span></div><h1>{entry.title}</h1><p>{entry.description}</p><div className="concept-meta"><span>{pick(locale, { en: "Reviewed", es: "Revisado" })} {entry.lastReviewed}</span><span>{entry.authors[0]}</span><span>{entry.labs.length ? `${entry.labs.length} ${pick(locale, { en: "linked labs", es: "laboratorios vinculados" })}` : pick(locale, { en: "Reading note", es: "Nota de lectura" })}</span></div></header>
    <nav className="concept-bridge" aria-label={pick(locale, { en: "Apply this concept", es: "Aplicar este concepto" })}><a href="/analytics">{pick(locale, { en: "OPEN ANALYTICS", es: "ABRIR ANALÍTICA" })} →</a><a href="/markets">{pick(locale, { en: "APPLY TO A MARKET", es: "APLICAR A UN MERCADO" })} →</a><a href={`/ask?topic=${encodeURIComponent(entry.title)}`}>{pick(locale, { en: "ASK WITH CONTEXT", es: "PREGUNTAR CON CONTEXTO" })} →</a></nav>
    <div className="concept-layout"><aside className="concept-toc"><span>{narrative.tocLabel}</span>{sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.id}><b>0{index + 1}</b>{section.label}</a>)}<a className="toc-lab" href="/lab">{pick(locale, { en: "Open linked lab", es: "Abrir laboratorio" })} ↗</a></aside>
      <div className="concept-body">
        <section id="section-1"><Number n="01" label={sections[0].label} /><h2>{sections[0].title}</h2><p className="lead-copy">{entry.intuition}</p><div className="definition-box"><span>{pick(locale, { en: "ONE-LINE DEFINITION", es: "DEFINICIÓN EN UNA LÍNEA" })}</span><p>{entry.description}</p></div></section>
        <section id="section-2"><Number n="02" label={sections[1].label} /><h2>{sections[1].title}</h2><Formula latex={entry.mathematics} /><details className="equation-details"><summary>{pick(locale, { en: "Notation and units", es: "Notación y unidades" })}</summary><p>{pick(locale, { en: "Decimal rates and volatilities, year-fraction time and continuous compounding unless stated otherwise.", es: "Tipos y volatilidades decimales, tiempo en fracciones de año y capitalización continua salvo indicación contraria." })}</p></details></section>
        <section id="section-3"><Number n="03" label={sections[2].label} /><h2>{sections[2].title}</h2><div className="assumption-list">{entry.assumptions.map((assumption, index) => <div key={assumption}><span>{String(index + 1).padStart(2, "0")}</span><p>{assumption}</p></div>)}</div><blockquote className="bateman-quote">{pick(locale, { en: "“An unstated convention is a future reconciliation break.”", es: "«Una convención no declarada es una futura ruptura de conciliación»." })}<cite>— THEQUANTBATEMAN</cite></blockquote></section>
        <section id="section-4"><Number n="04" label={sections[3].label} /><h2>{sections[3].title}</h2><p className="lead-copy">{entry.marketUse}</p><div className="progression"><span>{sections[0].label}</span><b>→</b><span>{sections[1].label}</span><b>→</b><span>{pick(locale, { en: "Implementation", es: "Implementación" })}</span><b>→</b><span>{pick(locale, { en: "Desk risk", es: "Riesgo de mesa" })}</span></div></section>
        <section id="section-5"><Number n="05" label={sections[4].label} /><div className="desk-view-box"><span>{pick(locale, { en: "FRONT OFFICE VIEW", es: "VISTA FRONT OFFICE" })}</span><h2>{sections[4].title}</h2><p>{entry.deskView}</p><a href={`/ask?topic=${encodeURIComponent(entry.title)}`}>{pick(locale, { en: "Ask Bateman about this topic", es: "Pregunta a Bateman sobre este tema" })} →</a></div></section>
        <section id="section-6"><Number n="06" label={sections[5].label} /><h2>{sections[5].title}</h2><div className="related-grid">{related.length ? related.map((item) => <a key={item.slug} href={`/learn/${assetPath(item.assetClass)}/${item.slug}`}><span>{item.assetClass} · {item.difficulty}</span><strong>{item.title}</strong><p>{item.description}</p></a>) : <a href="/learn"><span>{pick(locale, { en: "KNOWLEDGE GRAPH", es: "GRAFO DE CONOCIMIENTO" })}</span><strong>{pick(locale, { en: "Explore all concepts", es: "Explora todos los conceptos" })}</strong></a>}</div></section>
      </div>
    </div>
  </article>;
}

function Number({ n, label }: { n: string; label: string }) { return <div className="section-number"><span>{n}</span><b>{label}</b></div>; }
