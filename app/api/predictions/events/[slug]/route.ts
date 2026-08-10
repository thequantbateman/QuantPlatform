import { getPredictionEvent } from "@/src/polymarket/client";
import { persistPredictionDiscovery } from "@/src/polymarket/repository";

type Context = { params: Promise<{ slug: string }> };
export async function GET(_request: Request, { params }: Context) {
  try { const event = await getPredictionEvent((await params).slug); if (!event) return Response.json({ error: "Prediction event not found" }, { status: 404 }); const persistence = await persistPredictionDiscovery([event]).catch(() => ({ persistent: false, rows: 0 })); return Response.json({ event, persistence, source: "Polymarket Gamma API", receivedAt: new Date().toISOString() }, { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Event unavailable" }, { status: 503 }); }
}
