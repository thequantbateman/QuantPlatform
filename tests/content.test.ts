import test from "node:test";
import assert from "node:assert/strict";
import { contentCatalog, findContent } from "../src/content/catalog";
import { localizeEntry } from "../src/content/localization";
import { academyLessons, academyTracks, findAcademyLesson, findAcademyLessonForRoute } from "../src/content/academy/catalog";
import { localizeAcademyLesson, localizeAcademyLevel, localizeAcademyTrack } from "../src/content/academy/localization";
import { academySources } from "../src/content/academy/sources";
import { findSourceRecord } from "../src/licensing/registry";
import { academyNarrativeForLesson, academySectionDefinitions } from "../src/content/academy/narrative";
import { legacyNarrativeForEntry } from "../src/content/narrative";
import katex from "katex";

test("expanded knowledge graph covers all major asset families", () => {
  assert.ok(contentCatalog.length >= 100);
  for (const asset of ["Foundations", "EQ", "FX", "IR", "COMM", "Frontier"]) assert.ok(contentCatalog.some((entry) => entry.assetClass === asset), asset);
});

test("legacy topics use specific mathematics instead of a shared placeholder", () => {
  const placeholder = "\\operatorname{Value}=\\mathcal{M}(\\text{state},\\text{parameters},\\text{conventions})";
  const generatedTitles = [
    "Conditional Expectation", "Itô Calculus", "Monte Carlo", "Heston", "SABR",
    "Premium-Adjusted Delta", "Cross-Currency Basis", "Hull-White", "LMM",
    "Swing Options", "Weather Derivatives", "Real Options",
  ];

  for (const title of generatedTitles) {
    const entry = contentCatalog.find((candidate) => candidate.title === title);
    assert.ok(entry, title);
    assert.notEqual(entry.mathematics, placeholder, title);
  }

  for (const entry of contentCatalog) {
    assert.doesNotThrow(() => katex.renderToString(entry.mathematics, { throwOnError: true }), entry.title);
  }
});

