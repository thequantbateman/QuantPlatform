import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QuantFormula, type QuantFormulaLabels } from "../src/components/academy/AcademyComponents";
import type { AcademyDerivation, AcademyFormula } from "../src/content/academy/types";

const englishLabels: QuantFormulaLabels = {
  formula: "Formula",
  definition: "Definition",
  shortDerivation: "Short derivation",
  fullDerivation: "Full derivation",
  inputs: "Inputs",
  assumptions: "Assumptions and limits",
  openLab: "Open in Analytics",
  numericalCheck: "Numerical check",
};

const spanishLabels: QuantFormulaLabels = {
  formula: "Fórmula",
  definition: "Definición",
  shortDerivation: "Derivación breve",
  fullDerivation: "Derivación completa",
  inputs: "Entradas",
  assumptions: "Supuestos y límites",
  openLab: "Abrir en Analítica",
  numericalCheck: "Comprobación numérica",
};

const formula: AcademyFormula = {
  label: "Discount factor",
  latex: "P(0,T)=e^{-rT}",
  interpretation: "Present value of one unit paid at maturity.",
  depth: 3,
  analyticsHref: "/lab?lab=curve",
};

const derivation: AcademyDerivation = {
  formulaIndex: 0,
  depth: 3,
  title: "Integrate the short rate",
  introduction: "Start from continuous compounding.",
  steps: [
    { title: "Accumulate", body: "Write the accumulation factor.", latex: "A(0,T)=e^{rT}" },
    { title: "Invert", body: "Take its reciprocal.", latex: "P(0,T)=A(0,T)^{-1}", check: "r=5%, T=1 gives 0.9512." },
  ],
  conclusion: "Discounting reverses accumulation.",
};

function renderFormula({
  labels = englishLabels,
  formulaOverride = formula,
  derivationOverride = derivation,
  notation = ["r = continuously compounded zero rate", "T = maturity in years"],
  limitations = ["Assumes a flat deterministic rate."],
}: {
  labels?: QuantFormulaLabels;
  formulaOverride?: AcademyFormula;
  derivationOverride?: AcademyDerivation;
  notation?: string[];
  limitations?: string[];
} = {}): string {
  return renderToStaticMarkup(
    <QuantFormula
      formula={formulaOverride}
      derivation={derivationOverride}
      notation={notation}
      limitations={limitations}
      labels={labels}
      anchorId="discount-factor"
    />,
  );
}

test("renders the compact formula before closed native disclosures", () => {
  const html = renderFormula();

  assert.match(html, /Discount factor/);
  assert.match(html, /class="katex/);
  assert.match(html, /Present value of one unit paid at maturity\./);
  assert.equal((html.match(/<details\b/g) ?? []).length, 3);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|\s|>)/);
  assert.match(html, /<summary id="discount-factor-derivation-summary" aria-controls="discount-factor-derivation-region">Full derivation<\/summary>/);
  assert.match(html, /<div id="discount-factor-derivation-region" role="region" aria-labelledby="discount-factor-derivation-summary">/);
  assert.match(html, /<summary id="discount-factor-inputs-summary" aria-controls="discount-factor-inputs-region">Inputs<\/summary>/);
  assert.match(html, /<div id="discount-factor-inputs-region" role="region" aria-labelledby="discount-factor-inputs-summary">/);
  assert.match(html, /<summary id="discount-factor-assumptions-summary" aria-controls="discount-factor-assumptions-region">Assumptions and limits<\/summary>/);
  assert.match(html, /<a[^>]*href="\/lab\?lab=curve"[^>]*>Open in Analytics/);
});

test("omits empty disclosures, depth-one derivation, and unconfigured Analytics links", () => {
  const html = renderFormula({
    formulaOverride: { ...formula, depth: 1, analyticsHref: undefined },
    notation: [],
    limitations: [],
  });

  assert.match(html, /Definition/);
  assert.doesNotMatch(html, /<details\b/);
  assert.doesNotMatch(html, /<a\b/);
  assert.doesNotMatch(html, /Integrate the short rate/);
});

test("preserves localized disclosure structure, ordered math steps, and numerical checks", () => {
  const english = renderFormula();
  const spanish = renderFormula({ labels: spanishLabels });
  const tagNames = (html: string) => [...html.matchAll(/<\/?([a-z][\w-]*)\b/g)].map((match) => match[0]);

  assert.deepEqual(tagNames(spanish), tagNames(english));
  assert.match(spanish, /Fórmula/);
  assert.match(spanish, /Derivación completa/);
  assert.match(spanish, /Comprobación numérica/);
  assert.ok(spanish.indexOf("Accumulate") < spanish.indexOf("Invert"));
  assert.ok(spanish.indexOf("Invert") < spanish.indexOf("r=5%"));
  assert.equal((spanish.match(/<li\b/g) ?? []).length, 5);
});
