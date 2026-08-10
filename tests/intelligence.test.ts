import test from "node:test";
import assert from "node:assert/strict";
import { marketIntelligenceMetrics, quoteMoveLabel, realizedVolatility, returnPercent } from "../src/data/marketMetrics";
import { normalizeGammaEvents } from "../src/data/polymarket";

test("market metrics compute deterministic returns and range", () => {
  const values = [100, 101, 99, 102, 103, 104, 105]; const metrics = marketIntelligenceMetrics(values);
  assert.equal(returnPercent(values, 1), (105 / 104 - 1) * 100);
  assert.equal(metrics.rangePosition, 1);
  assert.ok(metrics.zScore20D !== null && metrics.zScore20D > 0);
  assert.ok(realizedVolatility(values) !== null);
  assert.equal(quoteMoveLabel("FX", 0.0012), "+12.0 pips");
  assert.equal(quoteMoveLabel("IR", -0.03), "-3.0 bp");
});

test("Gamma normalization preserves probability lineage without inventing values", () => {
  const markets = normalizeGammaEvents([{ id: "e1", title: "Will CPI fall?", category: "Economy", updatedAt: "2026-01-01T00:00:00Z", markets: [{ id: "m1", question: "Will CPI fall?", outcomes: '["Yes","No"]', outcomePrices: '["0.63","0.37"]', clobTokenIds: '["yes-token","no-token"]', volume: "1200", liquidity: "450" }] }]);
  assert.equal(markets.length, 1); assert.equal(markets[0].probability, 0.63); assert.equal(markets[0].tokenId, "yes-token"); assert.equal(markets[0].volume, 1200);
  assert.deepEqual(normalizeGammaEvents([{ id: "e", markets: [{ id: "m", outcomes: "[]", outcomePrices: "[]" }] }]), []);
});
