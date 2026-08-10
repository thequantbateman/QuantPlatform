import test from "node:test";
import assert from "node:assert/strict";
import { marketIntelligenceMetrics, quoteMoveLabel, realizedVolatility, returnPercent } from "../src/data/marketMetrics";
import { normalizeGammaEvents } from "../src/data/polymarket";
import { PredictionBookState, buildBook } from "../src/polymarket/book";
import { curatedLinksForEvent } from "../src/polymarket/crossAsset";

test("market metrics compute deterministic returns and range", () => {
  const values = [100, 101, 99, 102, 103, 104, 105]; const metrics = marketIntelligenceMetrics(values);
  assert.equal(returnPercent(values, 1), (105 / 104 - 1) * 100);
  assert.equal(metrics.rangePosition, 1);
  assert.ok(metrics.zScore20D !== null && metrics.zScore20D > 0);
  assert.ok(realizedVolatility(values) !== null);
  assert.equal(quoteMoveLabel("FX", 0.0012), "+12.0 pips");
  assert.equal(quoteMoveLabel("IR", -0.03), "-3.0 bp");
});

test("prediction L2 state derives top of book, depth and rejects out-of-order patches", () => {
  const state = new PredictionBookState(new Map([["token-1", "market-1"]]));
  const initial = state.apply({ event_type: "book", market: "market-1", asset_id: "token-1", timestamp: "2000", bids: [{ price: "0.49", size: "10" }, { price: "0.48", size: "20" }], asks: [{ price: "0.51", size: "12" }, { price: "0.52", size: "8" }] });
  assert.equal(initial.length, 2); assert.equal(state.get("token-1")?.bestBid, 0.49); assert.equal(state.get("token-1")?.bestAsk, 0.51); assert.equal(state.get("token-1")?.mid, 0.5); assert.equal(state.get("token-1")?.bidDepth, 30);
  const change = state.apply({ event_type: "price_change", market: "market-1", timestamp: "3000", price_changes: [{ asset_id: "token-1", side: "BUY", price: "0.50", size: "5", best_bid: "0.50", best_ask: "0.51" }] });
  assert.equal(change.length, 2); assert.equal(state.get("token-1")?.bestBid, 0.5);
  assert.deepEqual(state.apply({ event_type: "book", market: "market-1", asset_id: "token-1", timestamp: "2500", bids: [], asks: [] }), []);
  assert.deepEqual(state.apply({ event_type: "last_trade_price", market: "market-1", asset_id: "token-1", timestamp: "2500", price: "0.5", size: "1" }), []);
  assert.equal(state.get("token-1")?.bestBid, 0.5); assert.equal(state.isStale("token-1", 3_040_001, 40_000), true);
  const book = buildBook("m", "t", [{ price: .4, size: 2 }], [{ price: .6, size: 6 }]); assert.equal(book.imbalance, -.5);
});

test("cross-asset links are deterministic and never AI-invented", () => {
  assert.equal(curatedLinksForEvent("Will Bitcoin trade above $200k?")[0].instrument.id, "crypto-btcusd");
  assert.deepEqual(curatedLinksForEvent("Who wins the local chess tournament?"), []);
});

test("Gamma normalization preserves probability lineage without inventing values", () => {
  const events = normalizeGammaEvents([{ id: "e1", slug: "cpi", title: "Will CPI fall?", category: "Economy", updatedAt: "2026-01-01T00:00:00Z", active: true, markets: [{ id: "m1", conditionId: "c1", slug: "cpi-fall", question: "Will CPI fall?", outcomes: '["Yes","No"]', outcomePrices: '["0.63","0.37"]', clobTokenIds: '["yes-token","no-token"]', volume: "1200", liquidity: "450", active: true }] }]);
  assert.equal(events.length, 1); const market = events[0].markets[0]; assert.equal(market.probability, 0.63); assert.equal(market.outcomes[0].tokenId, "yes-token"); assert.equal(market.volume, 1200); assert.equal(market.eventId, "e1");
  assert.equal(normalizeGammaEvents([{ id: "e", markets: [{ id: "m", outcomes: "[]", outcomePrices: "[]" }] }])[0].markets.length, 0);
});
