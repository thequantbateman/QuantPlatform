import { compactPredictionDiscovery, discoverPredictionEvents } from "@/src/polymarket/client";
import { persistPredictionDiscovery, predictionCoverage } from "@/src/polymarket/repository";
import { reportServerError } from "@/src/server/observability";

export async function GET(request: Request) {
  const url = new URL(request.url); const query = url.searchParams.get("q")?.trim().slice(0, 100) || undefined; const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  try {
    const discovery = await discoverPredictionEvents({ query, limit, order: "volume" }); const snapshot = compactPredictionDiscovery(discovery);
    const persistence = await persistPredictionDiscovery(snapshot.events).catch(() => ({ persistent: false, rows: 0, error: "Persistence unavailable" }));
    const coverage = await predictionCoverage().catch(() => null);
    return Response.json({ ...snapshot, status: "LIVE_PUBLIC_READ_ONLY", persistence, coverage }, { headers: { "cache-control": query ? "no-store" : "public, max-age=45, stale-while-revalidate=180" } });
  } catch (error) { reportServerError("predictions", error); return Response.json({ source: "Polymarket public APIs", status: "UNAVAILABLE", receivedAt: new Date().toISOString(), events: [], markets: [], error: "Prediction data unavailable" }, { status: 503, headers: { "cache-control": "no-store" } }); }
}
