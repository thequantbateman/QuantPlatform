import test from "node:test";
import assert from "node:assert/strict";
import { contentCatalog, findContent } from "../src/content/catalog";
import { localizeEntry } from "../src/content/localization";
import { academyLessons, academyTracks, findAcademyLesson, findAcademyLessonForRoute } from "../src/content/academy/catalog";
import { localizeAcademyLesson, localizeAcademyLevel, localizeAcademyTrack } from "../src/content/academy/localization";
import { academySources } from "../src/content/academy/sources";

test("expanded knowledge graph covers all major asset families", () => {
  assert.ok(contentCatalog.length >= 100);
  for (const asset of ["Foundations", "EQ", "FX", "IR", "COMM", "Frontier"]) assert.ok(contentCatalog.some((entry) => entry.assetClass === asset), asset);
});

test("Spanish localization preserves identifiers and mathematics", () => {
  const source = findContent("equity", "local-volatility");
  assert.ok(source);
  const localized = localizeEntry(source, "es");
  assert.equal(localized.slug, source.slug);
  assert.equal(localized.mathematics, source.mathematics);
  assert.notEqual(localized.title, source.title);
  assert.match(localized.marketUse, /mercado/i);
});

test("market-to-model bridge concepts remain in the knowledge graph", () => {
  for (const slug of ["bid-ask-and-mid", "market-price-vs-model-price", "streaming-quotes-and-staleness", "reference-vs-real-time-data", "prediction-market-probabilities", "prediction-event-market-outcome-and-token", "prediction-market-order-books", "prediction-market-resolution-and-negative-risk", "prediction-market-liquidity-open-interest-and-volume", "realized-vs-implied-volatility"]) assert.ok(contentCatalog.some((entry) => entry.slug === slug), slug);
});

test("Academy V2 lessons implement the canonical educational contract", () => {
  assert.equal(academyLessons.length, 41);
  for (const lesson of academyLessons) {
    assert.ok(lesson.learningObjectives.length >= 3, lesson.id);
    assert.ok(lesson.mathematics.formulas.length >= 2, lesson.id);
    assert.ok(lesson.derivation.depth === 2 || lesson.derivation.depth === 3, lesson.id);
    assert.ok(lesson.derivation.formulaIndex >= 0 && lesson.derivation.formulaIndex < lesson.mathematics.formulas.length, lesson.id);
    assert.equal(lesson.mathematics.formulas[lesson.derivation.formulaIndex].depth, lesson.derivation.depth, lesson.id);
    assert.ok(lesson.derivation.steps.length >= (lesson.derivation.depth === 3 ? 4 : 2), lesson.id);
    assert.ok(lesson.implementation.pythonLab.code.includes("assert"), lesson.id);
    assert.ok(lesson.frontOffice.workflow.length >= 4, lesson.id);
    assert.ok(lesson.macroConnections.length > 0, lesson.id);
    assert.ok(lesson.references.length > 0, lesson.id);
    assert.ok(lesson.interactiveLabs.length > 0, lesson.id);
    assert.doesNotMatch(lesson.intuition.lead, /build the mental model/i, lesson.id);
    assert.ok(lesson.mathematics.formulas.every((formula) => !formula.latex.includes("\\mathcal{M}")), lesson.id);
  }
  assert.equal(findAcademyLesson("volatility-surface")?.id, "vol-surface");
});

test("six Academy tracks preserve every canonical lesson destination exactly once", () => {
  assert.equal(academyTracks.length, 6);
  const destinations = academyTracks.flatMap((track) => track.nodes.map((node) => ({ trackId: track.id, node })));
  assert.equal(destinations.length, 41);
  assert.equal(new Set(destinations.map(({ node }) => node.academyLessonId)).size, academyLessons.length);
  assert.equal(new Set(destinations.map(({ node }) => node.href)).size, academyLessons.length);
  for (const { trackId, node } of destinations) {
    const lesson = academyLessons.find((item) => item.id === node.academyLessonId);
    assert.ok(lesson, `${trackId}:${node.id}`);
    assert.equal(node.href, `/learn/${lesson.domain}/${lesson.slug}`, lesson.id);
    assert.ok(lesson.intuition.lead && lesson.marketContext.why && lesson.implementation.pythonLab.code, lesson.id);
    assert.ok(lesson.interactiveLabs[0] && lesson.references[0], lesson.id);
  }
});

test("flagship volatility track is sequenced and cross-links deep lessons", () => {
  const track = academyTracks.find((item) => item.id === "volatility");
  assert.ok(track);
  assert.ok(track.nodes.length >= 12);
  assert.equal(track.nodes[0].id, "volatility");
  assert.ok(track.nodes.some((node) => node.academyLessonId === "vol-surface"));
  assert.ok(track.nodes.every((node) => node.academyLessonId), "every volatility stage must resolve to a deep lesson");
  assert.equal(new Set(track.nodes.map((node) => node.academyLessonId)).size, 12);
});

