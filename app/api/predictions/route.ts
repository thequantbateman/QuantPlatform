import { compactPredictionDiscovery, discoverPredictionEvents } from "@/src/polymarket/client";
import { persistPredictionDiscovery, predictionCoverage } from "@/src/polymarket/repository";

export async function GET(request: Request) {
  const url = new URL(request.url); const query = url.searchParams.get("q")?.trim() || undefined; const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  try {
    const discovery = await discoverPredictionEvents({ query, limit, order: "volume" });
    const persistence = await persistPredictionDiscovery(discovery.events).catch((error: unknown) => ({ persistent: false, rows: 0, error: error instanceof Error ? error.message : "Persistence unavailable" }));
    const coverage = await predictionCoverage().catch(() => null);
    return Response.json({ ...compactPredictionDiscovery(discovery), status: "LIVE_PUBLIC_READ_ONLY", persistence, coverage }, { headers: { "cache-control": query ? "no-store" : "public, max-age=45, stale-while-revalidate=180" } });
  } catch (error) { return Response.json({ source: "Polymarket public APIs", status: "UNAVAILABLE", receivedAt: new Date().toISOString(), events: [], markets: [], error: error instanceof Error ? error.message : "Prediction data unavailable" }, { status: 503, headers: { "cache-control": "no-store" } }); }
}
