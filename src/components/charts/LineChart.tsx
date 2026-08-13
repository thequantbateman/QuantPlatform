"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  chartSeriesPattern,
  createStableDomain,
  moveChartIndex,
  nearestChartIndex,
  normalizeChartIndex,
  validateChartData,
  type ChartSeries,
} from "./chartModel";

export type Series = ChartSeries;

export interface LineChartProps {
  x: readonly number[];
  series: readonly Series[];
  xLabel: string;
  yLabel: string;
  height?: number;
  description?: string;
  xFormatter?: (value: number) => string;
  yFormatter?: (value: number) => string;
  showTable?: boolean;
}

type Hover = { left: number; top: number };

const defaultFormatter = (value: number): string => {
  if (Math.abs(value) >= 10) return value.toFixed(1);
  if (Math.abs(value) >= 0.01) return value.toFixed(3);
  return value.toExponential(2);
};

export function LineChart({
  x,
  series,
  xLabel,
  yLabel,
  height = 260,
  description,
  xFormatter = defaultFormatter,
  yFormatter = defaultFormatter,
  showTable = false,
}: LineChartProps) {
  validateChartData(x, series);
  const xDomain = createStableDomain(x);
  const yDomain = createStableDomain(series.flatMap((item) => item.values));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<() => void>(() => undefined);
  const selectedIndexRef = useRef(0);
  const [selectedXValue, setSelectedXValue] = useState(x[0]);
  const [hover, setHover] = useState<Hover | null>(null);
  const captionId = useId();
  const descriptionId = useId();
  const readoutId = useId();
  const chartDescription = description ?? `${series.map((item) => item.name).join(", ")} across ${xLabel}.`;
  const selectedIndex = nearestChartIndex(x, selectedXValue);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const style = getComputedStyle(canvas);
      const token = (name: string, fallback: string): string => style.getPropertyValue(name).trim() || style.getPropertyValue(fallback).trim();
      const ink = token("--chart-ink", "--ink");
      const muted = token("--chart-muted", "--muted");
      const grid = token("--chart-grid", "--border");
      const colors = [token("--chart-series-1", "--accent"), token("--chart-series-2", "--gold"), token("--chart-series-3", "--positive"), token("--chart-series-4", "--negative")];
      const seriesColor = (color: string | undefined, index: number): string => color ? (color.startsWith("--") ? token(color, "--chart-series-1") : color) : colors[index % colors.length];
      const width = rect.width;
      const canvasHeight = rect.height;
      const pad = { left: 58, right: 16, top: 18, bottom: 40 };
      const plotWidth = Math.max(1, width - pad.left - pad.right);
      const plotHeight = Math.max(1, canvasHeight - pad.top - pad.bottom);
      const mapX = (value: number): number => pad.left + ((value - xDomain.min) / (xDomain.max - xDomain.min)) * plotWidth;
      const mapY = (value: number): number => pad.top + (1 - (value - yDomain.min) / (yDomain.max - yDomain.min)) * plotHeight;

      context.clearRect(0, 0, width, canvasHeight);
      context.font = "10px ui-monospace, monospace";
      context.fillStyle = muted;
      context.strokeStyle = grid;
      context.lineWidth = 1;
      context.textAlign = "left";
      for (let tick = 0; tick <= 4; tick += 1) {
        const y = pad.top + tick / 4 * plotHeight;
        const value = yDomain.max - tick / 4 * (yDomain.max - yDomain.min);
        context.beginPath();
        context.moveTo(pad.left, y);
        context.lineTo(width - pad.right, y);
        context.stroke();
        context.fillText(yFormatter(value), 4, y + 4);
      }
      context.textAlign = "center";
      for (let tick = 0; tick <= 2; tick += 1) {
        const value = xDomain.min + tick / 2 * (xDomain.max - xDomain.min);
        context.fillText(xFormatter(value), mapX(value), canvasHeight - 22);
      }
      if (yDomain.min < 0 && yDomain.max > 0) {
        const zero = mapY(0);
        context.strokeStyle = muted;
        context.setLineDash([4, 4]);
        context.beginPath();
        context.moveTo(pad.left, zero);
        context.lineTo(width - pad.right, zero);
        context.stroke();
        context.setLineDash([]);
      }
      series.forEach((item, index) => {
        context.beginPath();
        context.lineWidth = index === 0 ? 2.2 : 1.6;
        context.strokeStyle = seriesColor(item.color, index);
        context.setLineDash(chartSeriesPattern(index));
        item.values.forEach((value, pointIndex) => {
          const px = mapX(x[pointIndex]);
          const py = mapY(value);
          if (pointIndex === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        });
        context.stroke();
      });
      context.setLineDash([]);

      const current = normalizeChartIndex(selectedIndexRef.current, x.length);
      const selectedX = mapX(x[current]);
      context.strokeStyle = muted;
      context.setLineDash([3, 3]);
      context.beginPath();
      context.moveTo(selectedX, pad.top);
      context.lineTo(selectedX, canvasHeight - pad.bottom);
      context.stroke();
      context.setLineDash([]);
      series.forEach((item, index) => {
        context.beginPath();
        context.arc(selectedX, mapY(item.values[current]), 3.5, 0, Math.PI * 2);
        context.fillStyle = seriesColor(item.color, index);
        context.fill();
        context.strokeStyle = ink;
        context.stroke();
      });

      context.fillStyle = ink;
      context.textAlign = "center";
      context.fillText(xLabel, pad.left + plotWidth / 2, canvasHeight - 5);
      context.save();
      context.translate(12, pad.top + plotHeight / 2);
      context.rotate(-Math.PI / 2);
      context.fillText(yLabel, 0, 0);
      context.restore();
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ratioX = Math.max(0, Math.min(1, (event.clientX - rect.left - 58) / Math.max(1, rect.width - 74)));
      const target = xDomain.min + ratioX * (xDomain.max - xDomain.min);
      const index = nearestChartIndex(x, target);
      selectedIndexRef.current = index;
      setSelectedXValue(x[index]);
      setHover({
        left: Math.max(8, Math.min(rect.width - 155, event.clientX - rect.left + 10)),
        top: Math.max(8, event.clientY - rect.top - 38),
      });
      draw();
    };
    const onLeave = () => setHover(null);

    drawRef.current = draw;
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      drawRef.current = () => undefined;
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [series, x, xDomain.max, xDomain.min, xFormatter, xLabel, yDomain.max, yDomain.min, yFormatter, yLabel]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    drawRef.current();
  }, [selectedIndex]);

  const selectIndex = (index: number): void => {
    selectedIndexRef.current = index;
    setSelectedXValue(x[index]);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>): void => {
    let next: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = moveChartIndex(selectedIndexRef.current, x.length, -1);
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = moveChartIndex(selectedIndexRef.current, x.length, 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = x.length - 1;
    if (next === null) return;
    event.preventDefault();
    selectIndex(next);
  };
  const selectedText = `${xLabel}: ${xFormatter(x[selectedIndex])}. ${series.map((item) => `${item.name}: ${yFormatter(item.values[selectedIndex])}`).join(". ")}.`;

  return <figure className="line-chart-figure" aria-labelledby={captionId} aria-describedby={`${descriptionId} ${readoutId}`}>
    <figcaption><strong id={captionId}>{yLabel} by {xLabel}</strong><p id={descriptionId}>{chartDescription}</p></figcaption>
    <ul className="line-chart-legend" aria-label="Series legend">{series.map((item, index) => <li key={item.name}><i className={`line-chart-key line-chart-key-${index % 4}`} style={item.color ? { "--series-color": item.color.startsWith("--") ? `var(${item.color})` : item.color } as React.CSSProperties : undefined}>{index + 1}</i><span>{item.name}</span></li>)}</ul>
    <div className="line-chart-wrap">
      <canvas
        ref={canvasRef}
        className="line-chart"
        style={{ height }}
        role="slider"
        tabIndex={0}
        aria-label={`Inspect ${yLabel} plotted against ${xLabel}`}
        aria-valuemin={0}
        aria-valuemax={x.length - 1}
        aria-valuenow={selectedIndex}
        aria-valuetext={selectedText}
        onKeyDown={onKeyDown}
      />
      {hover && <div className="line-tooltip" style={{ left: hover.left, top: hover.top }}><b>{xLabel}: {xFormatter(x[selectedIndex])}</b>{series.map((item) => <span key={item.name}>{item.name}: {yFormatter(item.values[selectedIndex])}</span>)}</div>}
    </div>
    <output id={readoutId} className="line-chart-readout" aria-live="polite">{selectedText}</output>
    <p className="line-chart-help">Use Left/Right or Up/Down arrows to inspect values; Home and End jump to the bounds.</p>
    {showTable && <details className="line-chart-table"><summary>View chart data</summary><div><table><caption>{yLabel} by {xLabel}</caption><thead><tr><th scope="col">{xLabel}</th>{series.map((item) => <th scope="col" key={item.name}>{item.name}</th>)}</tr></thead><tbody>{x.map((value, index) => <tr key={`${value}-${index}`}><th scope="row">{xFormatter(value)}</th>{series.map((item) => <td key={item.name}>{yFormatter(item.values[index])}</td>)}</tr>)}</tbody></table></div></details>}
  </figure>;
}
