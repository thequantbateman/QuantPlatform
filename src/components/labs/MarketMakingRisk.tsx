"use client";

import { pick, useI18n } from "@/src/i18n";
import type { MarketMakingHigherOrderDiagnostics } from "@/src/quant/market-making/diagnostics";
import type {
  MarketMakingBookValuation,
  MarketMakingTrade,
} from "@/src/quant/market-making/types";

const greekKeys = ["delta", "gamma", "vega", "theta", "rho"] as const;

export function MarketMakingRisk({
  valuation,
  trades,
  selectedUnderlyingId,
  diagnostics,
}: {
  valuation: MarketMakingBookValuation;
  trades: readonly MarketMakingTrade[];
  selectedUnderlyingId: string;
  diagnostics: MarketMakingHigherOrderDiagnostics;
}) {
  const { locale, formatNumber } = useI18n();
  const number = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const selected = valuation.byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId);
  const topology = trades.flatMap((trade) => {
    if (trade.underlyingId !== selectedUnderlyingId || trade.instrument !== "option") return [];
    const value = valuation.trades.find((candidate) => candidate.tradeId === trade.id);
    return [{ id: trade.id, strike: trade.strike, maturity: trade.maturity, vega: value?.greeks.vega ?? 0 }];
  });
  const maxVega = Math.max(1, ...topology.map((point) => Math.abs(point.vega)));

  return <div className="mm-risk-workspace">
    <section className="mm-risk-monitor" aria-labelledby="mm-risk-title">
      <header><div><h3 id="mm-risk-title">{pick(locale, { en: "Book risk", es: "Riesgo del libro" })}</h3><p>{pick(locale, { en: "Risk is aggregated per underlying before any portfolio total is shown.", es: "El riesgo se agrega primero por subyacente antes de mostrar totales." })}</p></div><span>{pick(locale, { en: "DESK UNITS", es: "UNIDADES DE MESA" })}</span></header>
      <div className="mm-table-scroll"><table aria-label={pick(locale, { en: "Market-maker risk by underlying", es: "Riesgo de market maker por subyacente" })}>
        <thead><tr><th scope="col">{pick(locale, { en: "Underlying", es: "Subyacente" })}</th><th scope="col">PV</th>{greekKeys.map((key) => <th scope="col" key={key}>{key.toUpperCase()}</th>)}<th scope="col">P&amp;L</th></tr></thead>
        <tbody>{valuation.byUnderlying.map((book) => <tr key={book.underlyingId} className={book.underlyingId === selectedUnderlyingId ? "selected" : ""}><th scope="row">{book.label}</th><td>{number(book.modelValue)}</td>{greekKeys.map((key) => <td key={key}>{number(book.greeks[key])}</td>)}<td className={book.unrealizedPnl >= 0 ? "positive" : "negative"}>{number(book.unrealizedPnl)}</td></tr>)}</tbody>
      </table></div>
      <p className="mm-unit-note">{pick(locale, { en: "Delta: per one spot unit · Gamma: delta change per spot unit · Vega: per one volatility point · Theta: per day · Rho: per 100bp. Delta and gamma from different underlyings are not interchangeable hedge units.", es: "Delta: por una unidad de spot · Gamma: cambio de delta por unidad de spot · Vega: por un punto de volatilidad · Theta: por día · Rho: por 100 pb. Delta y gamma de subyacentes distintos no son unidades de cobertura intercambiables." })}</p>
    </section>

    <section className="mm-topology" aria-labelledby="mm-topology-title">
      <header><div><h3 id="mm-topology-title">{pick(locale, { en: "Vega topology", es: "Topología de vega" })}</h3><p>{pick(locale, { en: "Signed option vega by strike and maturity for the selected underlying.", es: "Vega con signo por strike y vencimiento del subyacente seleccionado." })}</p></div><span>{selected?.label ?? selectedUnderlyingId}</span></header>
      <div className="mm-topology-grid" role="list" aria-label={pick(locale, { en: "Vega topology values", es: "Valores de topología de vega" })}>
        {topology.map((point) => <div role="listitem" key={point.id} style={{ "--mm-risk-intensity": Math.min(1, Math.abs(point.vega) / maxVega) } as React.CSSProperties} className={point.vega >= 0 ? "positive" : "negative"}><span>K {point.strike.toFixed(2)}</span><strong>{number(point.vega)}</strong><small>T {point.maturity.toFixed(2)}</small></div>)}
        {topology.length === 0 && <p>{pick(locale, { en: "No option risk for this underlying.", es: "No hay riesgo de opciones para este subyacente." })}</p>}
      </div>
      <details><summary>{pick(locale, { en: "Accessible numeric vega topology", es: "Topología numérica accesible de vega" })}</summary><div className="mm-table-scroll"><table><thead><tr><th scope="col">Strike</th><th scope="col">{pick(locale, { en: "Maturity", es: "Vencimiento" })}</th><th scope="col">Vega / 1 vol pt</th></tr></thead><tbody>{topology.map((point) => <tr key={point.id}><td>{point.strike.toFixed(2)}</td><td>{point.maturity.toFixed(2)}</td><td>{number(point.vega)}</td></tr>)}</tbody></table></div></details>
    </section>

    <section className="mm-higher-order" aria-labelledby="mm-higher-order-title">
      <header><div><h3 id="mm-higher-order-title">{pick(locale, { en: "Cross-Greek diagnostics", es: "Diagnóstico de griegas cruzadas" })}</h3><p>{pick(locale, { en: "Finite differences from the same price and Greek authority—not a second model.", es: "Diferencias finitas desde la misma autoridad de precio y griegas, no un segundo modelo." })}</p></div>{diagnostics.boundarySensitive && <span className="warning">{pick(locale, { en: "BOUNDARY-SENSITIVE", es: "SENSIBLE A FRONTERA" })}</span>}</header>
      <dl>{[
        ["Vanna", diagnostics.vanna, pick(locale, { en: "Δ Delta / 1 vol point", es: "Δ Delta / 1 punto de vol" })],
        ["Volga", diagnostics.volga, pick(locale, { en: "Δ Vega / 1 vol point", es: "Δ Vega / 1 punto de vol" })],
        ["Charm", diagnostics.charm, pick(locale, { en: "Δ Delta / day", es: "Δ Delta / día" })],
        ["Color", diagnostics.color, pick(locale, { en: "Δ Gamma / day", es: "Δ Gamma / día" })],
        ["Veta", diagnostics.veta, pick(locale, { en: "Δ Vega / day", es: "Δ Vega / día" })],
      ].map(([label, value, unit]) => <div key={String(label)}><dt>{label}<small>{unit}</small></dt><dd>{number(Number(value))}</dd></div>)}</dl>
    </section>
  </div>;
}
