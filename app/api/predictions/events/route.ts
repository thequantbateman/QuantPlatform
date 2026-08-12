import { compactPredictionDiscovery, discoverPredictionEvents } from "@/src/polymarket/client";
import { persistPredictionDiscovery } from "@/src/polymarket/repository";
import { reportServerError } from "@/src/server/observability";

export async function GET(request: Request) {
  const url = new URL(request.url); const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 40) || 40)); const offset = Math.min(10_000, Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0)); const query = url.searchParams.get("q")?.trim().slice(0, 100) || undefined; const tagId = url.searchParams.get("tag")?.trim().slice(0, 80) || undefined; const orderValue = url.searchParams.get("order"); const order = ["volume", "liquidity", "volume24hr", "updatedAt"].includes(orderValue ?? "") ? orderValue as "volume" | "liquidity" | "volume24hr" | "updatedAt" : "volume";
  try { const discovery = await discoverPredictionEvents({ limit, offset, query, tagId, order }); const snapshot = compactPredictionDiscovery(discovery); const persistence = await persistPredictionDiscovery(snapshot.events).catch(() => ({ persistent: false, rows: 0 })); const response = url.searchParams.get("include") === "full" ? discovery : snapshot; return Response.json({ ...response, persistence }, { headers: { "cache-control": query ? "no-store" : "public, max-age=45, stale-while-revalidate=180" } }); }
  catch (error) { reportServerError("prediction-events", error); return Response.json({ error: "Events unavailable" }, { status: 503 }); }
}
