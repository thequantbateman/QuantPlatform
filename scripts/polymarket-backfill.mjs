const base = process.env.TQB_BASE_URL || "http://localhost:3000";
const pages = Math.min(10, Math.max(1, Number(process.env.POLYMARKET_BACKFILL_PAGES || 2)));
const markets = [];
for (let page = 0; page < pages; page += 1) {
  const response = await fetch(`${base}/api/predictions/events?limit=100&offset=${page * 100}&order=volume&include=full`);
  if (!response.ok) throw new Error(`Discovery page ${page} returned ${response.status}`);
  const payload = await response.json(); markets.push(...(payload.markets || []));
  process.stdout.write(`discovery page ${page + 1}/${pages}: ${payload.events?.length || 0} events\n`);
}
const unique = [...new Map(markets.map((market) => [market.id, market])).values()];
const maxMarkets = Math.min(100, Math.max(1, Number(process.env.POLYMARKET_BACKFILL_MARKETS || 25)));
let points = 0;
for (const market of unique.slice(0, maxMarkets)) {
  const outcome = market.outcomes?.[market.primaryOutcomeIndex || 0]; if (!outcome?.tokenId) continue;
  const response = await fetch(`${base}/api/predictions/markets/${outcome.tokenId}/history?range=all`);
  if (!response.ok) { process.stdout.write(`skip ${market.id}: ${response.status}\n`); continue; }
  const payload = await response.json(); points += payload.points?.length || 0;
  process.stdout.write(`${market.id}: ${payload.points?.length || 0} observations · ${payload.origin}\n`);
}
process.stdout.write(`backfill complete: ${unique.length} markets discovered, ${points} observations handled\n`);
