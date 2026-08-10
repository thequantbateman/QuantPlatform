"use client";

import { useEffect, useRef } from "react";

export interface Series {
  name: string;
  values: number[];
  color?: string;
}

export function LineChart({ x, series, xLabel, yLabel, height = 260 }: { x: number[]; series: Series[]; xLabel: string; yLabel: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !x.length) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      const style = getComputedStyle(canvas);
      const ink = style.getPropertyValue("--ink").trim() || "#161513";
      const muted = style.getPropertyValue("--muted").trim() || "#73706a";
      const border = style.getPropertyValue("--border").trim() || "#dedbd4";
      const width = rect.width;
      const h = rect.height;
      const pad = { left: 50, right: 16, top: 18, bottom: 34 };
      const all = series.flatMap((item) => item.values).filter(Number.isFinite);
      const minY = Math.min(...all);
      const maxY = Math.max(...all);
      const rangeY = Math.max(maxY - minY, 1e-8);
      const minX = Math.min(...x);
      const maxX = Math.max(...x);
      const mapX = (value: number) => pad.left + ((value - minX) / Math.max(maxX - minX, 1e-8)) * (width - pad.left - pad.right);
      const mapY = (value: number) => pad.top + (1 - (value - minY) / rangeY) * (h - pad.top - pad.bottom);
      context.clearRect(0, 0, width, h);
      context.font = "11px ui-monospace, monospace";
      context.fillStyle = muted;
      context.strokeStyle = border;
      context.lineWidth = 1;
      for (let tick = 0; tick <= 4; tick += 1) {
        const y = pad.top + (tick / 4) * (h - pad.top - pad.bottom);
        context.beginPath(); context.moveTo(pad.left, y); context.lineTo(width - pad.right, y); context.stroke();
        const value = maxY - (tick / 4) * rangeY;
        context.fillText(Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(3), 4, y + 4);
      }
      series.forEach((item, index) => {
        context.beginPath();
        context.lineWidth = index === 0 ? 2 : 1.5;
        context.strokeStyle = item.color || (index === 0 ? "#7a263a" : "#86745b");
        item.values.forEach((value, pointIndex) => {
          const px = mapX(x[pointIndex]); const py = mapY(value);
          if (pointIndex === 0) context.moveTo(px, py); else context.lineTo(px, py);
        });
        context.stroke();
      });
      context.fillStyle = ink;
      context.textAlign = "center";
      context.fillText(xLabel, pad.left + (width - pad.left - pad.right) / 2, h - 6);
      context.save(); context.translate(12, pad.top + (h - pad.top - pad.bottom) / 2); context.rotate(-Math.PI / 2); context.fillText(yLabel, 0, 0); context.restore();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [x, series, xLabel, yLabel]);

  return <canvas ref={canvasRef} className="line-chart" style={{ height }} aria-label={`${yLabel} plotted against ${xLabel}`} />;
}
