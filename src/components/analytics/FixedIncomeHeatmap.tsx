"use client";

import { pick, useI18n } from "@/src/i18n";
import type { CSSProperties } from "react";
import type { RateSpreadPnlGrid } from "@/src/quant/fixed-income/risk";

export interface FixedIncomeHeatmapSelection {
  row: number;
  column: number;
}

export function FixedIncomeHeatmap({
  grid,
  selected,
  onSelect,
}: {
  grid: RateSpreadPnlGrid;
  selected: FixedIncomeHeatmapSelection;
  onSelect: (selection: FixedIncomeHeatmapSelection) => void;
}) {
  const { formatNumber, locale } = useI18n();
  const extent = Math.max(0.0001, ...grid.points.flat().map((point) => Math.abs(point.pnl)));
  const money = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return <div className="fixed-income-heatmap">
    <div className="fixed-income-heatmap-axis fixed-income-heatmap-y">{pick(locale, { en: "Credit spread shift (bps)", es: "Shock de spread de crédito (pb)" })}</div>
    <div className="fixed-income-heatmap-grid" style={{ gridTemplateColumns: `56px repeat(${grid.rateShiftsBps.length}, minmax(52px, 1fr))` }}>
      <span aria-hidden="true" />
      {grid.rateShiftsBps.map((rate) => <b key={`rate-${rate}`}>{rate > 0 ? "+" : ""}{rate}</b>)}
      {grid.points.flatMap((row, rowIndex) => [
        <b key={`spread-${grid.spreadShiftsBps[rowIndex]}`}>{grid.spreadShiftsBps[rowIndex] > 0 ? "+" : ""}{grid.spreadShiftsBps[rowIndex]}</b>,
        ...row.map((point, column) => {
          const intensity = Math.min(1, Math.abs(point.pnl) / extent);
          const isSelected = selected.row === rowIndex && selected.column === column;
          return <button
            type="button"
            key={`${point.spreadShiftBps}-${point.rateShiftBps}`}
            data-sign={point.pnl >= 0 ? "positive" : "negative"}
            aria-pressed={isSelected}
            aria-label={pick(locale, {
              en: `Benchmark shift ${point.rateShiftBps} bps, credit spread shift ${point.spreadShiftBps} bps, new bond price ${money(point.newPrice)}, P&L ${money(point.pnl)}`,
              es: `Shock benchmark ${point.rateShiftBps} pb, shock de spread de crédito ${point.spreadShiftBps} pb, nuevo precio ${money(point.newPrice)}, P&L ${money(point.pnl)}`,
            })}
            onClick={() => onSelect({ row: rowIndex, column })}
            style={{ "--heat-intensity": intensity } as CSSProperties}
          >{point.pnl > 0 ? "+" : ""}{money(point.pnl)}</button>;
        }),
      ])}
    </div>
    <div className="fixed-income-heatmap-axis fixed-income-heatmap-x">{pick(locale, { en: "Benchmark rate shift (bps)", es: "Shock de tipo benchmark (pb)" })}</div>
    <details>
      <summary>{pick(locale, { en: "Accessible numeric P&L matrix", es: "Matriz numérica accesible de P&L" })}</summary>
      <div className="fixed-income-table-wrap"><table>
        <thead><tr><th>{pick(locale, { en: "Credit \\ Rate", es: "Crédito \\ Tipos" })}</th>{grid.rateShiftsBps.map((rate) => <th key={rate}>{rate}bp</th>)}</tr></thead>
        <tbody>{grid.points.map((row, rowIndex) => <tr key={grid.spreadShiftsBps[rowIndex]}><th>{grid.spreadShiftsBps[rowIndex]}bp</th>{row.map((point) => <td key={point.rateShiftBps}>{money(point.pnl)}</td>)}</tr>)}</tbody>
      </table></div>
    </details>
  </div>;
}
