"use client";

import { useMemo } from "react";
import { LearnCatalog } from "@/src/components/content/LearnCatalog";
import { contentCatalog } from "@/src/content/catalog";
import { academyLessons, academyTracks } from "@/src/content/academy/catalog";
import { localizeAcademyTrack } from "@/src/content/academy/localization";
import type { AcademyTrack } from "@/src/content/academy/types";
import { pick, useI18n } from "@/src/i18n";

function TrackSection({ track, index }: { track: AcademyTrack; index: number }) {
  const { locale } = useI18n();
  const firstNode = track.nodes[0];
  return <section className={`academy-track section-shell track-${track.id}`} id={`track-${track.id}`}>
    <header><div><span className="eyebrow">{String(index + 1).padStart(2, "0")} · {track.subtitle}</span><h2>{track.title}</h2><p>{track.description}</p></div><div className="academy-track-actions"><span>{track.nodes.length} {pick(locale, { en: "STAGES", es: "ETAPAS" })}</span><a className="academy-track-start" href={firstNode.href}>{pick(locale, { en: "START TRACK", es: "EMPEZAR ITINERARIO" })} →</a></div></header>
    <details className="academy-track-disclosure"><summary><span>{pick(locale, { en: `View all ${track.nodes.length} stages`, es: `Ver las ${track.nodes.length} etapas` })}</span></summary><div className="track-path">{track.nodes.map((node, nodeIndex) => <a href={node.href} className="deep" key={node.id}><span>{String(nodeIndex + 1).padStart(2, "0")}</span><div><small>{node.stage}</small><b>{node.title}</b></div><em>{node.level} · LAB</em><i>→</i></a>)}</div></details>
  </section>;
}

export function AcademyLanding({ initialAsset }: { initialAsset?: string }) {
  const { locale } = useI18n();
  const tracks = useMemo(() => academyTracks.map((track) => localizeAcademyTrack(track, locale)), [locale]);
  return <div className="academy-home">
    <header className="academy-hero section-shell"><div><span className="eyebrow">{pick(locale, { en: "ACADEMY · MATHEMATICS TO THE DESK", es: "ACADEMY · DE LAS MATEMÁTICAS A LA MESA" })}</span><h1>{pick(locale, { en: <>LEARN THE MODEL.<br /><em>CHALLENGE THE HEDGE.</em></>, es: <>APRENDE EL MODELO.<br /><em>CUESTIONA LA COBERTURA.</em></> })}</h1><p>{pick(locale, { en: "Choose a track, keep the essential lesson visible, and open derivations or implementation only when you need the depth.", es: "Elige un itinerario, conserva visible lo esencial y abre derivaciones o implementación solo cuando necesites profundidad." })}</p><div className="academy-hero-actions"><a className="button button-primary" href="#track-foundations">{pick(locale, { en: "START PROBABILITY & MEASURES", es: "EMPEZAR PROBABILIDAD Y MEDIDAS" })}</a><a className="button" href="#academy-catalog">{pick(locale, { en: `EXPLORE ${contentCatalog.length} CONCEPTS`, es: `EXPLORAR ${contentCatalog.length} CONCEPTOS` })}</a></div></div><aside><span>{pick(locale, { en: "ACADEMY INDEX", es: "ÍNDICE ACADEMY" })}</span><dl><div><dt>{pick(locale, { en: "Tracks", es: "Itinerarios" })}</dt><dd>{tracks.length.toString().padStart(2, "0")}</dd></div><div><dt>{pick(locale, { en: "Canonical lessons", es: "Lecciones canónicas" })}</dt><dd>{academyLessons.length.toString().padStart(2, "0")}</dd></div><div><dt>{pick(locale, { en: "Legacy concepts", es: "Conceptos históricos" })}</dt><dd>{contentCatalog.length.toString().padStart(2, "0")}</dd></div></dl><p>{pick(locale, { en: "Every canonical destination remains available below its track summary.", es: "Cada destino canónico sigue disponible bajo el resumen de su itinerario." })}</p></aside></header>
    {tracks.map((track, index) => <TrackSection track={track} index={index} key={track.id} />)}
    <div id="academy-catalog" className="academy-catalog-heading section-shell"><span className="eyebrow">{pick(locale, { en: "PRESERVED KNOWLEDGE GRAPH", es: "GRAFO DE CONOCIMIENTO CONSERVADO" })}</span><h2>{pick(locale, { en: "Explore every concept.", es: "Explora cada concepto." })}</h2><p>{pick(locale, { en: "The existing typed catalog remains intact beneath the sequenced flagship curriculum.", es: "El catálogo tipado se mantiene intacto bajo los itinerarios principales secuenciados." })}</p></div>
    <LearnCatalog initialAsset={initialAsset} showHero={false} />
  </div>;
}
