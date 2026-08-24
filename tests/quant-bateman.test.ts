import assert from "node:assert/strict";
import test from "node:test";
import { quantBatemanAssets, resolveQuantBatemanAsset } from "../src/components/quant-bateman/quantBateman.assets";
import { quantBatemanConfig, quantBatemanStateLabels } from "../src/components/quant-bateman/quantBateman.config";
import type { QuantBatemanState } from "../src/components/quant-bateman/quantBateman.types";
import { nextAnalyticsDelivery } from "../src/analytics/guidance/delivery";
import type { AnalyticsInsight } from "../src/analytics/guidance/types";

const insight = (priority: AnalyticsInsight["priority"], dedupeKey: string): AnalyticsInsight => ({
  labId: "portfolio",
  priority,
  dedupeKey,
  state: priority === "high" ? "warning" : "talking",
  title: { en: "Title", es: "Título" },
  message: { en: "Message", es: "Mensaje" },
  contextSummary: { en: "Context", es: "Contexto" },
});

test("canonical state map keeps dark pinstripe default and approved special poses", () => {
  assert.equal(resolveQuantBatemanAsset("idle", "default", "default"), quantBatemanAssets.idle);
  assert.equal(resolveQuantBatemanAsset("success", "default", "default"), quantBatemanAssets.success);
  assert.equal(resolveQuantBatemanAsset("easterEgg", "default", "default"), quantBatemanAssets.businessCard);
  assert.equal(resolveQuantBatemanAsset("working", "businessCard", "default"), quantBatemanAssets.businessCard);
});

test("alternate outfits are explicit overrides rather than normal random states", () => {
  assert.equal(resolveQuantBatemanAsset("success", "default", "graySuit"), quantBatemanAssets.graySuit);
  assert.equal(resolveQuantBatemanAsset("pricing", "default", "camelCoat"), quantBatemanAssets.camelCoat);
  assert.equal(resolveQuantBatemanAsset("pricing", "default", "default"), quantBatemanAssets.pricing);
});

test("every product state has text semantics and only intended states are transient", () => {
  const states: QuantBatemanState[] = ["idle", "thinking", "fetching", "working", "pricing", "talking", "success", "warning", "error", "easterEgg"];
  for (const state of states) assert.ok(quantBatemanStateLabels[state]);
  assert.ok(quantBatemanConfig.transientDurationMs.success);
  assert.ok(quantBatemanConfig.transientDurationMs.warning);
  assert.ok(quantBatemanConfig.transientDurationMs.easterEgg);
  assert.equal("error" in quantBatemanConfig.transientDurationMs, false);
});

test("Analytics delivery suppresses duplicates and protects recent higher priority guidance", () => {
  const first = nextAnalyticsDelivery(null, insight("low", "scenario-a"), 100, 4_000);
  assert.equal(first.deliver, true);

  const duplicate = nextAnalyticsDelivery(first.state, insight("low", "scenario-a"), 200, 4_000);
  assert.equal(duplicate.deliver, false);

  const warning = nextAnalyticsDelivery(first.state, insight("high", "invalid"), 300, 4_000);
  assert.equal(warning.deliver, true);

  const premature = nextAnalyticsDelivery(warning.state, insight("low", "scenario-b"), 1_000, 4_000);
  assert.equal(premature.deliver, false);

  const released = nextAnalyticsDelivery(warning.state, insight("low", "scenario-b"), 4_301, 4_000);
  assert.equal(released.deliver, true);
});
