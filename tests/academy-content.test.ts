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

test("all Academy formulas declare depth, valid analytics routes, and strict-valid LaTeX", () => {
  const formulas = academyLessons.flatMap((lesson) =>
    lesson.mathematics.formulas.map((formula) => ({ lessonId: lesson.id, formula })),
  );

  assert.equal(formulas.length, 108);
  for (const { lessonId, formula } of formulas) {
    assert.ok([1, 2, 3].includes(formula.depth), `${lessonId}:${formula.label}:depth`);
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
  for (const lesson of academyLessons) {
    const { derivation } = lesson;
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
      if (step.latex) {
        assert.doesNotThrow(
          () => katex.renderToString(step.latex!, { throwOnError: true }),
          `${lesson.id}:step-${index}:latex`,
        );
      }
    }
  }
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
