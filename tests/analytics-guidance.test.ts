import assert from "node:assert/strict";
import test from "node:test";
import { academyLessons } from "../src/content/academy/catalog";
import {
  analyticsScenarios,
  scenariosForLab,
  type AnalyticsLabId,
} from "../src/analytics/guidance/scenarios";
import { serializeAnalyticsContext } from "../src/analytics/guidance/context";
import { resolveAnalyticsInsight } from "../src/analytics/guidance/insights";
import type { MarketMakingMissionId } from "../src/quant/market-making/missions";
import type { VolSurfaceScenario } from "../src/quant/volatility/volSurface";

const LAB_IDS: readonly AnalyticsLabId[] = [
  "vanilla",
  "black-scholes",
  "greeks",
  "volatility-surface",
  "yield-curve",
  "portfolio",
  "strategies",
  "market-making",
];

test("guided Analytics catalog is complete, bilingual and unique", () => {
  assert.equal(analyticsScenarios.length, 26);
  assert.equal(new Set(analyticsScenarios.map(({ id }) => id)).size, analyticsScenarios.length);
  assert.deepEqual(new Set(analyticsScenarios.map(({ labId }) => labId)), new Set(LAB_IDS));
  for (const scenario of analyticsScenarios) {
    for (const field of ["name", "description", "learningObjective", "expectedObservation", "explanation", "modelBoundary"] as const) {
      assert.ok(scenario[field].en.trim(), `${scenario.id}.${field}.en`);
      assert.ok(scenario[field].es.trim(), `${scenario.id}.${field}.es`);
    }
    assert.ok(scenario.suggestedInteractions.length > 0, scenario.id);
    assert.ok(scenario.suggestedInteractions.every(({ en, es }) => en.trim() && es.trim()), scenario.id);
    for (const value of Object.values(scenario.initialInputs)) {
      if (typeof value === "number") assert.ok(Number.isFinite(value), scenario.id);
    }
  }
});

test("guided scenarios connect only to canonical Academy routes", () => {
  const canonicalRoutes = new Set(academyLessons.map((lesson) => `/learn/${lesson.domain}/${lesson.slug}`));
  for (const scenario of analyticsScenarios) {
    if (scenario.academyHref) assert.ok(canonicalRoutes.has(scenario.academyHref), `${scenario.id}: ${scenario.academyHref}`);
  }
});

test("surface guidance reuses all canonical scenario identifiers", () => {
  const expected: readonly VolSurfaceScenario[] = ["base", "spot-crash", "vol-spike", "term-inversion", "skew-steepening", "normalization"];
  assert.deepEqual(scenariosForLab("volatility-surface").map(({ sourceId }) => sourceId), expected);
});

test("market-making guidance reuses typed mission identifiers", () => {
  const expected: readonly MarketMakingMissionId[] = ["client-flow", "delta-discipline", "cross-effects"];
  assert.deepEqual(scenariosForLab("market-making").map(({ sourceId }) => sourceId), expected);
});

test("routine parameter edits do not create assistant chatter", () => {
  assert.equal(resolveAnalyticsInsight({
    labId: "greeks",
    kind: "parameter-edited",
    inputs: { spot: 101 },
    metrics: { gamma: 0.02 },
    timestamp: 1,
  }), null);
});

test("scenario and risk events produce deterministic priorities and keys", () => {
  const loaded = resolveAnalyticsInsight({
    labId: "portfolio",
    kind: "scenario-loaded",
    scenarioId: "portfolio-delta-neutral",
    inputs: { spot: 100 },
    metrics: { delta: 0.1, gamma: 12.2 },
    timestamp: 2,
  });
  const warning = resolveAnalyticsInsight({
    labId: "portfolio",
    kind: "invalid-state",
    inputs: { spot: -1 },
    metrics: {},
    timestamp: 3,
  });
  assert.equal(loaded?.priority, "low");
  assert.equal(loaded?.dedupeKey, "portfolio:scenario-loaded:portfolio-delta-neutral");
  assert.equal(warning?.priority, "high");
  assert.equal(warning?.state, "warning");
});

test("assistant Analytics context is bounded and strips unsupported values", () => {
  const value = serializeAnalyticsContext({
    labId: "portfolio",
    scenarioId: "portfolio-delta-neutral",
    model: "Black-Scholes",
    inputs: Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`i${index}`, index === 3 ? Number.NaN : index])),
    metrics: Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`m${index}`, index])),
    positions: Array.from({ length: 100 }, () => ({ secret: "discard" })),
  } as never);
  assert.equal(value.labId, "portfolio");
  assert.equal(value.scenarioId, "portfolio-delta-neutral");
  assert.equal(Object.keys(value.inputs).length, 12);
  assert.equal(Object.keys(value.metrics).length, 12);
  assert.ok(!Object.values(value.inputs).some((entry) => typeof entry === "number" && !Number.isFinite(entry)));
  assert.ok(!("positions" in value));
});

