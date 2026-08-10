"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { InstrumentId, MarketDataMode, MarketQuote, MarketSnapshot, ProviderHealth, ProviderId } from "../domain";
import { coinbaseStreamingClient } from "./coinbaseStream";
import { marketStateStore } from "./store";

const requests = new Map<string, Promise<MarketSnapshot>>();
async function loadSnapshot(ids: InstrumentId[], mode: MarketDataMode, provider: ProviderId, asOf?: string): Promise<MarketSnapshot> { const params = new URLSearchParams({ ids: ids.join(","), mode, provider }); if (asOf) params.set("asOf", asOf); const key = params.toString(); let request = requests.get(key); if (!request) { request = fetch(`/api/markets/snapshot?${params}`, { cache: "no-store" }).then(async (response) => { const payload = await response.json() as MarketSnapshot & { error?: string }; if (!response.ok) throw new Error(payload.error || "Market snapshot unavailable"); marketStateStore.applySnapshot(payload); return payload; }).finally(() => window.setTimeout(() => requests.delete(key), 750)); requests.set(key, request); } return request; }

export function useMarketQuote(instrumentId: InstrumentId): MarketQuote | undefined { return useSyncExternalStore((listener) => marketStateStore.subscribe(instrumentId, listener), () => marketStateStore.getQuote(instrumentId), () => undefined); }
export function useProviderHealth(): ProviderHealth { return useSyncExternalStore(marketStateStore.subscribeHealth, marketStateStore.getHealth, marketStateStore.getHealth); }
export function useMarketSnapshot(instrumentIds: InstrumentId[], mode: MarketDataMode, provider: ProviderId = "AUTO", asOf?: string): { snapshot: MarketSnapshot | null; loading: boolean; error: string } {
  const stableIds = useMemo(() => [...new Set(instrumentIds)].sort(), [instrumentIds]); const key = stableIds.join(","); const [state, setState] = useState<{ snapshot: MarketSnapshot | null; loading: boolean; error: string }>({ snapshot: null, loading: true, error: "" });
  useEffect(() => { let active = true; let unwatch = () => {}; loadSnapshot(stableIds, mode, provider, asOf).then((snapshot) => { if (!active) return; setState({ snapshot, loading: false, error: "" }); if (snapshot.streamingAllowed && mode === "LIVE_STREAM") unwatch = coinbaseStreamingClient.watch(stableIds); }).catch((error) => active && setState({ snapshot: null, loading: false, error: error instanceof Error ? error.message : "Market data unavailable" })); const freshness = window.setInterval(() => marketStateStore.refreshFreshness(), 2_000); return () => { active = false; unwatch(); window.clearInterval(freshness); }; }, [key, mode, provider, asOf, stableIds]);
  return state;
}
