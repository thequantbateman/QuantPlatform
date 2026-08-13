import type { ReactNode } from "react";
import { Formula } from "@/src/components/content/Formula";
import { findAcademySource } from "@/src/content/academy/sources";
import type { AcademyDerivation, AcademyDerivationStep, AcademyFormula, AcademyReference, DeskSection, MacroConnection } from "@/src/content/academy/types";
import { pick, type Locale } from "@/src/i18n";
import { QuantFlow } from "./QuantFlow";

export function LessonSection({ index, label, title, children, id, wide = false }: { index: string; label: string; title: string; children: ReactNode; id: string; wide?: boolean }) {
  return <section className={`academy-section${wide ? " academy-section-wide" : ""}`} id={id}><header><span>{index}</span><div><b>{label}</b><h2>{title}</h2></div></header>{children}</section>;
}

export function LessonDisclosure({ index, label, title, children, id }: { index: string; label: string; title: string; children: ReactNode; id: string }) {
  const summaryId = `${id}-summary`;
  return <section className="academy-section academy-section-disclosure"><details className="academy-section-details"><summary id={summaryId}><span>{index}</span><span className="academy-section-summary-copy"><b>{label}</b><strong>{title}</strong></span></summary><div className="academy-section-details-body" id={id} role="region" aria-labelledby={summaryId}>{children}</div></details></section>;
}

export function QuantVisual({ title, eyebrow, equation, annotation, caption, children, locale, format = "wide" }: { title: string; eyebrow: string; equation?: string; annotation: string; caption: string; children?: ReactNode; locale: Locale; format?: "wide" | "portrait" }) {
  return <figure className={`quant-visual quant-visual-${format}`}><header><span>{eyebrow}</span><b>{pick(locale, { en: "SYNTHETIC · EDUCATIONAL", es: "SINTÉTICO · EDUCATIVO" })}</b></header><div className="quant-visual-stage"><div><h3>{title}</h3><p>{annotation}</p>{equation && <Formula latex={equation} />}</div>{children && <div className="quant-visual-media">{children}</div>}</div><figcaption>{caption}</figcaption></figure>;
}

export function DerivationSteps({ title, introduction, steps, conclusion, eyebrow = "DERIVATION", numericalCheckLabel = "NUMERICAL CHECK" }: { title: string; introduction: string; steps: AcademyDerivationStep[]; conclusion: string; eyebrow?: string; numericalCheckLabel?: string }) {
  return <div className="derivation"><div className="derivation-lead"><span>{eyebrow}</span><h3>{title}</h3><p>{introduction}</p></div><ol>{steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h4>{step.title}</h4><p>{step.body}</p>{step.latex && <Formula latex={step.latex} />}{step.check && <aside><b>{numericalCheckLabel}</b>{step.check}</aside>}</div></li>)}</ol><p className="derivation-conclusion">{conclusion}</p></div>;
}

export interface QuantFormulaLabels {
  formula: string;
  definition: string;
  shortDerivation: string;
  fullDerivation: string;
  inputs: string;
  assumptions: string;
  openLab: string;
  numericalCheck: string;
}

function FormulaDisclosure({ anchorId, kind, label, children }: { anchorId: string; kind: "derivation" | "inputs" | "assumptions"; label: string; children: ReactNode }): ReactNode {
  const detailsId = `${anchorId}-${kind}`;
  const summaryId = `${anchorId}-${kind}-summary`;
  const regionId = `${anchorId}-${kind}-region`;
  return <details className="quant-formula-disclosure" id={detailsId}><summary id={summaryId} aria-controls={regionId}>{label}</summary><div id={regionId} role="region" aria-labelledby={summaryId}>{children}</div></details>;
}

