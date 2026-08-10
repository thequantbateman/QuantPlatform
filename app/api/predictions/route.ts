import { isMacroPrediction, normalizeGammaEvents } from "@/src/data/polymarket";

const GAMMA = "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100&order=volume&ascending=false";
const HISTORY = "https://clob.polymarket.com/prices-history";

export async function GET() {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(GAMMA, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Gamma API returned ${response.status}`);
    const normalized = normalizeGammaEvents(await response.json());
    const selected = normalized.filter(isMacroPrediction).slice(0, 12);
    const featured = selected[0];
    if (featured?.tokenId) {
      try {
        const historyResponse = await fetch(`${HISTORY}?market=${encodeURIComponent(featured.tokenId)}&interval=1w&fidelity=60`, { signal: controller.signal, headers: { accept: "application/json" } });
        if (historyResponse.ok) {
          const payload = await historyResponse.json() as { history?: { t: number; p: number }[] };
          featured.history = (payload.history ?? []).filter((point) => Number.isFinite(point.t) && Number.isFinite(point.p)).map((point) => ({ timestamp: point.t, probability: point.p }));
        }
      } catch { /* The current probability remains useful if history is unavailable. */ }
    }
    return Response.json({ source: "Polymarket Gamma + CLOB public APIs", status: "LIVE_PUBLIC_READ_ONLY", receivedAt: new Date().toISOString(), markets: selected }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=240" } });
  } catch (error) {
    return Response.json({ source: "Polymarket public APIs", status: "UNAVAILABLE", receivedAt: new Date().toISOString(), markets: [], error: error instanceof Error ? error.message : "Prediction data unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  } finally { clearTimeout(timer); }
}
