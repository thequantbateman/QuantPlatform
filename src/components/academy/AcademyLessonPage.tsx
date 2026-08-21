"use client";

/* eslint-disable @next/next/no-html-link-for-pages */
import { useEffect, useMemo } from "react";
import type { AcademyLesson } from "@/src/content/academy/types";
import { findAcademyLessonById } from "@/src/content/academy/catalog";
import { localizeAcademyLesson, localizeAcademyLevel } from "@/src/content/academy/localization";
import { academyNarrativeForLesson, academySectionDefinitions, type AcademySectionId } from "@/src/content/academy/narrative";
import { pick, useI18n } from "@/src/i18n";
import { LessonDisclosure, LessonSection, MacroFlow, ModelComparison, OnTheDesk, PythonLab, QuantFormula, QuantVisual, SourceReferences } from "./AcademyComponents";
import { LazyVolSurfaceLab } from "./LazyVolSurfaceLab";
import { RatesConceptLab } from "./RatesConceptLab";
import { RatesCurveLab } from "./RatesCurveLab";
import { VolatilityConceptLab } from "./VolatilityConceptLab";
import { AdvancedConceptLab } from "./AdvancedConceptLab";

export function AcademyLessonPage({ lesson }: { lesson: AcademyLesson }) {
  const { locale, t } = useI18n();
  const localized = useMemo(() => localizeAcademyLesson(lesson, locale), [lesson, locale]);
  const narrativeProfile = academyNarrativeForLesson(localized);
  const sections = academySectionDefinitions(narrativeProfile, locale);
  const section = (id: AcademySectionId) => sections.find((item) => item.id === id)!;
  const related = localized.relatedLessonIds.map(findAcademyLessonById).filter((item): item is AcademyLesson => Boolean(item)).map((item) => localizeAcademyLesson(item, locale));
  const isRates = localized.domain === "rates";
  const hasSurface = localized.id === "vol-surface";
  const hasCurveWorkbench = localized.id === "rate-curve-bootstrap";
  const trackMeta = ({
    foundations: [pick(locale, { en: "Probability & measures", es: "Probabilidad y medidas" }), "foundations"],
    derivatives: [pick(locale, { en: "Derivatives foundations", es: "Fundamentos de derivados" }), "foundations"],
    volatility: [pick(locale, { en: "Volatility", es: "Volatilidad" }), "volatility"],
    rates: [pick(locale, { en: "Rates & curves", es: "Tipos y curvas" }), "rates"],
    "numerical-finance": [pick(locale, { en: "Numerical finance", es: "Finanzas numéricas" }), "numerical-finance"],
    risk: [pick(locale, { en: "Greeks, hedging & risk", es: "Griegas, cobertura y riesgo" }), localized.id.startsWith("greeks-") || localized.id === "hedging-pnl" ? "greeks-hedging" : "risk-xva"],
    xva: [pick(locale, { en: "Risk & xVA", es: "Riesgo y xVA" }), "risk-xva"],
  } as Partial<Record<AcademyLesson["domain"], [string, string]>>)[localized.domain] ?? [localized.domain, localized.domain];
  const [trackTitle, trackId] = trackMeta;
  const isAdvancedTrack = ["foundations", "derivatives", "numerical-finance", "risk", "xva"].includes(localized.domain);
  const level = localizeAcademyLevel(localized.level, locale);
  const modelComparisonCopy = [lesson.intuition.lead, lesson.marketContext.why, lesson.pricing.method, ...lesson.pricing.limitations].join(" ");
  const hasAuthoredModelComparison = /model comparison/i.test(modelComparisonCopy) && /Heston/i.test(modelComparisonCopy) && /Black.?Scholes/i.test(modelComparisonCopy);
  const formulaLabels = {
    formula: t("academy.formula"),
    definition: t("academy.definition"),
    shortDerivation: t("academy.shortDerivation"),
    fullDerivation: t("academy.fullDerivation"),
    inputs: t("academy.inputs"),
    assumptions: t("academy.assumptions"),
    openLab: t("academy.openLab"),
    numericalCheck: t("academy.numericalCheck"),
  };

  useEffect(() => {
    const alignTarget = () => {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      let disclosure = target.closest("details");
      while (disclosure) {
        disclosure.open = true;
        disclosure = disclosure.parentElement?.closest("details") ?? null;
      }
      target.scrollIntoView({ block: "start" });
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
    <nav className="academy-toc" aria-label={pick(locale, { en: "Lesson sections", es: "Secciones de la lección" })}>{sections.map((item) => <a href={`#${item.id}`} key={item.id}><span>{item.index}</span>{item.navLabel}</a>)}</nav>
    <div className="academy-lesson-layout"><aside className="academy-lesson-rail"><span>{pick(locale, { en: "PREREQUISITES", es: "PRERREQUISITOS" })}</span>{localized.prerequisites.map((item) => <p key={item}>{item}</p>)}<span>{pick(locale, { en: "TAGS", es: "ETIQUETAS" })}</span><div>{localized.tags.map((tag) => <b key={tag}>{tag}</b>)}</div><span>{pick(locale, { en: "REVIEWED", es: "REVISADO" })}</span><p>{localized.lastReviewed}</p></aside><main>
      <LessonSection index={section("intuition").index} label={section("intuition").eyebrow} title={section("intuition").title} id="intuition"><p className="academy-lead">{localized.intuition.lead}</p><div className="academy-point-grid">{localized.intuition.points.map((point, index) => <article key={point}><span>{String(index + 1).padStart(2, "0")}</span><p>{point}</p></article>)}</div></LessonSection>
      <LessonSection index={section("market").index} label={section("market").eyebrow} title={section("market").title} id="market"><p className="academy-lead">{localized.marketContext.why}</p><div className="market-context"><div><span>{pick(locale, { en: "INSTRUMENTS", es: "INSTRUMENTOS" })}</span>{localized.marketContext.instruments.map((item) => <p key={item}>{item}</p>)}</div><div><span>{pick(locale, { en: "QUOTE CONVENTION", es: "CONVENCIÓN DE COTIZACIÓN" })}</span><p>{localized.marketContext.quoteConvention}</p></div></div></LessonSection>
      <LessonSection index={section("mathematics").index} label={section("mathematics").eyebrow} title={section("mathematics").title} id="mathematics"><div className="formula-stack">{localized.mathematics.formulas.map((formula, formulaIndex) => {
        const bindsDerivation = formulaIndex === localized.derivation.formulaIndex;
        return <QuantFormula formula={formula} derivation={bindsDerivation ? localized.derivation : undefined} notation={bindsDerivation ? localized.mathematics.notation : []} limitations={bindsDerivation ? localized.pricing.limitations : []} labels={formulaLabels} anchorId={`${localized.id}-formula-${formulaIndex}`} derivationAnchorId={bindsDerivation ? "derivation" : undefined} key={`${formulaIndex}-${formula.label}`} />;
      })}</div></LessonSection>
      <LessonSection index={section("pricing").index} label={section("pricing").eyebrow} title={section("pricing").title} id="pricing"><div className="pricing-grid"><article><span>{pick(locale, { en: "METHOD", es: "MÉTODO" })}</span><p>{localized.pricing.method}</p></article><article><span>{pick(locale, { en: "CALIBRATION", es: "CALIBRACIÓN" })}</span><p>{localized.pricing.calibration}</p></article></div>{hasAuthoredModelComparison && <ModelComparison locale={locale} />}{localized.implementation.quantLib && <details className="quantlib-note"><summary>{pick(locale, { en: "Implementation with current QuantLib", es: "Implementación con QuantLib actual" })}</summary><p>{localized.implementation.quantLib}</p><small>{pick(locale, { en: "API authority: upstream QuantLib reference pinned in the source registry.", es: "Autoridad de API: referencia upstream de QuantLib fijada en el registro de fuentes." })}</small></details>}</LessonSection>
      <LessonDisclosure index={section("python").index} label={section("python").eyebrow} title={section("python").title} id="python"><div className="implementation-contract"><span>{pick(locale, { en: "ARCHITECTURE", es: "ARQUITECTURA" })}</span><ul>{localized.implementation.architecture.map((item) => <li key={item}>{item}</li>)}</ul></div><PythonLab {...localized.implementation.pythonLab} locale={locale} /></LessonDisclosure>
      <LessonSection index={section("interactive").index} label={section("interactive").eyebrow} title={hasSurface ? pick(locale, { en: "One surface, four linked views.", es: "Una superficie, cuatro vistas conectadas." }) : hasCurveWorkbench ? pick(locale, { en: "One curve, four linked diagnostics.", es: "Una curva, cuatro diagnósticos conectados." }) : section("interactive").title} id="interactive" wide>{hasSurface ? <LazyVolSurfaceLab /> : hasCurveWorkbench ? <RatesCurveLab /> : localized.id === "vol-implied" ? <QuantVisual locale={locale} title={pick(locale, { en: "Implied-volatility inversion", es: "Inversión de volatilidad implícita" })} eyebrow={pick(locale, { en: "NUMERICAL FLOW", es: "FLUJO NUMÉRICO" })} annotation={pick(locale, { en: "The deterministic quant lab solves the same bracketed inverse with residual diagnostics.", es: "El laboratorio determinista resuelve la misma inversión acotada y muestra el residuo." })} caption={pick(locale, { en: "The implementation remains shared with the platform’s typed pricing engine.", es: "La implementación se comparte con el motor de valoración tipado de la plataforma." })}><a className="academy-open-lab" href="/lab?lab=vanilla">{pick(locale, { en: "OPEN IMPLIED-VOL SOLVER", es: "ABRIR SOLVER DE VOL IMPLÍCITA" })} →</a></QuantVisual> : isAdvancedTrack ? <AdvancedConceptLab lesson={localized} /> : isRates ? <RatesConceptLab lesson={localized} /> : <VolatilityConceptLab lesson={localized} />}</LessonSection>
      <LessonSection index={section("desk").index} label={section("desk").eyebrow} title={section("desk").title} id="desk" wide><OnTheDesk section={localized.frontOffice} locale={locale} /></LessonSection>
      <LessonDisclosure index={section("macro").index} label={section("macro").eyebrow} title={section("macro").title} id="macro">{localized.macroConnections.map((connection) => <MacroFlow connection={connection} locale={locale} key={connection.title} />)}</LessonDisclosure>
      <LessonDisclosure index={section("pitfalls").index} label={section("pitfalls").eyebrow} title={section("pitfalls").title} id="pitfalls"><div className="pitfall-list">{localized.pitfalls.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div></LessonDisclosure>
      <LessonDisclosure index={section("sources").index} label={section("sources").eyebrow} title={section("sources").title} id="sources"><SourceReferences references={localized.references} locale={locale} />{related.length > 0 && <div className="academy-related"><span>{pick(locale, { en: "CONTINUE THE TRACK", es: "CONTINUAR EL ITINERARIO" })}</span>{related.map((item) => <a href={`/learn/${item.domain}/${item.slug}`} key={item.id}><b>{item.title}</b><p>{item.subtitle}</p><i>→</i></a>)}</div>}</LessonDisclosure>
    </main></div>
  </article>;
}
