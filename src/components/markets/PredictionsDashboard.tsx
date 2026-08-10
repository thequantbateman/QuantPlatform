"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from "react";
import { LineChart } from "@/src/components/charts/LineChart";
import type { PredictionMarket } from "@/src/data/polymarket";
import { pick, useI18n } from "@/src/i18n";

type Payload = { source: string; status: string; receivedAt: string; markets: PredictionMarket[]; error?: string };
const compact = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function PredictionsDashboard({ compactView = false }: { compactView?: boolean }) {
  const { locale } = useI18n(); const [payload, setPayload] = useState<Payload | null>(null); const [error, setError] = useState("");
  useEffect(() => { const controller = new AbortController(); fetch("/api/predictions", { signal: controller.signal }).then(async (response) => { const data = await response.json() as Payload; if (!response.ok) throw new Error(data.error || "Unavailable"); setPayload(data); }).catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); }); return () => controller.abort(); }, []);
  if (error) return <div className="prediction-state"><span>POLYMARKET · UNAVAILABLE</span><p>{pick(locale, { en: "Public prediction data could not be loaded. No probabilities were fabricated.", es: "No se pudieron cargar los datos públicos. No se han inventado probabilidades." })}</p><small>{error}</small></div>;
  if (!payload) return <div className="prediction-state"><span>POLYMARKET · READ ONLY</span><p>{pick(locale, { en: "Loading public probabilities…", es: "Cargando probabilidades públicas…" })}</p></div>;
  const markets = payload.markets.slice(0, compactView ? 4 : 12); const featured = markets[0];
  return <section className={compactView ? "predictions predictions-compact" : "predictions section-shell"}>
    {!compactView && <header className="page-hero compact-hero predictions-hero"><div><span className="eyebrow">PREDICTION MARKETS · PUBLIC READ ONLY</span><h1>{pick(locale, { en: <>MARKET-IMPLIED<br /><em>PROBABILITY.</em></>, es: <>PROBABILIDAD<br /><em>IMPLÍCITA.</em></> })}</h1><p>{pick(locale, { en: "Observed prices from Polymarket’s public APIs. No wallet, trading controls or investment recommendations.", es: "Precios observados en las APIs públicas de Polymarket. Sin cartera, operativa ni recomendaciones." })}</p></div><DataState payload={payload} /></header>}
    {compactView && <div className="module-head"><div><span className="eyebrow">PUBLIC PREDICTIONS · READ ONLY</span><h2>{pick(locale, { en: "Probability board", es: "Panel de probabilidades" })}</h2></div><a href="/markets/predictions">{pick(locale, { en: "Open dashboard", es: "Abrir panel" })} →</a></div>}
    {featured?.history.length > 1 && !compactView && <article className="prediction-history"><div><span className="eyebrow">FEATURED PATH</span><h2>{featured.question}</h2><p>{Math.round((featured.probability ?? 0) * 100)}% · {pick(locale, { en: "latest market-implied probability", es: "última probabilidad implícita" })}</p></div><LineChart x={featured.history.map((point) => point.timestamp)} series={[{ name: "Probability", values: featured.history.map((point) => point.probability * 100) }]} xLabel="Time" yLabel="Probability %" height={190} /></article>}
    <div className="prediction-grid">{markets.map((market) => <article className="prediction-card" key={market.id}><header><span>{market.category || "EVENT"}</span><b>{market.probability === null ? "—" : `${Math.round(market.probability * 100)}%`}</b></header><h3>{market.question}</h3><dl><div><dt>VOLUME</dt><dd>${compact(market.volume)}</dd></div><div><dt>LIQUIDITY</dt><dd>${compact(market.liquidity)}</dd></div></dl><footer><span>{new Date(market.updatedAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}</span><b>OBSERVED · NOT FORECAST</b></footer></article>)}</div>
    {!compactView && <aside className="probability-note"><span>HOW TO READ THIS</span><p>{pick(locale, { en: "A 63% YES price is the market’s current risk-neutral-ish trading coordinate after fees, liquidity and participant beliefs—not a calibrated real-world forecast and not certainty.", es: "Un precio YES del 63% es la coordenada de negociación actual tras comisiones, liquidez y creencias; no es una previsión calibrada ni certeza." })}</p><a href="/learn/foundations/prediction-market-probabilities">{pick(locale, { en: "Learn probability semantics", es: "Aprender semántica de probabilidad" })} →</a></aside>}
  </section>;
}

function DataState({ payload }: { payload: Payload }) { return <aside className="data-passport"><span>DATA PASSPORT</span><dl><dt>STATUS</dt><dd>{payload.status.replaceAll("_", " ")}</dd><dt>SOURCE</dt><dd>{payload.source}</dd><dt>RECEIVED</dt><dd>{new Date(payload.receivedAt).toISOString()}</dd></dl><small>Public, read-only observations. Trading intentionally excluded.</small></aside>; }
