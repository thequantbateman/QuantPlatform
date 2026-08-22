"use client";

import { pick, useI18n } from "@/src/i18n";
import type {
  MarketMakingBookValuation,
  MarketMakingTrade,
} from "@/src/quant/market-making/types";

export function MarketMakingBlotter({
  trades,
  valuation,
}: {
  trades: readonly MarketMakingTrade[];
  valuation: MarketMakingBookValuation;
}) {
  const { locale, formatNumber } = useI18n();
  const money = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <section className="mm-blotter" aria-labelledby="mm-blotter-title">
    <header>
      <div><h3 id="mm-blotter-title">{pick(locale, { en: "Dealer blotter", es: "Blotter del dealer" })}</h3><p>{pick(locale, { en: "Every row is signed from the dealer perspective.", es: "Cada fila lleva el signo desde la perspectiva del dealer." })}</p></div>
      <span>{trades.length} {pick(locale, { en: "trades", es: "operaciones" })}</span>
    </header>
    <div className="mm-table-scroll">
      <table aria-label={pick(locale, { en: "Dealer blotter", es: "Blotter del dealer" })}>
        <thead><tr>
          <th scope="col">{pick(locale, { en: "Source", es: "Origen" })}</th>
          <th scope="col">{pick(locale, { en: "Underlying", es: "Subyacente" })}</th>
          <th scope="col">{pick(locale, { en: "Instrument", es: "Instrumento" })}</th>
          <th scope="col">{pick(locale, { en: "Client side", es: "Lado cliente" })}</th>
          <th scope="col">{pick(locale, { en: "Dealer side", es: "Lado dealer" })}</th>
          <th scope="col">{pick(locale, { en: "Quantity", es: "Cantidad" })}</th>
          <th scope="col">{pick(locale, { en: "Reference", es: "Referencia" })}</th>
          <th scope="col">{pick(locale, { en: "Execution", es: "Ejecución" })}</th>
          <th scope="col">Delta</th>
          <th scope="col">Vega</th>
          <th scope="col">P&amp;L</th>
        </tr></thead>
        <tbody>{trades.map((trade) => {
          const value = valuation.trades.find((candidate) => candidate.tradeId === trade.id);
          const clientSide = trade.source === "client"
            ? trade.dealerDirection === "short" ? pick(locale, { en: "Buy", es: "Compra" }) : pick(locale, { en: "Sell", es: "Venta" })
            : "—";
          const instrument = trade.instrument === "option"
            ? `${trade.optionType.toUpperCase()} · K ${trade.strike.toFixed(2)} · T ${trade.maturity.toFixed(2)}`
            : pick(locale, { en: "Underlying hedge", es: "Cobertura de subyacente" });
          return <tr key={trade.id}>
            <td><span className={`mm-source ${trade.source}`}>{trade.source === "client" ? pick(locale, { en: "CLIENT", es: "CLIENTE" }) : pick(locale, { en: "HEDGE", es: "COBERTURA" })}</span></td>
            <td>{trade.underlyingId.toUpperCase()}</td>
            <td><strong>{instrument}</strong></td>
            <td>{clientSide}</td>
            <td>{trade.dealerDirection === "long" ? pick(locale, { en: "Long", es: "Largo" }) : pick(locale, { en: "Short", es: "Corto" })}</td>
            <td>{formatNumber(trade.quantity * trade.multiplier, { maximumFractionDigits: 2 })}</td>
            <td>{money(trade.referencePrice)}</td>
            <td>{money(trade.executionPrice)}</td>
            <td>{value ? money(value.greeks.delta) : "—"}</td>
            <td>{value ? money(value.greeks.vega) : "—"}</td>
            <td className={(value?.unrealizedPnl ?? 0) >= 0 ? "positive" : "negative"}>{value ? money(value.unrealizedPnl) : "—"}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </section>;
}
