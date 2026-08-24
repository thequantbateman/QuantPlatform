import assert from "node:assert/strict";
import test from "node:test";
import { auditSourceRegistry } from "../src/licensing/audit";
import { renderThirdPartyNotices } from "../src/licensing/notices";
import { findSourceRecord, sourceRegistry } from "../src/licensing/registry";

test("public notices omit research-only sources and private provenance", () => {
  const output = renderThirdPartyNotices(sourceRegistry);
  assert.match(output, /No third-party source code, document assets, media, or datasets are redistributed/);
  assert.equal(output.includes("oosterlee-grzelak-2020"), false);
  assert.equal(output.includes("localFingerprint"), false);
  assert.equal(output.includes("/Users/"), false);
});

test("reused permissive code receives one deterministic central notice", () => {
  const reference = findSourceRecord("grzelak-computational-finance");
  assert.ok(reference);
  const reused = {
    ...reference,
    usageIntent: ["adapt-code"] as const,
    decision: "SAFE_WITH_ATTRIBUTION" as const,
    permittedActions: ["adapt-code"] as const,
    prohibitedActions: [] as const,
    attributionPlacement: "CENTRAL_NOTICE" as const,
    affectedPaths: ["src/vendor/example.ts"],
    copyrightNotice: "Copyright (c) 2024, leszek",
  };
  const first = renderThirdPartyNotices([reused]);
  const second = renderThirdPartyNotices([reused]);
  assert.equal(first, second);
  assert.equal(first.match(/Computational Finance Course/g)?.length, 1);
  assert.match(first, /BSD-3-Clause/);
  assert.match(first, /src\/vendor\/example\.ts/);
});

test("reference-only records cannot claim public or runtime asset paths", () => {
  const reference = findSourceRecord("oosterlee-grzelak-2020");
  assert.ok(reference);
  const result = auditSourceRegistry([{ ...reference, affectedPaths: ["public/copied-page.png"] }], { notices: renderThirdPartyNotices([reference]), existingPaths: ["public/copied-page.png"] });
  assert.ok(result.failures.some((failure) => failure.includes("REFERENCE_ONLY")));
});

test("audit detects duplicate identities, missing files, and stale notices", () => {
  const reference = findSourceRecord("quantlib-upstream");
  assert.ok(reference);
  const reused = {
    ...reference,
    usageIntent: ["adapt-code"] as const,
    decision: "SAFE_WITH_ATTRIBUTION" as const,
    permittedActions: ["adapt-code"] as const,
    prohibitedActions: [] as const,
    attributionPlacement: "CENTRAL_NOTICE" as const,
    affectedPaths: ["src/vendor/quantlib-adapter.ts"],
    copyrightNotice: "Copyright QuantLib contributors",
  };
  const result = auditSourceRegistry([reused, reused], { notices: "stale", existingPaths: [] });
  assert.ok(result.failures.some((failure) => failure.includes("duplicate source id")));
  assert.ok(result.failures.some((failure) => failure.includes("does not exist")));
  assert.ok(result.failures.some((failure) => failure.includes("stale")));
});

test("the current registry and generated notice are audit-clean", () => {
  const notices = renderThirdPartyNotices(sourceRegistry);
  assert.deepEqual(auditSourceRegistry(sourceRegistry, { notices, existingPaths: [] }), { failures: [], warnings: [] });
});
