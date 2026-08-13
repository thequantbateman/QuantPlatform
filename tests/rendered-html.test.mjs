import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(path = "/", options = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(new URL(path, "http://localhost"), {
      headers: { accept: "text/html", host: "localhost", ...(options.cookie ? { cookie: options.cookie } : {}) },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished landing page and production metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>TheQuantBateman — Quant Finance, Visually Explained<\/title>/i);
  assert.match(html, /QUANTITATIVE FINANCE/);
  assert.match(html, /MARKETS, MODELS &amp; ANALYTICS/);
  assert.match(html, /source-aware workspace/i);
  assert.match(html, /educational and research platform/i);
  assert.match(html, /http:\/\/localhost\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("renders key product routes without external services", async () => {
  for (const [path, expected] of [
    ["/lab", "Black-Scholes Playground"],
    ["/markets", "MARKET DATA WORKSTATION"],
    ["/ask", "TOOLS → SOURCES → EXPLANATION"],
    ["/research", "ACTIVE RESEARCH"],
    ["/learn/equity/black-scholes", "Build the mental model first"],
    ["/learn/foundations/girsanov-risk-neutral-pricing", "Girsanov"],
    ["/learn/rates/interest-rate-swaps", "Interest-rate swaps"],
    ["/learn/volatility/heston-model", "Heston"],
    ["/analytics/volatility", "ONE LINKED STATE"],
    ["/lab?lab=surface", "ONE LINKED STATE"],
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), new RegExp(expected, "i"), path);
  }
});

test("volatility routes render the same canonical linked surface workbench", async () => {
  for (const path of ["/analytics/volatility", "/lab?lab=surface"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();

    for (const marker of ["ONE LINKED STATE", "HEATMAP", "3D", "SMILE", "TERM STRUCTURE", "SYNTHETIC / EDUCATIONAL", "Accessible numeric surface grid"]) {
      assert.match(html, new RegExp(marker, "i"), `${path}: ${marker}`);
    }
    assert.match(html, /role="tab"[^>]*id="vol-surface-tab-heatmap"[^>]*aria-controls="vol-surface-panel-heatmap"[^>]*tabIndex="0"/i, `${path}: heatmap tab semantics`);
    assert.match(html, /role="tabpanel"[^>]*id="vol-surface-panel-heatmap"[^>]*aria-labelledby="vol-surface-tab-heatmap"/i, `${path}: heatmap panel semantics`);
    assert.match(html, /aria-pressed="true"[^>]*aria-label="Maturity/i, `${path}: selected heatmap cell`);
    assert.doesNotMatch(html, /CONSTANT σ|surface-canvas|WIREFRAME/i, path);
  }
});

test("canonical Academy lessons server-render compact formulas with bound derivations and visible essentials", async () => {
  const lessons = [
    {
      path: "/learn/foundations/girsanov-risk-neutral-pricing",
      lessonId: "foundation-girsanov",
      derivationIndex: 1,
      essentials: ["Girsanov does not remove risk", "continuous-time bridge", "Pricing identity", "MEASURE-CHANGE ENGINE"],
    },
    {
      path: "/learn/volatility/heston-model",
      lessonId: "vol-heston",
      derivationIndex: 0,
      essentials: ["Heston replaces constant volatility", "durable benchmark for exotics", "Affine characteristic function", "HESTON VARIANCE STATE"],
      formulaHref: "/analytics/volatility",
    },
    {
      path: "/learn/rates/interest-rate-swaps",
      lessonId: "rate-swaps",
      derivationIndex: 1,
      essentials: ["A vanilla swap exchanges", "core instruments for duration transfer", "Fixed-leg annuity", "Swap par/PV laboratory"],
      formulaHref: "/lab?lab=curve",
    },
  ];

  for (const lesson of lessons) {
    const response = await render(lesson.path);
    assert.equal(response.status, 200, lesson.path);
    const html = await response.text();
    const formulaAnchor = `${lesson.lessonId}-formula-${lesson.derivationIndex}`;

    assert.match(html, new RegExp(`class="quant-formula" id="${formulaAnchor}"`), lesson.path);
    assert.match(html, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/, lesson.path);
    assert.match(html, new RegExp(`<details class="quant-formula-disclosure" id="${formulaAnchor}-derivation">[\\s\\S]*?<div id="derivation" class="academy-hash-anchor"`), lesson.path);
    assert.doesNotMatch(html, new RegExp(`<details[^>]*id="${formulaAnchor}-derivation"[^>]*\\sopen(?:=|\\s|>)`), lesson.path);
    assert.doesNotMatch(html, /<section class="academy-section" id="derivation">/, lesson.path);
    assert.match(html, /href="#derivation"/, lesson.path);
    assert.match(html, /<section class="academy-section academy-section-wide" id="interactive">/, lesson.path);
    for (const essential of lesson.essentials) assert.match(html, new RegExp(essential, "i"), `${lesson.path}: ${essential}`);
    if (lesson.formulaHref) assert.match(html, new RegExp(`href="${lesson.formulaHref.replace(/[?]/g, "\\?")}"`), lesson.path);
    assert.match(html, new RegExp(`href="/ask\\?topic=[^"]+&amp;lessonId=${lesson.lessonId}&amp;section=overview"`), lesson.path);
  }
});

test("Academy landing progressively reveals all canonical track stages", async () => {
  const response = await render("/learn");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal((html.match(/<details class="academy-track-disclosure"/g) ?? []).length, 6);
  assert.equal((html.match(/class="academy-track-start"/g) ?? []).length, 6);
  assert.equal((html.match(/class="deep"/g) ?? []).length, 41);
  assert.match(html, /id="academy-catalog"/);
  const legacyDestinations = (html.match(/class="concept-card"/g) ?? []).length;
  assert.ok(legacyDestinations >= 100);
  assert.match(html, new RegExp(`<dt>Legacy concepts</dt><dd>${String(legacyDestinations).padStart(2, "0")}</dd>`));
});

test("Ask renders a compact approved Quant Bateman chat identity", async () => {
  const response = await render("/ask");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /ask-bateman-avatar empty/);
  assert.match(html, /wordmark-mark ask-character-mark/);
  assert.match(html, /characters\/quant-bateman\/web\/idle-pinstripe\.png/);
  assert.match(html, /Start with a precise question/);
  assert.doesNotMatch(html, /ask-character-stage/);
  assert.doesNotMatch(html, /class="qb-assistant"/);
});

test("starter preview is removed and project assets are present", async () => {
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", root)));
  const [packageJson, layout, agents] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("AGENTS.md", root), "utf8"),
  ]);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /"name": "thequantbateman"/);
  assert.match(layout, /og\.png/);
  assert.match(agents, /Quant calculation standards/);
  await access(new URL("public/og.png", root));
});
