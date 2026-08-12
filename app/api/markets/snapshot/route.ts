import { instrumentMaster } from "@/src/market-data/instrumentMaster";
import { marketDataModes, providerIds, type MarketDataMode, type ProviderId } from "@/src/market-data/domain";
import { licensingModeFromEnv, MarketDataRouter } from "@/src/market-data/router";
import { unavailableQuote } from "@/src/market-data/normalization";
import { reportServerError } from "@/src/server/observability";

export async function GET(request: Request) {
  const url = new URL(request.url); const ids = (url.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 50); const requestedIds = ids.length ? ids : instrumentMaster.slice(0, 20).map((instrument) => instrument.id); const mode = url.searchParams.get("mode") as MarketDataMode | null; const provider = url.searchParams.get("provider") as ProviderId | null; const asOf = url.searchParams.get("asOf") ?? undefined;
  if (mode && !marketDataModes.includes(mode)) return Response.json({ error: "Unsupported market-data mode" }, { status: 400 });
  if (provider && !providerIds.includes(provider)) return Response.json({ error: "Unsupported provider" }, { status: 400 });
  if (asOf && !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(asOf)) return Response.json({ error: "asOf must use ISO date/time" }, { status: 400 });
  if (mode === "HISTORICAL" && process.env.ENABLE_HISTORICAL_MODE === "false") return Response.json({ error: "Historical market mode is disabled" }, { status: 403 });
  if (mode && mode !== "LIVE_STREAM" && process.env.ENABLE_MARKET_SNAPSHOTS === "false") return Response.json({ error: "Market snapshots are disabled" }, { status: 403 });
  if (provider && provider !== "AUTO" && process.env.ENABLE_PROVIDER_SWITCHER === "false") return Response.json({ error: "Provider switching is disabled" }, { status: 403 });
  const router = new MarketDataRouter(); const cryptoDisabled = process.env.ENABLE_CRYPTO_MARKETS === "false"; const enabledIds = cryptoDisabled ? requestedIds.filter((id) => instrumentMaster.find((item) => item.id === id)?.assetClass !== "CRYPTO") : requestedIds;
  try { const resolvedMode = mode ?? "LIVE_STREAM"; const snapshot = await router.snapshot({ instrumentIds: enabledIds, mode: resolvedMode, provider: provider ?? "AUTO", asOf, licensingMode: licensingModeFromEnv(process.env) }); if (cryptoDisabled) for (const id of requestedIds.filter((item) => !enabledIds.includes(item))) { const instrument = instrumentMaster.find((item) => item.id === id); if (instrument) snapshot.quotes.push(unavailableQuote(instrument, resolvedMode, "Crypto markets are disabled by deployment policy.")); } snapshot.quotes.sort((left, right) => requestedIds.indexOf(left.instrumentId) - requestedIds.indexOf(right.instrumentId)); if (process.env.ENABLE_STREAMING_MARKETS === "false") snapshot.streamingAllowed = false; return Response.json(snapshot, { headers: { "cache-control": snapshot.mode === "LIVE_STREAM" ? "no-store" : "public, max-age=180, stale-while-revalidate=600" } }); }
  catch (error) { reportServerError("market-snapshot", error); return Response.json({ error: "Market snapshot unavailable" }, { status: 503, headers: { "cache-control": "no-store" } }); }
}
