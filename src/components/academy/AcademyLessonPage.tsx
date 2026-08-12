"use client";

/* eslint-disable @next/next/no-html-link-for-pages */
import { useEffect, useMemo } from "react";
import type { AcademyLesson } from "@/src/content/academy/types";
import { findAcademyLessonById } from "@/src/content/academy/catalog";
import { localizeAcademyLesson } from "@/src/content/academy/localization";
import { pick, useI18n } from "@/src/i18n";
import { DerivationSteps, LessonSection, MacroFlow, ModelComparison, OnTheDesk, PythonLab, QuantVisual, SourceReferences } from "./AcademyComponents";
import { LazyVolSurfaceLab } from "./LazyVolSurfaceLab";
import { RatesConceptLab } from "./RatesConceptLab";
import { RatesCurveLab } from "./RatesCurveLab";
import { VolatilityConceptLab } from "./VolatilityConceptLab";
import { AdvancedConceptLab } from "./AdvancedConceptLab";

const sections = [
  ["01", "Intuition", "intuition"], ["02", "Why markets care", "market"], ["03", "Mathematics", "mathematics"], ["04", "Derivation", "derivation"],
  ["05", "Model / pricing", "pricing"], ["06", "Python lab", "python"], ["07", "Interactive lab", "interactive"], ["08", "On the desk", "desk"],
  ["09", "Macro connection", "macro"], ["10", "Pitfalls", "pitfalls"], ["11", "Sources", "sources"],
] as const;

