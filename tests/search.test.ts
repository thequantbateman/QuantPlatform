import test from "node:test";
import assert from "node:assert/strict";
import { createAcademySearchItems } from "../src/content/academy/search";
import { academyLessons, academyTracks } from "../src/content/academy/catalog";
import {
  createCoreSearchItems,
  mergeSearchItems,
  normalizeSearchText,
  searchPlatformItems,
  suggestPlatformItems,
  type PlatformSearchItem,
} from "../src/content/search";

test("Academy search index contains every canonical lesson and track", () => {
  const items = createAcademySearchItems("en");

  assert.equal(items.filter((item) => item.kind === "lesson").length, academyLessons.length);
  assert.equal(items.filter((item) => item.kind === "track").length, academyTracks.length);
  assert.equal(items.length, academyLessons.length + academyTracks.length);
  assert.equal(new Set(items.map((item) => item.href)).size, items.length);
});

test("Academy ranking finds exact concepts in English and Spanish", () => {
  const english = createAcademySearchItems("en");
  const spanish = createAcademySearchItems("es");

  assert.equal(searchPlatformItems(english, "Girsanov")[0]?.href, "/learn/foundations/girsanov-risk-neutral-pricing");
  assert.equal(searchPlatformItems(spanish, "esperanza condicional")[0]?.href, "/learn/foundations/conditional-expectations-martingales");
  assert.ok(searchPlatformItems(spanish, "valoracion").some((item) => normalizeSearchText(`${item.title} ${item.description}`).includes("valoracion")));
  assert.equal(normalizeSearchText("  Valoración—opción  "), "valoracion opcion");
});

test("merged search deduplicates canonical routes and prefers Academy records", () => {
  const merged = mergeSearchItems(createCoreSearchItems("en"), createAcademySearchItems("en"));
  const discountFactors = merged.filter((item) => item.href === "/learn/rates/discount-factors");

  assert.equal(discountFactors.length, 1);
  assert.equal(discountFactors[0]?.source, "academy");
  assert.equal(discountFactors[0]?.title, "Discount factors and present value");
});

test("empty-query suggestions are deterministic and diverse", () => {
  const items = mergeSearchItems(createCoreSearchItems("en"), createAcademySearchItems("en"));
  const first = suggestPlatformItems(items, 8);
  const second = suggestPlatformItems(items, 8);

  assert.deepEqual(second, first);
  assert.equal(first.length, 8);
  assert.ok(new Set(first.slice(0, 5).map((item) => item.kind)).size >= 4);
  assert.deepEqual(searchPlatformItems(items, "", { limit: 8 }), first);
});

test("search limits results and preserves input order for equal relevance", () => {
  const fixtures: PlatformSearchItem[] = ["first", "second", "third"].map((id) => ({
    id,
    source: "core",
    kind: "tool",
    title: "Alpha",
    description: "Same ranked result",
    meta: "TEST",
    href: `/${id}`,
    keywords: ["alpha"],
  }));

  assert.deepEqual(searchPlatformItems(fixtures, "alpha", { limit: 2 }).map((item) => item.id), ["first", "second"]);
  assert.deepEqual(searchPlatformItems(fixtures, "alpha", { limit: 0 }), []);
});

test("core search indexes portfolio and strategy analytics once", () => {
  const items = createCoreSearchItems("en");
  assert.equal(items.filter((item) => item.href === "/analytics/portfolio").length, 1);
  assert.equal(items.filter((item) => item.href === "/analytics/strategies").length, 1);
  assert.equal(searchPlatformItems(items, "delta gamma hedge", { limit: 5 })[0]?.href, "/analytics/portfolio");
  assert.equal(searchPlatformItems(items, "iron condor payoff", { limit: 5 })[0]?.href, "/analytics/strategies");
});