test("legacy articles vary their teaching sequence by content archetype", () => {
  const examples = ["Conditional Expectation", "Heston", "Interest Rate Swaps", "Monte Carlo", "Bid Ask and Mid", "Rough Volatility"];
  const narratives = examples.map((title) => {
    const entry = contentCatalog.find((candidate) => candidate.title === title);
    assert.ok(entry, title);
    return legacyNarrativeForEntry(entry, "en");
  });

  assert.equal(new Set(narratives.map((narrative) => narrative.profile)).size, examples.length);
  assert.equal(new Set(narratives.map((narrative) => narrative.sections[0].title)).size, examples.length);
  assert.equal(legacyNarrativeForEntry(contentCatalog.find((entry) => entry.title === "Heston")!, "es").sections[0].title, "Empieza por la dinámica observable.");
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

test("Spanish legacy content preserves archetype-specific teaching intent", () => {
  const heston = localizeEntry(contentCatalog.find((entry) => entry.title === "Heston")!, "es");
  const monteCarlo = localizeEntry(contentCatalog.find((entry) => entry.title === "Monte Carlo")!, "es");
  const swing = localizeEntry(contentCatalog.find((entry) => entry.title === "Swing Options")!, "es");

  assert.equal(heston.description, "Modela la varianza como una difusión de raíz cuadrada con reversión a la media.");
  assert.match(heston.intuition, /variables de estado, la dinámica y la medida/i);
  assert.match(monteCarlo.intuition, /aproximación con un presupuesto de error/i);
  assert.match(swing.intuition, /pago, el calendario de fijaciones y la divisa/i);
  assert.notDeepEqual(heston.assumptions, monteCarlo.assumptions);
  assert.notEqual(heston.deskView, swing.deskView);
});

test("market-to-model bridge concepts remain in the knowledge graph", () => {
  for (const slug of ["bid-ask-and-mid", "market-price-vs-model-price", "streaming-quotes-and-staleness", "reference-vs-real-time-data", "prediction-market-probabilities", "prediction-event-market-outcome-and-token", "prediction-market-order-books", "prediction-market-resolution-and-negative-risk", "prediction-market-liquidity-open-interest-and-volume", "realized-vs-implied-volatility"]) assert.ok(contentCatalog.some((entry) => entry.slug === slug), slug);
});

test("Academy V2 lessons implement the canonical educational contract", () => {
  assert.equal(academyLessons.length, 45);
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
  assert.equal(destinations.length, 45);
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
    ["foundations", ["foundation-distributions", "foundation-forward-measures"]],
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

test("the stochastic-pricing foundation closes the textbook dependency gap", () => {
  const expectedIds = [
    "foundation-distributions",
    "foundation-brownian-ito",
    "foundation-gbm-dynamics",
    "foundation-black-scholes",
  ];
  const track = academyTracks.find((item) => item.id === "foundations");
  assert.ok(track);
  assert.deepEqual(track.nodes.slice(0, 4).map((node) => node.academyLessonId), expectedIds);

  for (const id of expectedIds) {
    const lesson = academyLessons.find((item) => item.id === id);
    assert.ok(lesson, id);
    assert.equal(lesson.references.some((reference) => reference.sourceId === "oosterlee-grzelak-2020"), true, id);
    assert.ok(lesson.localized?.es?.title, `${id}:Spanish title`);
    assert.equal(lesson.localized?.es?.derivation?.steps.length, lesson.derivation.steps.length, `${id}:Spanish derivation`);
    for (const prerequisiteId of lesson.prerequisiteLessonIds ?? []) {
      assert.ok(academyLessons.some((candidate) => candidate.id === prerequisiteId), `${id}:${prerequisiteId}`);
    }
  }
});

test("legacy stochastic-pricing routes resolve to canonical deep lessons", () => {
  assert.equal(findAcademyLessonForRoute("foundations", "random-variables")?.id, "foundation-distributions");
  assert.equal(findAcademyLessonForRoute("foundations", "brownian-motion")?.id, "foundation-brownian-ito");
  assert.equal(findAcademyLessonForRoute("foundations", "it-calculus")?.id, "foundation-brownian-ito");
  assert.equal(findAcademyLessonForRoute("foundations", "risk-neutral-pricing")?.id, "foundation-gbm-dynamics");
  assert.equal(findAcademyLessonForRoute("equity", "black-scholes")?.id, "foundation-black-scholes");
});

test("advanced lessons no longer repeat generic prerequisite placeholders", () => {
  const advanced = academyLessons.filter((lesson) => ["foundations", "numerical-finance", "risk", "xva"].includes(lesson.domain));
  assert.ok(advanced.length > 16);
  for (const lesson of advanced) {
    assert.notDeepEqual(lesson.prerequisites, ["Probability and calculus", "Discounting and no-arbitrage"], lesson.id);
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
    const legalSource = findSourceRecord(source.legalSourceId);
    assert.ok(legalSource, `${source.id}: missing legal registry record`);
    assert.equal(source.legalSourceId, source.id);
    assert.match(legalSource.authorOrOwner, new RegExp(source.author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(";")[0], "i"));
    assert.equal(legalSource.publicSourceUrl, source.url);
    assert.equal(legalSource.decision, "REFERENCE_ONLY");
    assert.ok(source.license.length > 0);
    assert.match(source.url, /^https:\/\//);
    assert.match(source.licenseUrl, /^https:\/\//);
  }
});

test("the textbook is registered as a research-only copyrighted reference", () => {
  const source = academySources.find((item) => item.id === "oosterlee-grzelak-2020");
  assert.ok(source);
  assert.equal(source.role, "research");
  assert.match(source.name, /Mathematical Modeling and Computation in Finance/);
  assert.match(source.license, /copyright/i);
  assert.match(source.usePolicy, /not copied|original prose/i);
  assert.match(source.url, /^https:\/\//);
});

test("lesson families select distinct pedagogical narratives", () => {
  const examples = new Map([
    ["foundation-filtrations", "foundation"],
    ["vol-heston", "model"],
    ["rate-swaps", "instrument"],
    ["numerical-monte-carlo", "numerical-method"],
    ["risk-exposure-profile", "risk-workflow"],
  ]);
  for (const [lessonId, expected] of examples) {
    const lesson = academyLessons.find((item) => item.id === lessonId);
    assert.ok(lesson, lessonId);
    assert.equal(academyNarrativeForLesson(lesson), expected, lessonId);
  }
  assert.equal(new Set(academyLessons.map(academyNarrativeForLesson)).size >= 5, true);
});

test("narrative section headings are authored in English and Spanish", () => {
  const foundationEn = academySectionDefinitions("foundation", "en");
  const foundationEs = academySectionDefinitions("foundation", "es");
  const modelEn = academySectionDefinitions("model", "en");
  const numericalEn = academySectionDefinitions("numerical-method", "en");
  const instrumentEn = academySectionDefinitions("instrument", "en");
  const riskEn = academySectionDefinitions("risk-workflow", "en");

  assert.equal(foundationEn.find((section) => section.id === "intuition")?.title, "Observe the object before formalizing it.");
  assert.equal(foundationEs.find((section) => section.id === "intuition")?.title, "Observa el objeto antes de formalizarlo.");
  assert.equal(modelEn.find((section) => section.id === "pricing")?.title, "Calibrate, compute, and challenge the dynamics.");
  assert.equal(numericalEn.find((section) => section.id === "interactive")?.title, "Change the error budget, not just the picture.");
  assert.equal(instrumentEn.find((section) => section.id === "market")?.title, "Start from cash flows and quotation.");
  assert.equal(riskEn.find((section) => section.id === "desk")?.title, "Turn exposure into a controlled decision.");
  assert.notDeepEqual(foundationEn.map((section) => section.title), modelEn.map((section) => section.title));
});
