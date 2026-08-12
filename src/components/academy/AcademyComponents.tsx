import type { ReactNode } from "react";
import { Formula } from "@/src/components/content/Formula";
import { findAcademySource } from "@/src/content/academy/sources";
import type { AcademyDerivationStep, AcademyReference, DeskSection, MacroConnection } from "@/src/content/academy/types";
import { QuantFlow } from "./QuantFlow";

export function LessonSection({ index, label, title, children, id }: { index: string; label: string; title: string; children: ReactNode; id: string }) {
  return <section className="academy-section" id={id}><header><span>{index}</span><div><b>{label}</b><h2>{title}</h2></div></header>{children}</section>;
}

export function QuantVisual({ title, eyebrow, equation, annotation, caption, children, format = "wide" }: { title: string; eyebrow: string; equation?: string; annotation: string; caption: string; children?: ReactNode; format?: "wide" | "portrait" }) {
  return <figure className={`quant-visual quant-visual-${format}`}><header><span>{eyebrow}</span><b>SYNTHETIC · EDUCATIONAL</b></header><div className="quant-visual-stage"><div><h3>{title}</h3><p>{annotation}</p>{equation && <Formula latex={equation} />}</div>{children && <div className="quant-visual-media">{children}</div>}</div><figcaption>{caption}</figcaption></figure>;
}

export function DerivationSteps({ title, introduction, steps, conclusion }: { title: string; introduction: string; steps: AcademyDerivationStep[]; conclusion: string }) {
  return <div className="derivation"><div className="derivation-lead"><span>DERIVATION</span><h3>{title}</h3><p>{introduction}</p></div><ol>{steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h4>{step.title}</h4><p>{step.body}</p>{step.latex && <Formula latex={step.latex} />}{step.check && <aside><b>NUMERICAL CHECK</b>{step.check}</aside>}</div></li>)}</ol><p className="derivation-conclusion">{conclusion}</p></div>;
}

export function PythonLab({ title, objective, code, output, checks }: { title: string; objective: string; code: string; output: string[]; checks: string[] }) {
  const lines = code.split("\n");
  return <div className="python-lab"><header><div><span>PYTHON 3 · NUMPY / SCIPY</span><h3>{title}</h3><p>{objective}</p></div><b>REUSABLE EXAMPLE</b></header><div className="python-code" role="region" aria-label={`${title} source code`}>{lines.map((line, index) => <div key={`${index}-${line}`}><span>{String(index + 1).padStart(2, "0")}</span><code>{line || " "}</code></div>)}</div><footer><div><span>EXPECTED OUTPUT</span>{output.map((item) => <code key={item}>{item}</code>)}</div><div><span>SANITY CHECKS</span>{checks.map((check) => <p key={check}>✓ {check}</p>)}</div></footer></div>;
}

export function OnTheDesk({ section }: { section: DeskSection }) {
  return <div className="on-desk"><header><span>ON THE DESK</span><blockquote>“{section.quote}”</blockquote></header><div className="desk-columns"><div><b>VISIBLE INPUTS</b>{section.inputs.map((item) => <p key={item}>{item}</p>)}</div><div><b>CALIBRATION</b><p>{section.calibration}</p><b>RISK</b>{section.risk.map((item) => <p key={item}>{item}</p>)}</div><div><b>DAILY WORKFLOW</b><ol>{section.workflow.map((item) => <li key={item}>{item}</li>)}</ol></div></div><details><summary>Production failure modes</summary><ul>{section.productionIssues.map((item) => <li key={item}>{item}</li>)}</ul></details></div>;
}

export function MacroFlow({ connection }: { connection: MacroConnection }) {
  return <QuantFlow eyebrow="MACRO CONNECTION" title={connection.title} thesis={connection.thesis} nodes={connection.nodes.map((node, index) => ({ id: `macro-${index}-${node.label}`, label: node.label, value: index < connection.nodes.length - 1 ? "transmits" : "output", detail: node.effect, kind: index === 0 ? "market" : index === connection.nodes.length - 1 ? "risk" : "model" }))} />;
}

export function SourceReferences({ references }: { references: AcademyReference[] }) {
  return <div className="academy-references">{references.map((reference) => { const source = findAcademySource(reference.sourceId); return <article key={`${reference.sourceId}-${reference.locator}`}><header><span>{source?.role.replaceAll("-", " ")}</span><b>{source?.license ?? "Source"}</b></header><h3>{reference.locator}</h3><p>{reference.note}</p><dl><div><dt>Source</dt><dd>{source?.name}</dd></div><div><dt>Author</dt><dd>{source?.author}</dd></div><div><dt>Ref</dt><dd>{source?.ref}</dd></div></dl><a href={reference.url} target="_blank" rel="noreferrer">OPEN ORIGINAL SOURCE ↗</a>{source && <a href={source.licenseUrl} target="_blank" rel="noreferrer">LICENSE ↗</a>}</article>; })}</div>;
}

export function ModelComparison() {
  const rows = [
    ["Volatility state", "One constant σ", "σ(S,t) deterministic", "vₜ stochastic"],
    ["Fits today’s surface", "No", "Exactly, in ideal theory", "Approximately by calibration"],
    ["Forward dynamics", "Flat smile", "Spot-driven", "Variance + correlation driven"],
    ["Primary strength", "Transparent baseline", "Vanilla-consistent diffusion", "Richer smile dynamics"],
    ["Primary failure", "No smile", "Often unrealistic forward skew", "Parameter and calibration instability"],
    ["Compute", "Low", "Medium: PDE/MC", "Medium–high: Fourier/PDE/MC"],
    ["Hedge implication", "Greeks at one σ", "State-localized vol hedge", "Variance and vol-of-vol risk"],
  ];
  return <div className="model-comparison"><header><span>MODEL COMPARISON</span><h3>Static fit is not dynamics.</h3></header><div role="region" aria-label="Black-Scholes, local volatility and Heston comparison"><table><thead><tr><th>Question</th><th>Black–Scholes</th><th>Local volatility</th><th>Heston</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index ? <td key={cell}>{cell}</td> : <th scope="row" key={cell}>{cell}</th>)}</tr>)}</tbody></table></div></div>;
}
