import assert from "node:assert/strict";
import test from "node:test";
import { quantBatemanAssets, resolveQuantBatemanAsset } from "../src/components/quant-bateman/quantBateman.assets";
import { quantBatemanConfig, quantBatemanStateLabels } from "../src/components/quant-bateman/quantBateman.config";
import type { QuantBatemanState } from "../src/components/quant-bateman/quantBateman.types";

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
