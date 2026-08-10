import test from "node:test";
import assert from "node:assert/strict";
import { defaultWatchlistIds, findInstrument, instrumentCounts, instrumentMaster, mappingsFor } from "../src/market-data/instrumentMaster";
import { basisPointChange, classifyFreshness, nullableNumber, pipChange, quoteFromTick, tickDirection } from "../src/market-data/normalization";
import { MarketDataRouter } from "../src/market-data/router";
import { __test as ecb } from "../src/market-data/providers/ecb";
import { marketStateStore } from "../src/market-data/client/store";

test("instrument master has stable canonical coverage and vendor mappings", () => {
  assert.equal(instrumentMaster.length, 44);
  assert.deepEqual(instrumentCounts(), { FX: 11, EQUITY: 12, INDEX: 8, RATES: 5, COMMODITY: 6, CRYPTO: 2 });
  assert.equal(new Set(instrumentMaster.map((item) => item.id)).size, 44);
  assert.ok(mappingsFor("fx-eurusd", "ECB").length === 1);
  assert.equal(mappingsFor("crypto-btcusd", "COINBASE")[0].vendorSymbol, "BTC-USD");
  assert.equal(defaultWatchlistIds.length, 10);
});

test("normalization preserves nulls and uses asset-aware market conventions", () => {
  const eurusd = findInstrument("eurusd")!; const usdjpy = findInstrument("usdjpy")!;
  assert.equal(nullableNumber(undefined), null); assert.equal(tickDirection(.1), "UP"); assert.equal(tickDirection(-.1), "DOWN");
  assert.ok(Math.abs((pipChange(eurusd, .0012) ?? 0) - 12) < 1e-10); assert.equal(pipChange(usdjpy, .12), 12); assert.equal(basisPointChange(-.03), -3);
  assert.equal(classifyFreshness(eurusd, "LIVE", "2026-01-01T00:00:00Z", Date.parse("2026-01-01T00:00:05Z")), "FRESH");
  assert.equal(classifyFreshness(eurusd, "LIVE", "2026-01-01T00:00:00Z", Date.parse("2026-01-01T00:01:00Z")), "STALE");
});

test("tick normalization separates previous tick from session change and caps history", () => {
  const instrument = findInstrument("btcusd")!; const at = "2026-08-10T14:00:00.100Z";
  let quote = quoteFromTick(instrument, { instrumentId: instrument.id, price: 64_500, bid: 64_499, ask: 64_501, volume: 10, marketTimestamp: "2026-08-10T14:00:00.000Z", receivedTimestamp: at, source: "test" }, null, { sessionChangePct: 1 });
  for (let index = 1; index <= 140; index += 1) quote = quoteFromTick(instrument, { instrumentId: instrument.id, price: 64_500 + index, bid: null, ask: null, volume: null, marketTimestamp: at, receivedTimestamp: at, source: "test" }, quote, { sessionChangePct: 1 });
  assert.equal(quote.previousPrice, 64_639); assert.equal(quote.tickChange, 1); assert.equal(quote.sessionChangePct, 1); assert.equal(quote.history.length, 120); assert.equal(quote.status, "LIVE");
});

test("ECB CSV parser and cross-rate transformation are deterministic", () => {
  const csv = "KEY,CURRENCY,TIME_PERIOD,OBS_VALUE\nA,USD,2026-08-07,1.20\nA,USD,2026-08-10,1.25\nA,GBP,2026-08-10,0.80";
  const parsed = ecb.parseCsv(csv); assert.equal(parsed.get("USD")?.at(-1)?.value, 1.25);
  const instrument = findInstrument("gbpusd")!; const cross = ecb.fxSeries(instrument, parsed);
  assert.deepEqual(cross, [{ date: "2026-08-10", value: 1.5625 }]);
});

test("router marks unsupported modes unavailable and demo mode explicit", async () => {
  const router = new MarketDataRouter();
  const unavailable = await router.getQuotes({ instrumentIds: ["eq-aapl"], mode: "LIVE_STREAM", provider: "COINBASE", licensingMode: "PRIVATE_BETA" });
  assert.equal(unavailable[0].status, "OFFLINE"); assert.equal(unavailable[0].price, null);
  const demo = await router.getQuotes({ instrumentIds: ["eq-aapl"], mode: "LIVE_SNAPSHOT", provider: "DEMO", licensingMode: "PUBLIC_DEMO" });
  assert.equal(demo[0].status, "DEMO"); assert.match(demo[0].source, /frozen/i);
});

test("router enforces all deployment licensing modes", () => {
  const router = new MarketDataRouter();
  for (const licensingMode of ["LOCAL_DEVELOPMENT", "PRIVATE_BETA"] as const) assert.equal(router.resolveProvider("crypto-btcusd", { instrumentIds: ["crypto-btcusd"], mode: "LIVE_STREAM", provider: "AUTO", licensingMode }), "COINBASE");
  for (const licensingMode of ["PUBLIC_DEMO", "PUBLIC_PRODUCTION"] as const) assert.equal(router.resolveProvider("crypto-btcusd", { instrumentIds: ["crypto-btcusd"], mode: "LIVE_STREAM", provider: "AUTO", licensingMode }), "DEMO");
  for (const licensingMode of ["LOCAL_DEVELOPMENT", "PRIVATE_BETA", "PUBLIC_DEMO", "PUBLIC_PRODUCTION"] as const) assert.equal(router.resolveProvider("fx-eurusd", { instrumentIds: ["fx-eurusd"], mode: "END_OF_DAY", provider: "AUTO", licensingMode }), "ECB");
});

test("per-instrument store updates only subscribed rows within a 50-symbol budget", async () => {
  const ids = [...instrumentMaster.map((item) => item.id), ...Array.from({ length: 6 }, (_, index) => `reserved-${index}`)]; let notifications = 0; const unsubscribe = ids.map((id) => marketStateStore.subscribe(id, () => { notifications += 1; }));
  const router = new MarketDataRouter(); const snapshot = await router.snapshot({ instrumentIds: instrumentMaster.map((item) => item.id), mode: "LIVE_SNAPSHOT", provider: "DEMO", licensingMode: "PUBLIC_DEMO" });
  const started = performance.now(); marketStateStore.applySnapshot(snapshot); const elapsed = performance.now() - started;
  unsubscribe.forEach((stop) => stop()); assert.equal(notifications, instrumentMaster.length); assert.ok(elapsed < 100, `store update took ${elapsed.toFixed(2)}ms`);
});
