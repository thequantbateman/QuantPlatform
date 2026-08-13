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
