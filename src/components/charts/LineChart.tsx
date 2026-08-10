"use client";

import { useEffect, useRef, useState } from "react";

export interface Series { name: string; values: number[]; color?: string; }
type Hover = { index: number; left: number; top: number };

export function LineChart({ x, series, xLabel, yLabel, height = 260 }: { x: number[]; series: Series[]; xLabel: string; yLabel: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<Hover | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !x.length) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
      const context = canvas.getContext("2d"); if (!context) return;
      context.scale(ratio, ratio);
      const style = getComputedStyle(canvas); const ink = style.getPropertyValue("--ink").trim() || "#eee8de"; const muted = style.getPropertyValue("--muted").trim() || "#8e887f"; const border = style.getPropertyValue("--border").trim() || "#2d2b28"; const accent = style.getPropertyValue("--accent").trim() || "#c76424";
      const width = rect.width; const h = rect.height; const pad = { left: 50, right: 16, top: 18, bottom: 34 };
      const all = series.flatMap((item) => item.values).filter(Number.isFinite); const minY = Math.min(...all); const maxY = Math.max(...all); const rangeY = Math.max(maxY - minY, 1e-8); const minX = Math.min(...x); const maxX = Math.max(...x);
      const mapX = (value: number) => pad.left + ((value - minX) / Math.max(maxX - minX, 1e-8)) * (width - pad.left - pad.right); const mapY = (value: number) => pad.top + (1 - (value - minY) / rangeY) * (h - pad.top - pad.bottom);
      context.clearRect(0, 0, width, h); context.font = "10px ui-monospace, monospace"; context.fillStyle = muted; context.strokeStyle = border; context.lineWidth = 1;
      for (let tick = 0; tick <= 4; tick += 1) { const y = pad.top + tick / 4 * (h - pad.top - pad.bottom); context.beginPath(); context.moveTo(pad.left, y); context.lineTo(width - pad.right, y); context.stroke(); const value = maxY - tick / 4 * rangeY; context.fillText(Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(3), 4, y + 4); }
      if (minY < 0 && maxY > 0) { const zero = mapY(0); context.strokeStyle = `${muted}99`; context.setLineDash([4, 4]); context.beginPath(); context.moveTo(pad.left, zero); context.lineTo(width - pad.right, zero); context.stroke(); context.setLineDash([]); }
      series.forEach((item, index) => { context.beginPath(); context.lineWidth = index === 0 ? 2.2 : 1.5; context.strokeStyle = item.color || (index === 0 ? accent : "#8d765b"); item.values.forEach((value, pointIndex) => { const px = mapX(x[pointIndex]); const py = mapY(value); if (pointIndex === 0) context.moveTo(px, py); else context.lineTo(px, py); }); context.stroke(); });
      const current = hoverRef.current;
      if (current) { const px = mapX(x[current.index]); context.strokeStyle = `${muted}cc`; context.setLineDash([3, 3]); context.beginPath(); context.moveTo(px, pad.top); context.lineTo(px, h - pad.bottom); context.stroke(); context.setLineDash([]); series.forEach((item, index) => { const py = mapY(item.values[current.index]); context.beginPath(); context.arc(px, py, 3.5, 0, Math.PI * 2); context.fillStyle = item.color || (index === 0 ? accent : "#8d765b"); context.fill(); context.strokeStyle = ink; context.stroke(); }); }
      context.fillStyle = ink; context.textAlign = "center"; context.fillText(xLabel, pad.left + (width - pad.left - pad.right) / 2, h - 6); context.save(); context.translate(12, pad.top + (h - pad.top - pad.bottom) / 2); context.rotate(-Math.PI / 2); context.fillText(yLabel, 0, 0); context.restore();
    };
    const onMove = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); const left = 50; const usable = rect.width - 66; const ratioX = Math.max(0, Math.min(1, (event.clientX - rect.left - left) / usable)); const index = Math.round(ratioX * (x.length - 1)); const next = { index, left: Math.max(8, Math.min(rect.width - 145, event.clientX - rect.left + 10)), top: Math.max(8, event.clientY - rect.top - 38) }; hoverRef.current = next; setHover(next); draw(); };
    const onLeave = () => { hoverRef.current = null; setHover(null); draw(); };
    draw(); const observer = new ResizeObserver(draw); observer.observe(canvas); canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerleave", onLeave);
    return () => { observer.disconnect(); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); };
  }, [x, series, xLabel, yLabel]);

  return <div className="line-chart-wrap"><canvas ref={canvasRef} className="line-chart" style={{ height }} aria-label={`${yLabel} plotted against ${xLabel}`} />{hover && <div className="line-tooltip" style={{ left: hover.left, top: hover.top }}><b>{xLabel} {x[hover.index].toFixed(3)}</b>{series.map((item) => <span key={item.name}>{item.name}: {item.values[hover.index].toFixed(5)}</span>)}</div>}</div>;
}