export function QuantFormula({
  formula,
  derivation,
  notation,
  limitations,
  labels,
  anchorId,
  derivationAnchorId,
}: {
  formula: AcademyFormula;
  derivation?: AcademyDerivation;
  notation: string[];
  limitations: string[];
  labels: QuantFormulaLabels;
  /** Unique within the page, normally `${lessonId}-formula-${formulaIndex}`. */
  anchorId: string;
  /** Stable lesson hash placed inside the bound, closed derivation disclosure. */
  derivationAnchorId?: string;
}): ReactNode {
  const depthLabel = formula.depth === 1 ? labels.definition : formula.depth === 2 ? labels.shortDerivation : labels.fullDerivation;
  return <article className="quant-formula" id={anchorId} aria-labelledby={`${anchorId}-title`}>
    <header><span>{labels.formula} · {depthLabel}</span><h3 id={`${anchorId}-title`}>{formula.label}</h3></header>
    <div className="quant-formula-equation"><Formula latex={formula.latex} /></div>
    <p className="quant-formula-interpretation">{formula.interpretation}</p>
    {formula.analyticsHref && <a className="quant-formula-lab" href={formula.analyticsHref}>{labels.openLab} <span aria-hidden="true">↗</span></a>}
    <div className="quant-formula-disclosures">
      {formula.depth > 1 && derivation && <FormulaDisclosure anchorId={anchorId} kind="derivation" label={depthLabel}><div id={derivationAnchorId} className={derivationAnchorId ? "academy-hash-anchor" : undefined}><DerivationSteps {...derivation} eyebrow={depthLabel} numericalCheckLabel={labels.numericalCheck} /></div></FormulaDisclosure>}
      {notation.length > 0 && <FormulaDisclosure anchorId={anchorId} kind="inputs" label={labels.inputs}><ul>{notation.map((item) => <li key={item}><code>{item}</code></li>)}</ul></FormulaDisclosure>}
      {limitations.length > 0 && <FormulaDisclosure anchorId={anchorId} kind="assumptions" label={labels.assumptions}><ul>{limitations.map((item) => <li key={item}>{item}</li>)}</ul></FormulaDisclosure>}
    </div>
  </article>;
}

export function PythonLab({ title, objective, code, output, checks, locale }: { title: string; objective: string; code: string; output: string[]; checks: string[]; locale: Locale }) {
  const lines = code.split("\n");
  return <div className="python-lab"><header><div><span>PYTHON 3 · NUMPY / SCIPY</span><h3>{title}</h3><p>{objective}</p></div><b>{pick(locale, { en: "REUSABLE EXAMPLE", es: "EJEMPLO REUTILIZABLE" })}</b></header><div className="python-code" role="region" aria-label={pick(locale, { en: `${title} source code`, es: `Código fuente de ${title}` })}>{lines.map((line, index) => <div key={`${index}-${line}`}><span>{String(index + 1).padStart(2, "0")}</span><code>{line || " "}</code></div>)}</div><footer><div><span>{pick(locale, { en: "EXPECTED OUTPUT", es: "RESULTADO ESPERADO" })}</span>{output.map((item) => <code key={item}>{item}</code>)}</div><div><span>{pick(locale, { en: "SANITY CHECKS", es: "COMPROBACIONES" })}</span>{checks.map((check) => <p key={check}>✓ {check}</p>)}</div></footer></div>;
}

export function OnTheDesk({ section, locale }: { section: DeskSection; locale: Locale }) {
  return <div className="on-desk"><header><span>{pick(locale, { en: "ON THE DESK", es: "EN LA MESA" })}</span><blockquote>“{section.quote}”</blockquote></header><div className="desk-columns"><div><b>{pick(locale, { en: "VISIBLE INPUTS", es: "INPUTS VISIBLES" })}</b>{section.inputs.map((item) => <p key={item}>{item}</p>)}</div><div><b>{pick(locale, { en: "CALIBRATION", es: "CALIBRACIÓN" })}</b><p>{section.calibration}</p><b>{pick(locale, { en: "RISK", es: "RIESGO" })}</b>{section.risk.map((item) => <p key={item}>{item}</p>)}</div><div><b>{pick(locale, { en: "DAILY WORKFLOW", es: "FLUJO DIARIO" })}</b><ol>{section.workflow.map((item) => <li key={item}>{item}</li>)}</ol></div></div><details><summary>{pick(locale, { en: "Production failure modes", es: "Modos de fallo en producción" })}</summary><ul>{section.productionIssues.map((item) => <li key={item}>{item}</li>)}</ul></details></div>;
}

export function MacroFlow({ connection, locale }: { connection: MacroConnection; locale: Locale }) {
  return <QuantFlow eyebrow={pick(locale, { en: "MACRO CONNECTION", es: "CONEXIÓN MACRO" })} title={connection.title} thesis={connection.thesis} nodes={connection.nodes.map((node, index) => ({ id: `macro-${index}-${node.label}`, label: node.label, value: index < connection.nodes.length - 1 ? pick(locale, { en: "transmits", es: "transmite" }) : pick(locale, { en: "output", es: "resultado" }), detail: node.effect, kind: index === 0 ? "market" : index === connection.nodes.length - 1 ? "risk" : "model" }))} />;
}

