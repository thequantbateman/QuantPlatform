import test from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { academyLessons } from "../src/content/academy/catalog";
import { localizeAcademyLesson } from "../src/content/academy/localization";

const analyticsRouteAllowlist = new Set([
  "/lab?lab=vanilla",
  "/lab?lab=greeks",
  "/lab?lab=curve",
  "/analytics/volatility",
]);

const reviewedDerivationBindings: Record<string, number> = {
  "foundation-filtrations": 0,
  "foundation-conditional-expectation": 0,
  "foundation-measure-change": 0,
  "foundation-girsanov": 1,
  "foundation-forward-measures": 0,
  "numerical-monte-carlo": 0,
  "numerical-schemes": 1,
  "numerical-variance-reduction": 1,
  "numerical-fourier-cos": 1,
  "greeks-first-order": 0,
  "greeks-higher-order": 0,
  "hedging-pnl": 0,
  "risk-exposure-profile": 0,
  "xva-adjustments": 0,
  "risk-var-es": 1,
  "risk-model-governance": 1,
  "vol-realized": 0,
  "vol-realized-implied": 0,
  "vol-implied": 0,
  "vol-smile": 1,
  "vol-term": 1,
  "vol-surface": 3,
  "vol-local": 1,
  "vol-stochastic": 2,
  "vol-heston": 0,
  "vol-sabr": 2,
  "vol-calibration": 1,
  "vol-higher-risk": 1,
  "rate-discount": 1,
  "rate-zero-forward": 1,
  "rate-conventions": 1,
  "rate-ois": 0,
  "rate-fra-futures": 1,
  "rate-swaps": 1,
  "rate-optionality": 1,
  "rate-curve-bootstrap": 0,
  "rate-interpolation": 1,
  "rate-multicurve": 2,
  "rate-curve-risk": 0,
  "rate-hull-white": 1,
  "rate-hjm": 1,
};

const reviewedFormulaCounts: Record<string, number> = {
  "foundation-filtrations": 2,
  "foundation-conditional-expectation": 2,
  "foundation-measure-change": 2,
  "foundation-girsanov": 2,
  "foundation-forward-measures": 2,
  "numerical-monte-carlo": 2,
  "numerical-schemes": 2,
  "numerical-variance-reduction": 2,
  "numerical-fourier-cos": 2,
  "greeks-first-order": 2,
  "greeks-higher-order": 2,
  "hedging-pnl": 2,
  "risk-exposure-profile": 2,
  "xva-adjustments": 2,
  "risk-var-es": 2,
  "risk-model-governance": 2,
  "vol-realized": 3,
  "vol-realized-implied": 2,
  "vol-implied": 3,
  "vol-smile": 3,
  "vol-term": 3,
  "vol-surface": 4,
  "vol-local": 3,
  "vol-stochastic": 3,
  "vol-heston": 4,
  "vol-sabr": 3,
  "vol-calibration": 3,
  "vol-higher-risk": 3,
  "rate-discount": 3,
  "rate-zero-forward": 3,
  "rate-conventions": 3,
  "rate-ois": 3,
  "rate-fra-futures": 3,
  "rate-swaps": 3,
  "rate-optionality": 3,
  "rate-curve-bootstrap": 3,
  "rate-interpolation": 3,
  "rate-multicurve": 3,
  "rate-curve-risk": 3,
  "rate-hull-white": 3,
  "rate-hjm": 3,
};

test("all Academy formulas declare depth, valid analytics routes, and strict-valid LaTeX", () => {
  const formulas = academyLessons.flatMap((lesson) =>
    lesson.mathematics.formulas.map((formula) => ({ lessonId: lesson.id, formula })),
  );

  assert.equal(formulas.length, 108);
  for (const { lessonId, formula } of formulas) {
    assert.ok([1, 2, 3].includes(formula.depth), `${lessonId}:${formula.label}:depth`);
    assert.ok(formula.latex.trim().length > 0, `${lessonId}:${formula.label}:latexBlank`);
    if (formula.analyticsHref) {
      assert.ok(analyticsRouteAllowlist.has(formula.analyticsHref), `${lessonId}:${formula.label}:analyticsHref`);
    }
    assert.doesNotThrow(
      () => katex.renderToString(formula.latex, { throwOnError: true }),
      `${lessonId}:${formula.label}:latex`,
    );
  }
});