export function AcademyLessonPage({ lesson }: { lesson: AcademyLesson }) {
  const { locale } = useI18n();
  const localized = useMemo(() => localizeAcademyLesson(lesson, locale), [lesson, locale]);
  const related = localized.relatedLessonIds.map(findAcademyLessonById).filter((item): item is AcademyLesson => Boolean(item)).map((item) => localizeAcademyLesson(item, locale));
  const isRates = localized.domain === "rates";
  const hasSurface = localized.id === "vol-surface";
  const hasCurveWorkbench = localized.id === "rate-curve-bootstrap";
  const trackMeta = ({
    foundations: [pick(locale, { en: "Probability & measures", es: "Probabilidad y medidas" }), "foundations"],
    volatility: [pick(locale, { en: "Volatility", es: "Volatilidad" }), "volatility"],
    rates: [pick(locale, { en: "Rates & curves", es: "Tipos y curvas" }), "rates"],
    "numerical-finance": [pick(locale, { en: "Numerical finance", es: "Finanzas numéricas" }), "numerical-finance"],
    risk: [pick(locale, { en: "Greeks, hedging & risk", es: "Griegas, cobertura y riesgo" }), localized.id.startsWith("greeks-") || localized.id === "hedging-pnl" ? "greeks-hedging" : "risk-xva"],
    xva: [pick(locale, { en: "Risk & xVA", es: "Riesgo y xVA" }), "risk-xva"],
  } as Partial<Record<AcademyLesson["domain"], [string, string]>>)[localized.domain] ?? [localized.domain, localized.domain];
  const [trackTitle, trackId] = trackMeta;
  const isAdvancedTrack = ["foundations", "numerical-finance", "risk", "xva"].includes(localized.domain);
  const level = pick(locale, { en: localized.level, es: ({ foundation: "fundamentos", intermediate: "intermedio", advanced: "avanzado", "front-office": "front-office" } as Record<AcademyLesson["level"], string>)[localized.level] });

  useEffect(() => {
    const alignTarget = () => {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      if (targetId) document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    };
    const frame = window.requestAnimationFrame(alignTarget);
    const timer = window.setTimeout(alignTarget, 400);
    window.addEventListener("hashchange", alignTarget);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", alignTarget);
    };
  }, []);

  return <article className="academy-lesson section-shell">
    <header className="academy-lesson-hero">
      <div className="breadcrumb"><a href="/learn">Academy</a><span>/</span><a href={`/learn#track-${trackId}`}>{trackTitle}</a><span>/</span><b>{localized.title}</b></div>
      <div className="academy-lesson-grid"><div><span className="eyebrow">{trackTitle} · {level}</span><h1>{localized.title}</h1><p>{localized.subtitle}</p></div><aside><span>{pick(locale, { en: "LEARNING CONTRACT", es: "CONTRATO DE APRENDIZAJE" })}</span><b>{localized.estimatedMinutes} min</b><p>{localized.learningObjectives.length} {pick(locale, { en: "objectives", es: "objetivos" })} · {localized.prerequisites.length} {pick(locale, { en: "prerequisites", es: "prerrequisitos" })}</p><a href={`/ask?topic=${encodeURIComponent(localized.title)}&lessonId=${localized.id}&section=overview`}>{pick(locale, { en: "Ask Quant Bateman about this", es: "Pregunta a Quant Bateman sobre esto" })} →</a></aside></div>
      <div className="academy-objectives"><span>{pick(locale, { en: "BY THE END, YOU CAN", es: "AL FINAL PODRÁS" })}</span>{localized.learningObjectives.map((objective, index) => <p key={objective}><b>{String(index + 1).padStart(2, "0")}</b>{objective}</p>)}</div>
    </header>
    <nav className="academy-toc" aria-label={pick(locale, { en: "Lesson sections", es: "Secciones de la lección" })}>{sections.map(([index, label, id]) => <a href={`#${id}`} key={id}><span>{index}</span>{locale === "es" ? ({ Intuition: "Intuición", "Why markets care": "Por qué importa", Mathematics: "Matemáticas", Derivation: "Derivación", "Model / pricing": "Modelo / valoración", "Python lab": "Laboratorio Python", "Interactive lab": "Laboratorio interactivo", "On the desk": "En la mesa", "Macro connection": "Conexión macro", Pitfalls: "Errores", Sources: "Fuentes" } as Record<string, string>)[label] : label}</a>)}</nav>
    <div className="academy-lesson-layout"><aside className="academy-lesson-rail"><span>{pick(locale, { en: "PREREQUISITES", es: "PRERREQUISITOS" })}</span>{localized.prerequisites.map((item) => <p key={item}>{item}</p>)}<span>TAGS</span><div>{localized.tags.map((tag) => <b key={tag}>{tag}</b>)}</div><span>{pick(locale, { en: "REVIEWED", es: "REVISADO" })}</span><p>{localized.lastReviewed}</p></aside><main>
      <LessonSection index="01" label={pick(locale, { en: "INTUITION", es: "INTUICIÓN" })} title={pick(locale, { en: "Build the state before the equation.", es: "Construye el estado antes de la ecuación." })} id="intuition"><p className="academy-lead">{localized.intuition.lead}</p><div className="academy-point-grid">{localized.intuition.points.map((point, index) => <article key={point}><span>{String(index + 1).padStart(2, "0")}</span><p>{point}</p></article>)}</div></LessonSection>
      <LessonSection index="02" label={pick(locale, { en: "WHY MARKETS CARE", es: "POR QUÉ IMPORTA" })} title={pick(locale, { en: "The product exists before the model.", es: "El producto existe antes que el modelo." })} id="market"><p className="academy-lead">{localized.marketContext.why}</p><div className="market-context"><div><span>{pick(locale, { en: "INSTRUMENTS", es: "INSTRUMENTOS" })}</span>{localized.marketContext.instruments.map((item) => <p key={item}>{item}</p>)}</div><div><span>{pick(locale, { en: "QUOTE CONVENTION", es: "CONVENCIÓN DE COTIZACIÓN" })}</span><p>{localized.marketContext.quoteConvention}</p></div></div></LessonSection>
      <LessonSection index="03" label={pick(locale, { en: "MATHEMATICS", es: "MATEMÁTICAS" })} title={pick(locale, { en: "Notation, units and exact claims.", es: "Notación, unidades y afirmaciones exactas." })} id="mathematics"><div className="notation-grid">{localized.mathematics.notation.map((item) => <code key={item}>{item}</code>)}</div><div className="formula-stack">{localized.mathematics.formulas.map((formula) => <QuantVisual title={formula.label} eyebrow="QUANT NOTE" equation={formula.latex} annotation={formula.interpretation} caption={pick(locale, { en: "Read the equation together with its financial domain and convention.", es: "Lee la ecuación junto con su dominio financiero y su convención." })} key={formula.label} />)}</div></LessonSection>
      <LessonSection index="04" label={pick(locale, { en: "DERIVATION", es: "DERIVACIÓN" })} title={pick(locale, { en: "Do not jump to the final expression.", es: "No saltes directamente a la expresión final." })} id="derivation"><DerivationSteps {...localized.derivation} /></LessonSection>
      <LessonSection index="05" label={pick(locale, { en: "MODEL / PRICING", es: "MODELO / VALORACIÓN" })} title={pick(locale, { en: "Fit, compute, then challenge the assumptions.", es: "Ajusta, calcula y después cuestiona los supuestos." })} id="pricing"><div className="pricing-grid"><article><span>{pick(locale, { en: "METHOD", es: "MÉTODO" })}</span><p>{localized.pricing.method}</p></article><article><span>{pick(locale, { en: "CALIBRATION", es: "CALIBRACIÓN" })}</span><p>{localized.pricing.calibration}</p></article></div><div className="academy-limitations"><span>{pick(locale, { en: "LIMITATIONS", es: "LIMITACIONES" })}</span>{localized.pricing.limitations.map((item) => <p key={item}>{item}</p>)}</div>{localized.domain === "volatility" && localized.id !== "vol-implied" && <ModelComparison />}{localized.implementation.quantLib && <details className="quantlib-note"><summary>{pick(locale, { en: "Implementation with current QuantLib", es: "Implementación con QuantLib actual" })}</summary><p>{localized.implementation.quantLib}</p><small>{pick(locale, { en: "API authority: upstream QuantLib reference pinned in the source registry.", es: "Autoridad de API: referencia upstream de QuantLib fijada en el registro de fuentes." })}</small></details>}</LessonSection>
      <LessonSection index="06" label={pick(locale, { en: "PYTHON LAB", es: "LABORATORIO PYTHON" })} title={pick(locale, { en: "Theory → implementation → checks.", es: "Teoría → implementación → comprobaciones." })} id="python"><PythonLab {...localized.implementation.pythonLab} /></LessonSection>
      <LessonSection index="07" label={pick(locale, { en: "INTERACTIVE LAB", es: "LABORATORIO INTERACTIVO" })} title={hasSurface ? pick(locale, { en: "One surface, four linked views.", es: "Una superficie, cuatro vistas conectadas." }) : hasCurveWorkbench ? pick(locale, { en: "One curve, four linked diagnostics.", es: "Una curva, cuatro diagnósticos conectados." }) : pick(locale, { en: "Move the state. Challenge the equation.", es: "Mueve el estado y cuestiona la ecuación." })} id="interactive">{hasSurface ? <LazyVolSurfaceLab /> : hasCurveWorkbench ? <RatesCurveLab /> : localized.id === "vol-implied" ? <QuantVisual title={pick(locale, { en: "Implied-volatility inversion", es: "Inversión de volatilidad implícita" })} eyebrow={pick(locale, { en: "NUMERICAL FLOW", es: "FLUJO NUMÉRICO" })} annotation={pick(locale, { en: "The deterministic quant lab solves the same bracketed inverse with residual diagnostics.", es: "El laboratorio determinista resuelve la misma inversión acotada y muestra el residuo." })} caption={pick(locale, { en: "The implementation remains shared with the platform’s typed pricing engine.", es: "La implementación se comparte con el motor de valoración tipado de la plataforma." })}><a className="academy-open-lab" href="/lab?lab=vanilla">{pick(locale, { en: "OPEN IMPLIED-VOL SOLVER", es: "ABRIR SOLVER DE VOL IMPLÍCITA" })} →</a></QuantVisual> : isAdvancedTrack ? <AdvancedConceptLab lesson={localized} /> : isRates ? <RatesConceptLab lesson={localized} /> : <VolatilityConceptLab lesson={localized} />}</LessonSection>
      <LessonSection index="08" label="FRONT OFFICE" title={pick(locale, { en: "Where the model meets the book.", es: "Donde el modelo se encuentra con el libro." })} id="desk"><OnTheDesk section={localized.frontOffice} /></LessonSection>
      <LessonSection index="09" label={pick(locale, { en: "MACRO CONNECTION", es: "CONEXIÓN MACRO" })} title={pick(locale, { en: "Map the transmission channel.", es: "Mapea el canal de transmisión." })} id="macro">{localized.macroConnections.map((connection) => <MacroFlow connection={connection} key={connection.title} />)}</LessonSection>
      <LessonSection index="10" label={pick(locale, { en: "COMMON PITFALLS", es: "ERRORES FRECUENTES" })} title={pick(locale, { en: "Most failures begin outside the formula.", es: "La mayoría de los fallos empiezan fuera de la fórmula." })} id="pitfalls"><div className="pitfall-list">{localized.pitfalls.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div></LessonSection>
      <LessonSection index="11" label={pick(locale, { en: "SOURCES / FURTHER READING", es: "FUENTES / LECTURAS" })} title={pick(locale, { en: "Attribution with implementation authority.", es: "Atribución con autoridad de implementación." })} id="sources"><SourceReferences references={localized.references} />{related.length > 0 && <div className="academy-related"><span>{pick(locale, { en: "CONTINUE THE TRACK", es: "CONTINUAR EL ITINERARIO" })}</span>{related.map((item) => <a href={`/learn/${item.domain}/${item.slug}`} key={item.id}><b>{item.title}</b><p>{item.subtitle}</p><i>→</i></a>)}</div>}</LessonSection>
    </main></div>
  </article>;
}