export function SourceReferences({ references, locale }: { references: AcademyReference[]; locale: Locale }) {
  const roles = {
    research: pick(locale, { en: "research", es: "investigación" }),
    "implementation-reference": pick(locale, { en: "implementation reference", es: "referencia de implementación" }),
    "historical-reference": pick(locale, { en: "historical reference", es: "referencia histórica" }),
  } as const;
  return <div className="academy-references">{references.map((reference) => { const source = findAcademySource(reference.sourceId); return <article key={`${reference.sourceId}-${reference.locator}`}><header><span>{source ? roles[source.role] : pick(locale, { en: "source", es: "fuente" })}</span><b>{source?.license ?? pick(locale, { en: "Source", es: "Fuente" })}</b></header><h3>{reference.locator}</h3><p>{reference.note}</p><dl><div><dt>{pick(locale, { en: "Source", es: "Fuente" })}</dt><dd>{source?.name}</dd></div><div><dt>{pick(locale, { en: "Author", es: "Autor" })}</dt><dd>{source?.author}</dd></div><div><dt>Ref</dt><dd>{source?.ref}</dd></div></dl><a href={reference.url} target="_blank" rel="noreferrer">{pick(locale, { en: "OPEN ORIGINAL SOURCE", es: "ABRIR FUENTE ORIGINAL" })} ↗</a>{source && <a href={source.licenseUrl} target="_blank" rel="noreferrer">{pick(locale, { en: "LICENSE", es: "LICENCIA" })} ↗</a>}</article>; })}</div>;
}

export function ModelComparison({ locale }: { locale: Locale }) {
  const rows = locale === "es" ? [
    ["Estado de volatilidad", "Una constante σ", "σ(S,t) determinista", "vₜ estocástica"],
    ["Ajusta la superficie actual", "No", "Exactamente, en la teoría ideal", "Aproximadamente, mediante calibración"],
    ["Dinámica forward", "Sonrisa plana", "Impulsada por spot", "Impulsada por varianza y correlación"],
    ["Fortaleza principal", "Referencia transparente", "Difusión coherente con vanillas", "Dinámica de sonrisa más rica"],
    ["Fallo principal", "Sin sonrisa", "Skew forward a menudo poco realista", "Inestabilidad de parámetros y calibración"],
    ["Cálculo", "Bajo", "Medio: PDE/MC", "Medio–alto: Fourier/PDE/MC"],
    ["Implicación para la cobertura", "Griegas con una σ", "Cobertura de vol localizada por estado", "Riesgo de varianza y vol-of-vol"],
  ] : [
    ["Volatility state", "One constant σ", "σ(S,t) deterministic", "vₜ stochastic"],
    ["Fits today’s surface", "No", "Exactly, in ideal theory", "Approximately by calibration"],
    ["Forward dynamics", "Flat smile", "Spot-driven", "Variance + correlation driven"],
    ["Primary strength", "Transparent baseline", "Vanilla-consistent diffusion", "Richer smile dynamics"],
    ["Primary failure", "No smile", "Often unrealistic forward skew", "Parameter and calibration instability"],
    ["Compute", "Low", "Medium: PDE/MC", "Medium–high: Fourier/PDE/MC"],
    ["Hedge implication", "Greeks at one σ", "State-localized vol hedge", "Variance and vol-of-vol risk"],
  ];
  return <div className="model-comparison"><header><span>{pick(locale, { en: "MODEL COMPARISON", es: "COMPARACIÓN DE MODELOS" })}</span><h3>{pick(locale, { en: "Static fit is not dynamics.", es: "El ajuste estático no define la dinámica." })}</h3></header><div role="region" aria-label={pick(locale, { en: "Black-Scholes, local volatility and Heston comparison", es: "Comparación de Black-Scholes, volatilidad local y Heston" })}><table><thead><tr><th>{pick(locale, { en: "Question", es: "Pregunta" })}</th><th>Black–Scholes</th><th>{pick(locale, { en: "Local volatility", es: "Volatilidad local" })}</th><th>Heston</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index ? <td key={cell}>{cell}</td> : <th scope="row" key={cell}>{cell}</th>)}</tr>)}</tbody></table></div></div>;
}
