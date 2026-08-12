/* eslint-disable @next/next/no-html-link-for-pages */
import type { AcademyLesson } from "@/src/content/academy/types";
import { findAcademyLessonById } from "@/src/content/academy/catalog";
import { DerivationSteps, LessonSection, MacroFlow, ModelComparison, OnTheDesk, PythonLab, QuantVisual, SourceReferences } from "./AcademyComponents";
import { LazyVolSurfaceLab } from "./LazyVolSurfaceLab";

const sections = [
  ["01", "Intuition", "intuition"], ["02", "Why markets care", "market"], ["03", "Mathematics", "mathematics"], ["04", "Derivation", "derivation"],
  ["05", "Model / pricing", "pricing"], ["06", "Python lab", "python"], ["07", "Interactive lab", "interactive"], ["08", "On the desk", "desk"],
  ["09", "Macro connection", "macro"], ["10", "Pitfalls", "pitfalls"], ["11", "Sources", "sources"],
] as const;

export function AcademyLessonPage({ lesson }: { lesson: AcademyLesson }) {
  const related = lesson.relatedLessonIds.map(findAcademyLessonById).filter((item): item is AcademyLesson => Boolean(item));
  const hasSurface = lesson.interactiveLabs.some((lab) => lab.id === "vol-surface");
  return <article className="academy-lesson section-shell">
    <header className="academy-lesson-hero">
      <div className="breadcrumb"><a href="/learn">Academy</a><span>/</span><a href="/learn#track-volatility">Volatility</a><span>/</span><b>{lesson.title}</b></div>
      <div className="academy-lesson-grid"><div><span className="eyebrow">{lesson.domain} · {lesson.level}</span><h1>{lesson.title}</h1><p>{lesson.subtitle}</p></div><aside><span>LEARNING CONTRACT</span><b>{lesson.estimatedMinutes} min</b><p>{lesson.learningObjectives.length} objectives · {lesson.prerequisites.length} prerequisites</p><a href={`/ask?topic=${encodeURIComponent(lesson.title)}&lessonId=${lesson.id}&section=overview`}>Ask Quant Bateman about this →</a></aside></div>
      <div className="academy-objectives"><span>BY THE END, YOU CAN</span>{lesson.learningObjectives.map((objective, index) => <p key={objective}><b>{String(index + 1).padStart(2, "0")}</b>{objective}</p>)}</div>
    </header>
    <nav className="academy-toc" aria-label="Lesson sections">{sections.map(([index, label, id]) => <a href={`#${id}`} key={id}><span>{index}</span>{label}</a>)}</nav>
    <div className="academy-lesson-layout"><aside className="academy-lesson-rail"><span>PREREQUISITES</span>{lesson.prerequisites.map((item) => <p key={item}>{item}</p>)}<span>TAGS</span><div>{lesson.tags.map((tag) => <b key={tag}>{tag}</b>)}</div><span>REVIEWED</span><p>{lesson.lastReviewed}</p></aside><main>
      <LessonSection index="01" label="INTUITION" title="Build the state before the equation." id="intuition"><p className="academy-lead">{lesson.intuition.lead}</p><div className="academy-point-grid">{lesson.intuition.points.map((point, index) => <article key={point}><span>{String(index + 1).padStart(2, "0")}</span><p>{point}</p></article>)}</div></LessonSection>
      <LessonSection index="02" label="WHY MARKETS CARE" title="The product exists before the model." id="market"><p className="academy-lead">{lesson.marketContext.why}</p><div className="market-context"><div><span>INSTRUMENTS</span>{lesson.marketContext.instruments.map((item) => <p key={item}>{item}</p>)}</div><div><span>QUOTE CONVENTION</span><p>{lesson.marketContext.quoteConvention}</p></div></div></LessonSection>
      <LessonSection index="03" label="MATHEMATICS" title="Notation, units and exact claims." id="mathematics"><div className="notation-grid">{lesson.mathematics.notation.map((item) => <code key={item}>{item}</code>)}</div><div className="formula-stack">{lesson.mathematics.formulas.map((formula) => <QuantVisual title={formula.label} eyebrow="QUANT NOTE" equation={formula.latex} annotation={formula.interpretation} caption="Read the equation together with its financial domain and convention." key={formula.label} />)}</div></LessonSection>
      <LessonSection index="04" label="DERIVATION" title="Do not jump to the final expression." id="derivation"><DerivationSteps {...lesson.derivation} /></LessonSection>
      <LessonSection index="05" label="MODEL / PRICING" title="Fit, compute, then challenge the assumptions." id="pricing"><div className="pricing-grid"><article><span>METHOD</span><p>{lesson.pricing.method}</p></article><article><span>CALIBRATION</span><p>{lesson.pricing.calibration}</p></article></div><div className="academy-limitations"><span>LIMITATIONS</span>{lesson.pricing.limitations.map((item) => <p key={item}>{item}</p>)}</div>{lesson.id !== "vol-implied" && <ModelComparison />}{lesson.implementation.quantLib && <details className="quantlib-note"><summary>Implementation with current QuantLib</summary><p>{lesson.implementation.quantLib}</p><small>API authority: upstream QuantLib reference pinned in the source registry.</small></details>}</LessonSection>
      <LessonSection index="06" label="PYTHON LAB" title="Theory → implementation → checks." id="python"><PythonLab {...lesson.implementation.pythonLab} /></LessonSection>
      <LessonSection index="07" label="INTERACTIVE LAB" title={hasSurface ? "One surface, four linked views." : "Move from formula to state."} id="interactive">{hasSurface ? <LazyVolSurfaceLab /> : <QuantVisual title="Implied-volatility inversion" eyebrow="NUMERICAL FLOW" annotation="The existing deterministic quant lab solves the same bracketed inverse with residual diagnostics." caption="The implementation remains shared with the platform’s typed pricing engine."><a className="academy-open-lab" href="/lab?lab=vanilla">OPEN IMPLIED-VOL SOLVER →</a></QuantVisual>}</LessonSection>
      <LessonSection index="08" label="FRONT OFFICE" title="Where the model meets the book." id="desk"><OnTheDesk section={lesson.frontOffice} /></LessonSection>
      <LessonSection index="09" label="MACRO CONNECTION" title="Map the transmission channel." id="macro">{lesson.macroConnections.map((connection) => <MacroFlow connection={connection} key={connection.title} />)}</LessonSection>
      <LessonSection index="10" label="COMMON PITFALLS" title="Most failures begin outside the formula." id="pitfalls"><div className="pitfall-list">{lesson.pitfalls.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div></LessonSection>
      <LessonSection index="11" label="SOURCES / FURTHER READING" title="Attribution with implementation authority." id="sources"><SourceReferences references={lesson.references} />{related.length > 0 && <div className="academy-related"><span>CONTINUE THE TRACK</span>{related.map((item) => <a href={`/learn/volatility/${item.slug}`} key={item.id}><b>{item.title}</b><p>{item.subtitle}</p><i>→</i></a>)}</div>}</LessonSection>
    </main></div>
  </article>;
}
