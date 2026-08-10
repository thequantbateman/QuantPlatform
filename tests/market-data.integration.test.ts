import test from "node:test";
import assert from "node:assert/strict";

test("Coinbase public ticker emits a genuine BTC-USD message", { skip: process.env.MARKET_DATA_INTEGRATION_TESTS !== "true", timeout: 15_000 }, async () => {
  assert.equal(typeof WebSocket, "function");
  const message = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const socket = new WebSocket("wss://advanced-trade-ws.coinbase.com"); const timer = setTimeout(() => { socket.close(); reject(new Error("Coinbase stream timed out")); }, 12_000);
    socket.onopen = () => socket.send(JSON.stringify({ type: "subscribe", channel: "ticker", product_ids: ["BTC-USD"] }));
    socket.onerror = () => reject(new Error("Coinbase stream failed")); socket.onmessage = (event) => { const payload = JSON.parse(String(event.data)) as Record<string, unknown>; if (payload.channel !== "ticker") return; clearTimeout(timer); socket.close(); resolve(payload); };
  });
  assert.equal(message.channel, "ticker"); assert.ok(Array.isArray(message.events));
});
