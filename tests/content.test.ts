import test from "node:test";
import assert from "node:assert/strict";
import { contentCatalog, findContent } from "../src/content/catalog";
import { localizeEntry } from "../src/content/localization";

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
