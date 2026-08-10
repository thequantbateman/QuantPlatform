"use client";

import { defaultWatchlistIds, findInstrument, mappingsFor } from "@/src/market-data/instrumentMaster";
import { useMarketQuote, useMarketSnapshot, useProviderHealth } from "@/src/market-data/client/hooks";

export function MarketDataDebug() {
  const health = useProviderHealth(); useMarketSnapshot(defaultWatchlistIds, "LIVE_STREAM");
  return <div className="market-debug section-shell"><header><span className="eyebrow">DEVELOPER-ONLY · SANITIZED</span><h1>MARKET DATA DEBUG</h1><p>Normalized fields and transport state. Credentials and raw vendor payloads are intentionally excluded.</p><dl><dt>TRANSPORT</dt><dd>{health.state}</dd><dt>SUBSCRIPTIONS</dt><dd>{health.subscriptionCount}</dd><dt>LAST ERROR</dt><dd>{health.lastError ?? "none"}</dd></dl></header><div className="market-debug-grid">{defaultWatchlistIds.map((id) => <DebugRow id={id} key={id} />)}</div></div>;
}

function DebugRow({ id }: { id: string }) { const instrument = findInstrument(id); const quote = useMarketQuote(id); if (!instrument) return null; const mappings = mappingsFor(id); return <article><header><strong>{instrument.symbol}</strong><span>{quote?.provider ?? "WAITING"}</span></header><dl><dt>CANONICAL ID</dt><dd>{instrument.id}</dd><dt>VENDOR SYMBOLS</dt><dd>{mappings.map((item) => `${item.provider}:${item.vendorSymbol}`).join(" · ")}</dd><dt>STATUS</dt><dd>{quote?.status ?? "WAITING"} · {quote?.freshness ?? "OFFLINE"}</dd><dt>MARKET TIME</dt><dd>{quote?.marketTimestamp ?? "unavailable"}</dd><dt>RECEIVED</dt><dd>{quote?.receivedTimestamp ?? "unavailable"}</dd><dt>QUOTE AGE BAND</dt><dd>{quote?.freshness ?? "n/a"}</dd><dt>LATENCY</dt><dd>{quote?.latencyMs === null || quote?.latencyMs === undefined ? "not supplied" : `${quote.latencyMs} ms`}</dd><dt>NORMALIZED</dt><dd>last={quote?.price ?? "null"} bid={quote?.bid ?? "null"} ask={quote?.ask ?? "null"} session={quote?.sessionChangePct ?? "null"}</dd></dl></article>; }
