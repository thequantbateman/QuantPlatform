import { getPredictionHistory } from "@/src/polymarket/client";
import { persistPredictionHistory, readPredictionHistory } from "@/src/polymarket/repository";
import { reportServerError } from "@/src/server/observability";

const lookback: Record<string, number> = { "1h": 3_600_000, "1d": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000, all: Number.MAX_SAFE_INTEGER };
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  const tokenId = (await params).id; const range = new URL(request.url).searchParams.get("range") ?? "7d"; if (!/^\d{20,90}$/.test(tokenId) || !(range in lookback)) return Response.json({ error: "Invalid token or range" }, { status: 400 });
  try {
    const from = range === "all" ? 0 : Date.now() - lookback[range]; const stored = await readPredictionHistory(tokenId, from, range).catch(() => []); const needsBackfill = stored.length < 3 || (stored.at(-1)?.timestamp ?? 0) < Date.now() - 300_000;
    const live = needsBackfill ? await getPredictionHistory(tokenId, range) : []; const points = live.length ? live : stored; const persistence = live.length ? await persistPredictionHistory(tokenId, live, range).catch(() => ({ persistent: false, rows: 0 })) : { persistent: true, rows: 0 };
    return Response.json({ tokenId, range, points, origin: stored.length && !live.length ? "D1" : "Polymarket CLOB backfill", persistence }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=240" } });
  } catch (error) { reportServerError("prediction-history", error); return Response.json({ error: "History unavailable" }, { status: 503 }); }
}
