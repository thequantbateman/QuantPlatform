import assert from "node:assert/strict";
import test from "node:test";
import { classifySourceUse, validateSourceRecord } from "../src/licensing/policy";
import { findSourceRecord, sourceRegistry } from "../src/licensing/registry";

test("unknown documents are research-only and attempted reuse is blocked", () => {
  assert.equal(classifySourceUse({ category: "unknown", actions: ["research", "independent-synthesis"] }).decision, "REFERENCE_ONLY");
  assert.equal(classifySourceUse({ category: "unknown", actions: ["embed-asset"] }).decision, "BLOCKED_UNCLEAR");
});

test("verified permissive code requires central attribution when reused", () => {
  const result = classifySourceUse({
    category: "permissive-code",
    licenseId: "BSD-3-Clause",
    evidence: "https://example.test/LICENSE",
    actions: ["adapt-code"],
  });
  assert.equal(result.decision, "SAFE_WITH_ATTRIBUTION");
  assert.equal(result.attributionPlacement, "CENTRAL_NOTICE");
  assert.deepEqual(result.prohibitedActions, []);
});

test("verified CC BY display requires inline TASL attribution", () => {
  const result = classifySourceUse({
    category: "creative-commons-attribution",
    licenseId: "CC-BY-4.0",
    evidence: "https://creativecommons.org/licenses/by/4.0/",
    title: "Chart",
    authorOrOwner: "Author",
    publicSourceUrl: "https://example.test/chart",
    actions: ["embed-asset"],
  });
  assert.equal(result.decision, "SAFE_WITH_ATTRIBUTION");
  assert.equal(result.attributionPlacement, "INLINE");
});

test("incomplete CC attribution fails closed", () => {
  const result = classifySourceUse({
    category: "creative-commons-attribution",
    licenseId: "CC-BY-4.0",
    evidence: "https://creativecommons.org/licenses/by/4.0/",
    actions: ["embed-asset"],
  });
  assert.equal(result.decision, "BLOCKED_UNCLEAR");
});

test("verified public-domain material needs no legal attribution", () => {
  const result = classifySourceUse({
    category: "public-domain",
    licenseId: "CC0-1.0",
    evidence: "https://creativecommons.org/publicdomain/zero/1.0/",
    actions: ["embed-asset", "public-display"],
  });
  assert.equal(result.decision, "SAFE_TO_REUSE");
  assert.equal(result.attributionPlacement, "NONE");
});

test("existing Academy source IDs resolve to valid legal records", () => {
  const expectedIds = [
    "oosterlee-grzelak-2020",
    "grzelak-computational-finance",
    "grzelak-ir-xva",
    "grzelak-quantlib-fork",
    "quantlib-upstream",
  ];
  for (const id of expectedIds) assert.ok(findSourceRecord(id), id);
  assert.equal(new Set(sourceRegistry.map((source) => source.id)).size, sourceRegistry.length);
  for (const source of sourceRegistry) assert.deepEqual(validateSourceRecord(source), [], source.id);
});

test("registry validation rejects private paths and unsafe manual upgrades", () => {
  const source = findSourceRecord("oosterlee-grzelak-2020");
  assert.ok(source);
  assert.ok(validateSourceRecord({ ...source, evidence: "/Users/person/private/permission.pdf" }).some((failure) => failure.includes("private or absolute")));
  assert.ok(validateSourceRecord({ ...source, decision: "SAFE_TO_REUSE" }).some((failure) => failure.includes("policy result REFERENCE_ONLY")));
});
