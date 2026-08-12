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
  const flagshipNode = track.nodes[Math.min(track.nodes.length - 1, Math.floor(track.nodes.length / 2))];
  return <section className={`academy-track section-shell track-${track.id}`} id={`track-${track.id}`}>
    <header><div><span className="eyebrow">{String(index + 1).padStart(2, "0")} · {pick(locale, { en: "COMPLETE FLAGSHIP TRACK", es: "ITINERARIO PRINCIPAL COMPLETO" })}</span><h2>{track.title}</h2><p>{track.description}</p></div><div><b>{track.nodes.length}</b><span>{pick(locale, { en: "DEEP · DYNAMIC STAGES", es: "ETAPAS PROFUNDAS · DINÁMICAS" })}</span></div></header>
    <div className="track-path">{track.nodes.map((node, nodeIndex) => <a href={node.href} className="deep" key={node.id}><span>{String(nodeIndex + 1).padStart(2, "0")}</span><div><small>{node.stage}</small><b>{node.title}</b></div><em>{node.level} · LAB</em><i>→</i></a>)}</div>
    <footer><div><span>{pick(locale, { en: "CONTRACT", es: "CONTRATO" })}</span><p><i /> {pick(locale, { en: "Derivation · Python · scenarios · desk", es: "Derivación · Python · escenarios · mesa" })}</p></div><a href={`${flagshipNode.href}#interactive`}>{pick(locale, { en: "OPEN FLAGSHIP INTERACTIVE LAB", es: "ABRIR LABORATORIO PRINCIPAL" })} →</a></footer>
  </section>;
}

export function AcademyLanding({ initialAsset }: { initialAsset?: string }) {
  const { locale } = useI18n();
  const tracks = useMemo(() => academyTracks.map((track) => localizeAcademyTrack(track, locale)), [locale]);
  return <div className="academy-home">
    <header className="academy-hero section-shell"><div><span className="eyebrow">{pick(locale, { en: "ACADEMY V2 · MATHEMATICS TO THE DESK", es: "ACADEMY V2 · DE LAS MATEMÁTICAS A LA MESA" })}</span><h1>{pick(locale, { en: <>LEARN THE MODEL.<br /><em>CHALLENGE THE HEDGE.</em></>, es: <>APRENDE EL MODELO.<br /><em>CUESTIONA LA COBERTURA.</em></> })}</h1><p>{pick(locale, { en: "A structured quantitative-finance curriculum linking derivation, Python, interactive state, market practice and macro transmission.", es: "Un itinerario estructurado que conecta derivación, Python, estado interactivo, práctica de mercado y transmisión macro." })}</p><div className="academy-hero-actions"><a className="button button-primary" href="#track-foundations">{pick(locale, { en: "START PROBABILITY & MEASURES", es: "EMPEZAR PROBABILIDAD Y MEDIDAS" })}</a><a className="button" href="#academy-catalog">{pick(locale, { en: `EXPLORE ${contentCatalog.length} CONCEPTS`, es: `EXPLORAR ${contentCatalog.length} CONCEPTOS` })}</a></div></div><aside><span>{pick(locale, { en: "ACADEMY CONTRACT", es: "CONTRATO ACADEMY" })}</span><dl><div><dt>{pick(locale, { en: "Complete tracks", es: "Itinerarios completos" })}</dt><dd>{tracks.length.toString().padStart(2, "0")}</dd></div><div><dt>{pick(locale, { en: "Deep lessons", es: "Lecciones profundas" })}</dt><dd>{academyLessons.length.toString().padStart(2, "0")}</dd></div><div><dt>{pick(locale, { en: "Dynamic labs", es: "Laboratorios dinámicos" })}</dt><dd>{academyLessons.length.toString().padStart(2, "0")}</dd></div><div><dt>{pick(locale, { en: "Data mode", es: "Modo de datos" })}</dt><dd>{pick(locale, { en: "Synthetic · explicit", es: "Sintético · explícito" })}</dd></div></dl><p>{pick(locale, { en: "Every stage shares the derivation, implementation, scenario and desk contract.", es: "Cada etapa comparte derivación, implementación, escenarios y contrato de mesa." })}</p></aside></header>
    {tracks.map((track, index) => <TrackSection track={track} index={index} key={track.id} />)}
    <section className="academy-roadmap section-shell"><header><span className="eyebrow">{pick(locale, { en: "CONNECTED CURRICULUM", es: "CURRÍCULO CONECTADO" })}</span><h2>{pick(locale, { en: "Theory, numerics and risk now form one path.", es: "Teoría, cálculo y riesgo forman ahora un único camino." })}</h2></header><div>{tracks.slice(-3).map((track, index) => <article key={track.id}><span>{String(index + 1).padStart(2, "0")}</span><b>{pick(locale, { en: "LIVE", es: "ACTIVO" })}</b><h3>{track.title}</h3><p>{track.subtitle}</p></article>)}</div></section>
    <div id="academy-catalog" className="academy-catalog-heading section-shell"><span className="eyebrow">{pick(locale, { en: "PRESERVED KNOWLEDGE GRAPH", es: "GRAFO DE CONOCIMIENTO CONSERVADO" })}</span><h2>{pick(locale, { en: "Explore every concept.", es: "Explora cada concepto." })}</h2><p>{pick(locale, { en: "The existing typed catalog remains intact beneath the sequenced flagship curriculum.", es: "El catálogo tipado se mantiene intacto bajo los itinerarios principales secuenciados." })}</p></div>
    <LearnCatalog initialAsset={initialAsset} showHero={false} />
  </div>;
}
