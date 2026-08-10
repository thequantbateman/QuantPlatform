const base = process.env.TQB_BASE_URL || "http://localhost:3000";
const seconds = Math.min(300, Math.max(5, Number(process.env.POLYMARKET_INGEST_SECONDS || 30)));
const discovery = await fetch(`${base}/api/predictions?limit=40`).then((response) => { if (!response.ok) throw new Error(`Discovery returned ${response.status}`); return response.json(); });
const selected = (discovery.markets || []).filter((market) => market.acceptingOrders && market.outcomes?.[market.primaryOutcomeIndex || 0]?.tokenId).slice(0, 20);
if (!selected.length) throw new Error("No streamable public outcome tokens were discovered");
const tokens = selected.map((market) => market.outcomes[market.primaryOutcomeIndex || 0].tokenId).join(","); const marketIds = selected.map((market) => market.id).join(","); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), seconds * 1_000);
let patches = 0; let bytes = 0;
try {
  const response = await fetch(`${base}/api/predictions/live?tokens=${tokens}&markets=${marketIds}`, { signal: controller.signal }); if (!response.ok || !response.body) throw new Error(`Stream returned ${response.status}`); const reader = response.body.getReader();
  while (true) { const result = await reader.read(); if (result.done) break; bytes += result.value.byteLength; patches += new TextDecoder().decode(result.value).split("event: patch").length - 1; }
} catch (error) { if (error.name !== "AbortError") throw error; } finally { clearTimeout(timer); }
process.stdout.write(`ingestion complete: ${selected.length} markets, ${patches} normalized patches, ${bytes} bytes over ${seconds}s\n`);
