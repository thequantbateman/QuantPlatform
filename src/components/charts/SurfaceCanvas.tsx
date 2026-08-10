"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syntheticVolatility, type SurfaceParameters } from "@/src/quant/volatility/syntheticSurface";

type Camera = { yaw: number; pitch: number; zoom: number };
type ProjectedPoint = { x: number; y: number; z: number; value: number; moneyness: number; maturity: number };

export function SurfaceCanvas({ params }: { params: SurfaceParameters }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera>({ yaw: -0.72, pitch: 0.58, zoom: 1 });
  const dragRef = useRef<{ x: number; y: number; camera: Camera } | null>(null);
  const [hover, setHover] = useState<ProjectedPoint | null>(null);

  const grid = useMemo(() => {
    const rows: { moneyness: number; maturity: number; value: number }[][] = [];
    for (let yi = 0; yi <= 12; yi += 1) {
      const maturity = 0.08 + (yi / 12) * 2.92;
      const row = [];
      for (let xi = 0; xi <= 20; xi += 1) {
        const moneyness = 0.72 + (xi / 20) * 0.56;
        row.push({ moneyness, maturity, value: syntheticVolatility(moneyness, maturity, params) });
      }
      rows.push(row);
    }
    return rows;
  }, [params]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return [] as ProjectedPoint[];
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const context = canvas.getContext("2d");
    if (!context) return [] as ProjectedPoint[];
    context.scale(ratio, ratio);
    const style = getComputedStyle(canvas);
    const ink = style.getPropertyValue("--ink").trim() || "#171513";
    const border = style.getPropertyValue("--border").trim() || "#dedbd4";
    const surface = style.getPropertyValue("--accent").trim() || "#7a263a";
    const { yaw, pitch, zoom } = cameraRef.current;
    const width = rect.width;
    const height = rect.height;
    const scale = Math.min(width, height) * 0.68 * zoom;
    const points: ProjectedPoint[] = [];
    const project = (m: number, t: number, vol: number): ProjectedPoint => {
      const x = (m - 1) / 0.56;
      const y = (t - 1.54) / 2.92;
      const z = (vol - params.atm) / 0.18;
      const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
      const ry = x * Math.sin(yaw) + y * Math.cos(yaw);
      const py = ry * Math.cos(pitch) - z * Math.sin(pitch);
      const pz = ry * Math.sin(pitch) + z * Math.cos(pitch);
      return { x: width * 0.5 + rx * scale, y: height * 0.55 + py * scale, z: pz, value: vol, moneyness: m, maturity: t };
    };
    context.clearRect(0, 0, width, height);
    context.strokeStyle = border;
    context.lineWidth = 1;
    for (let index = 0; index <= 8; index += 1) {
      const start = project(0.72 + index * 0.07, 0.08, params.atm - 0.1);
      const end = project(0.72 + index * 0.07, 3, params.atm - 0.1);
      context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke();
    }
    grid.forEach((row, rowIndex) => {
      const rowPoints = row.map((point) => project(point.moneyness, point.maturity, point.value));
      points.push(...rowPoints);
      context.beginPath();
      rowPoints.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.strokeStyle = rowIndex % 2 ? `${surface}99` : surface;
      context.lineWidth = rowIndex % 3 === 0 ? 1.6 : 1;
      context.stroke();
    });
    for (let xi = 0; xi <= 20; xi += 2) {
      context.beginPath();
      grid.forEach((row, rowIndex) => {
        const point = project(row[xi].moneyness, row[xi].maturity, row[xi].value);
        if (rowIndex === 0) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y);
      });
      context.strokeStyle = `${surface}88`;
      context.lineWidth = 1;
      context.stroke();
    }
    context.fillStyle = ink;
    context.font = "11px ui-monospace, monospace";
    context.fillText("MONEYNESS →", width - 112, height - 16);
    context.fillText("MATURITY", 18, height - 16);
    return points;
  }, [grid, params]);

  useEffect(() => {
    let points = draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = new ResizeObserver(() => { points = draw(); });
    resize.observe(canvas);
    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      dragRef.current = { x: event.clientX, y: event.clientY, camera: { ...cameraRef.current } };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragRef.current) {
        cameraRef.current.yaw = dragRef.current.camera.yaw + (event.clientX - dragRef.current.x) * 0.008;
        cameraRef.current.pitch = Math.max(0.18, Math.min(1.2, dragRef.current.camera.pitch + (event.clientY - dragRef.current.y) * 0.006));
        points = draw();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      let nearest: ProjectedPoint | null = null;
      let distance = 20;
      for (const point of points) {
        const current = Math.hypot(point.x - (event.clientX - rect.left), point.y - (event.clientY - rect.top));
        if (current < distance) { distance = current; nearest = point; }
      }
      setHover(nearest);
    };
    const onPointerUp = () => { dragRef.current = null; };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraRef.current.zoom = Math.max(0.65, Math.min(1.6, cameraRef.current.zoom * (event.deltaY > 0 ? 0.92 : 1.08)));
      points = draw();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      resize.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [draw]);

  function resetCamera() {
    cameraRef.current = { yaw: -0.72, pitch: 0.58, zoom: 1 };
    draw();
  }

  return (
    <div className="surface-wrap">
      <canvas ref={canvasRef} className="surface-canvas" aria-label="Interactive synthetic implied volatility surface. Drag to rotate and scroll to zoom." />
      <button className="chart-reset" type="button" onClick={resetCamera}>Reset camera</button>
      {hover && <div className="surface-tooltip">m {hover.moneyness.toFixed(2)} · {hover.maturity.toFixed(2)}y · {(hover.value * 100).toFixed(2)}%</div>}
      <span className="chart-hint">Drag to rotate · Scroll to zoom · Hover to inspect</span>
    </div>
  );
}
