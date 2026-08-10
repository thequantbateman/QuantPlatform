import { performance } from "node:perf_hooks";
import { PredictionBookState } from "../src/polymarket/book.ts";

const marketCount = Math.min(500, Math.max(1, Number(process.env.POLYMARKET_BENCHMARK_MARKETS || 20)));
const updates = Math.min(1_000_000, Math.max(1_000, Number(process.env.POLYMARKET_BENCHMARK_UPDATES || 100_000)));
const mappings = new Map(Array.from({ length: marketCount }, (_, index) => [`token-${index}`, `market-${index}`]));
const state = new PredictionBookState(mappings);
const beforeHeap = process.memoryUsage().heapUsed;
const startedAt = performance.now();
let patches = 0;

for (let index = 0; index < updates; index += 1) {
  const marketIndex = index % marketCount;
  const center = 0.25 + (marketIndex % 50) / 100;
  patches += state.apply({
    event_type: "price_change",
    market: `condition-${marketIndex}`,
    timestamp: 1_800_000_000_000 + index,
    price_changes: [{
      asset_id: `token-${marketIndex}`,
      side: index % 2 ? "SELL" : "BUY",
      price: Math.min(0.99, Math.max(0.01, center + (index % 2 ? 0.005 : -0.005))).toFixed(3),
      size: String(10 + index % 500),
      best_bid: (center - 0.005).toFixed(3),
      best_ask: (center + 0.005).toFixed(3),
    }],
  }).length;
}

const elapsedMs = performance.now() - startedAt;
const heapDeltaMb = (process.memoryUsage().heapUsed - beforeHeap) / 1_048_576;
process.stdout.write(`${JSON.stringify({ marketCount, updates, patches, elapsedMs: Number(elapsedMs.toFixed(2)), updatesPerSecond: Math.round(updates / (elapsedMs / 1_000)), heapDeltaMb: Number(heapDeltaMb.toFixed(2)) })}\n`);