test("flagship rates track is sequenced from discounting through HJM", () => {
  const track = academyTracks.find((item) => item.id === "rates");
  assert.ok(track);
  assert.equal(track.nodes.length, 13);
  assert.equal(track.nodes[0].academyLessonId, "rate-discount");
  assert.equal(track.nodes.at(-1)?.academyLessonId, "rate-hjm");
  assert.ok(track.nodes.some((node) => node.academyLessonId === "rate-curve-bootstrap"));
  assert.ok(track.nodes.some((node) => node.academyLessonId === "rate-optionality"));
  assert.equal(new Set(track.nodes.map((node) => node.academyLessonId)).size, 13);
});

test("advanced Academy tracks connect foundations, numerics, Greeks and xVA", () => {
  const expected = new Map([
    ["foundations", ["foundation-filtrations", "foundation-forward-measures"]],
    ["numerical-finance", ["numerical-monte-carlo", "numerical-fourier-cos"]],
    ["greeks-hedging", ["greeks-first-order", "hedging-pnl"]],
    ["risk-xva", ["risk-exposure-profile", "risk-model-governance"]],
  ]);
  for (const [trackId, boundaries] of expected) {
    const track = academyTracks.find((item) => item.id === trackId);
    assert.ok(track, trackId);
    assert.equal(track.nodes[0].academyLessonId, boundaries[0]);
    assert.equal(track.nodes.at(-1)?.academyLessonId, boundaries[1]);
    assert.ok(track.nodes.every((node) => findAcademyLesson(node.href.split("/").at(-1) ?? "")), trackId);
  }
});

test("new advanced lessons carry complete Spanish payloads", () => {
  for (const lesson of academyLessons.filter((item) => ["foundations", "numerical-finance", "risk", "xva"].includes(item.domain))) {
    assert.ok(lesson.localized?.es.title, lesson.id);
    assert.equal(lesson.localized?.es.learningObjectives?.length, lesson.learningObjectives.length, lesson.id);
    assert.equal(lesson.localized?.es.derivation?.steps.length, lesson.derivation.steps.length, lesson.id);
    assert.equal(lesson.localized?.es.interactiveLabs?.length, 1, lesson.id);
  }
});

test("canonical formula and track metadata use authored Spanish labels", () => {
  const heston = academyLessons.find((lesson) => lesson.id === "vol-heston");
  const discounting = academyLessons.find((lesson) => lesson.id === "rate-discount");
  const volatilityTrack = academyTracks.find((track) => track.id === "volatility");
  assert.ok(heston && discounting && volatilityTrack);

  assert.deepEqual(
    localizeAcademyLesson(heston, "es").mathematics.formulas.map((formula) => formula.label),
    ["Función característica afín", "Proceso de varianza", "Correlación de apalancamiento", "Condición de Feller"],
  );
  assert.deepEqual(
    localizeAcademyLesson(discounting, "es").mathematics.formulas.map((formula) => formula.label),
    ["Precio del bono cupón cero", "Valor actual del flujo de caja", "Rentabilidad por cociente de descuentos"],
  );
  for (const lesson of academyLessons.filter((item) => item.domain === "volatility" || item.domain === "rates")) {
    const labels = localizeAcademyLesson(lesson, "es").mathematics.formulas.map((formula) => formula.label);
    assert.equal(labels.length, lesson.mathematics.formulas.length, lesson.id);
    labels.forEach((label, index) => assert.notEqual(label, lesson.mathematics.formulas[index].label, `${lesson.id}:${index}`));
  }
  assert.equal(localizeAcademyTrack(volatilityTrack, "es").nodes[0].stage, "Medición y estimadores");
  assert.equal(localizeAcademyLevel("front-office", "es"), "front office");
  assert.equal(localizeAcademyLevel("foundation", "es"), "fundamentos");
});

test("legacy volatility routes resolve to the canonical deep lessons", () => {
  assert.equal(findAcademyLessonForRoute("equity", "realized-volatility")?.id, "vol-realized");
  assert.equal(findAcademyLessonForRoute("equity", "historical-volatility")?.id, "vol-realized");
  assert.equal(findAcademyLessonForRoute("equity", "volatility-smile")?.id, "vol-smile");
});

test("legacy rates routes resolve to canonical deep lessons", () => {
  assert.equal(findAcademyLessonForRoute("rates", "yield-curves")?.id, "rate-curve-bootstrap");
  assert.equal(findAcademyLessonForRoute("rates", "swaps")?.id, "rate-swaps");
  assert.equal(findAcademyLessonForRoute("rates", "hjm")?.id, "rate-hjm");
});

test("every Academy reference resolves to an attributed licensed source", () => {
  const sourceIds = new Set(academySources.map((source) => source.id));
  for (const lesson of academyLessons) for (const reference of lesson.references) assert.ok(sourceIds.has(reference.sourceId), `${lesson.id}:${reference.sourceId}`);
  for (const source of academySources) {
    assert.ok(source.license.length > 0);
    assert.match(source.url, /^https:\/\//);
    assert.match(source.licenseUrl, /^https:\/\//);
  }
});
