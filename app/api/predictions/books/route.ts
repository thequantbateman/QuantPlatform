import { getPredictionBooks } from "@/src/polymarket/client";
import type { PredictionLivePatch } from "@/src/polymarket/domain";
import { persistLivePatches } from "@/src/polymarket/repository";
import { reportServerError } from "@/src/server/observability";

export async function GET(request: Request) {
  const url = new URL(request.url); const rawTokens = (url.searchParams.get("tokens") ?? "").split(","); const rawMarkets = (url.searchParams.get("markets") ?? "").split(",");
  const subscriptions = rawTokens.flatMap((tokenId, index) => /^\d{20,90}$/.test(tokenId) ? [{ tokenId, marketId: rawMarkets[index]?.slice(0, 180) || "" }] : []).slice(0, 30);
  if (!subscriptions.length) return Response.json({ error: "At least one valid outcome token is required" }, { status: 400 });
  try {
    const marketByToken = new Map(subscriptions.map((item) => [item.tokenId, item.marketId])); const books = (await getPredictionBooks(subscriptions.map((item) => item.tokenId))).map((book) => ({ ...book, marketId: marketByToken.get(book.tokenId) || book.marketId }));
    const patches: PredictionLivePatch[] = books.flatMap((book) => [{ type: "book", book }, { type: "quote", marketId: book.marketId, tokenId: book.tokenId, bid: book.bestBid, ask: book.bestAsk, mid: book.mid, spread: book.spread, last: null, observedAt: book.observedAt, sourceEvent: "rest_book_poll" }]);
    const persistence = await persistLivePatches(patches).catch(() => ({ persistent: false, rows: 0 }));
    return Response.json({ books, persistence, source: "Polymarket CLOB batch books", receivedAt: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch (error) { reportServerError("prediction-books", error); return Response.json({ error: "Order books unavailable" }, { status: 503 }); }
}
