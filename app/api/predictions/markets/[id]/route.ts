import { getPredictionMarket } from "@/src/polymarket/client";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { const market = await getPredictionMarket((await params).id); return market ? Response.json({ market, source: "Polymarket Gamma API", receivedAt: new Date().toISOString() }) : Response.json({ error: "Market not found" }, { status: 404 }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Market unavailable" }, { status: 503 }); } }
