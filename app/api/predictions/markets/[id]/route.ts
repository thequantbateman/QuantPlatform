import { getPredictionMarket } from "@/src/polymarket/client";
import { reportServerError } from "@/src/server/observability";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { const market = await getPredictionMarket((await params).id); return market ? Response.json({ market, source: "Polymarket Gamma API", receivedAt: new Date().toISOString() }) : Response.json({ error: "Market not found" }, { status: 404 }); } catch (error) { reportServerError("prediction-market", error); return Response.json({ error: "Market unavailable" }, { status: 503 }); } }