test("all Academy derivations bind to an existing formula and satisfy their depth contract", () => {
  assert.equal(academyLessons.length, 41);
  assert.deepEqual(
    academyLessons.map((lesson) => lesson.id).sort(),
    Object.keys(reviewedDerivationBindings).sort(),
    "reviewed binding map must cover every Academy lesson exactly",
  );
  assert.deepEqual(
    Object.keys(reviewedFormulaCounts).sort(),
    Object.keys(reviewedDerivationBindings).sort(),
    "reviewed formula counts must cover the same Academy lessons",
  );
  for (const lesson of academyLessons) {
    const { derivation } = lesson;
    assert.equal(derivation.formulaIndex, reviewedDerivationBindings[lesson.id], `${lesson.id}:reviewedFormulaIndex`);
    assert.equal(lesson.mathematics.formulas.length, reviewedFormulaCounts[lesson.id], `${lesson.id}:formulaCount`);
    assert.ok(
      Number.isInteger(derivation.formulaIndex)
        && derivation.formulaIndex >= 0
        && derivation.formulaIndex < lesson.mathematics.formulas.length,
      `${lesson.id}:formulaIndex`,
    );
    assert.ok(derivation.depth === 2 || derivation.depth === 3, `${lesson.id}:derivationDepth`);
    assert.ok(derivation.steps.length >= (derivation.depth === 3 ? 4 : 2), `${lesson.id}:steps`);
    assert.equal(
      lesson.mathematics.formulas[derivation.formulaIndex]?.depth,
      derivation.depth,
      `${lesson.id}:boundFormulaDepth`,
    );
    assert.equal(new Set(derivation.steps.map((step) => step.title)).size, derivation.steps.length, `${lesson.id}:stepTitles`);
    assert.equal(new Set(derivation.steps.map((step) => step.body)).size, derivation.steps.length, `${lesson.id}:stepBodies`);

    for (const [index, step] of derivation.steps.entries()) {
      assert.ok(step.title.trim().length > 0, `${lesson.id}:step-${index}:title`);
      assert.ok(step.body.trim().length > 0, `${lesson.id}:step-${index}:body`);
      if (step.latex !== undefined) {
        assert.ok(step.latex.trim().length > 0, `${lesson.id}:step-${index}:latexBlank`);
        assert.doesNotThrow(
          () => katex.renderToString(step.latex!, { throwOnError: true }),
          `${lesson.id}:step-${index}:latex`,
        );
      }
    }
  }
});

test("Heston's displayed derivation target is the affine characteristic function", () => {
  const lesson = academyLessons.find((item) => item.id === "vol-heston");
  assert.ok(lesson);
  const boundFormula = lesson.mathematics.formulas[lesson.derivation.formulaIndex];
  assert.equal(boundFormula.latex, "\\phi(u,\\tau)=\\exp(C(u,\\tau)+D(u,\\tau)v_t+iux_t)");
  assert.ok(lesson.derivation.steps.some((step) => step.latex === boundFormula.latex));
});

test("Spanish Academy localization preserves formula depth and derivation binding", () => {
  for (const lesson of academyLessons) {
    const localized = localizeAcademyLesson(lesson, "es");
    assert.ok(
      localized.mathematics.formulas.every((formula) => [1, 2, 3].includes(formula.depth)),
      `${lesson.id}:localizedFormulaDepths`,
    );
    assert.deepEqual(
      localized.mathematics.formulas.map((formula) => formula.depth),
      lesson.mathematics.formulas.map((formula) => formula.depth),
      `${lesson.id}:formulaDepths`,
    );
    assert.ok(Number.isInteger(localized.derivation.formulaIndex), `${lesson.id}:localizedFormulaIndex`);
    assert.ok(localized.derivation.depth === 2 || localized.derivation.depth === 3, `${lesson.id}:localizedDerivationDepth`);
    assert.equal(localized.derivation.formulaIndex, lesson.derivation.formulaIndex, `${lesson.id}:formulaIndex`);
    assert.equal(localized.derivation.depth, lesson.derivation.depth, `${lesson.id}:derivationDepth`);
  }
});
