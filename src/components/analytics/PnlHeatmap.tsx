"use client";

import type { CSSProperties } from "react";
import { useI18n } from "@/src/i18n";
import type { SpotVolPnlGrid } from "@/src/quant/portfolio/scenarios";

export function PnlHeatmap({
  grid,
  selected,
  onSelect,
}: {
  grid: SpotVolPnlGrid;
  selected: { row: number; column: number };
  onSelect: (cell: { row: number; column: number }) => void;
}) {
  const { locale, t, formatNumber } = useI18n();
  const maximumAbsolute = Math.max(
    ...grid.points.flat().map((point) => Math.abs(point.pnl)),
    1e-12,
  );
  return (
    <section className="analytics-pnl-heatmap" aria-label={t("analytics.pnl.matrix")}>
      <div className="pnl-heatmap-grid" style={{ "--columns": grid.spots.length } as CSSProperties}>
        <span className="pnl-corner">{t("analytics.pnl.volBySpot")}</span>
        {grid.spots.map((spot) => <span className="pnl-axis" key={spot}>S {formatNumber(spot)}</span>)}
        {grid.points.map((row, rowIndex) => (
          <div className="pnl-heatmap-row" key={grid.volatilities[rowIndex]}>
            <span className="pnl-axis">{formatNumber(grid.volatilities[rowIndex], { style: "percent", maximumFractionDigits: 1 })}</span>
            {row.map((point, columnIndex) => {
              const active = selected.row === rowIndex && selected.column === columnIndex;
              const intensity = Math.abs(point.pnl) / maximumAbsolute;
              const label = locale === "es"
                ? `Spot ${formatNumber(point.spot)}, volatilidad ${formatNumber(point.volatility, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 })}, P&L ${formatNumber(point.pnl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `Spot ${formatNumber(point.spot)}, volatility ${formatNumber(point.volatility, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 })}, P&L ${formatNumber(point.pnl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              return (
                <button
                  type="button"
                  key={`${point.spot}-${point.volatility}`}
                  className={point.pnl >= 0 ? "positive" : "negative"}
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => onSelect({ row: rowIndex, column: columnIndex })}
                  style={{ "--heat": intensity } as CSSProperties}
                >
                  {formatNumber(point.pnl, { maximumFractionDigits: 0 })}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <details className="analytics-numeric-table">
        <summary>{t("analytics.pnl.numericMatrix")}</summary>
        <div>
          <table>
            <thead><tr><th>{t("analytics.market.volatility")}</th>{grid.spots.map((spot) => <th key={spot}>{formatNumber(spot)}</th>)}</tr></thead>
            <tbody>
              {grid.points.map((row, rowIndex) => (
                <tr key={grid.volatilities[rowIndex]}>
                  <th>{formatNumber(grid.volatilities[rowIndex], { style: "percent", maximumFractionDigits: 1 })}</th>
                  {row.map((point) => <td key={`${point.spot}-${point.volatility}`}>{formatNumber(point.pnl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
