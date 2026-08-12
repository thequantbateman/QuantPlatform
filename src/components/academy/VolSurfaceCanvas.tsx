"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VolSurfacePoint } from "@/src/quant/volatility/volSurface";

type Camera = { yaw: number; pitch: number; zoom: number };
type Projected = VolSurfacePoint & { x: number; y: number; depth: number };

export function VolSurfaceCanvas({ grid, selected, onSelect }: { grid: VolSurfacePoint[][]; selected: VolSurfacePoint; onSelect: (point: VolSurfacePoint) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera>({ yaw: -0.72, pitch: 0.62, zoom: 1 });
  const dragRef = useRef<{ x: number; y: number; camera: Camera; moved: boolean } | null>(null);
  const pointsRef = useRef<Projected[]>([]);
  const [hover, setHover] = useState<Projected | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid.length || !grid[0]?.length) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const width = rect.width;
    const height = rect.height;
    const style = getComputedStyle(canvas);
    const ink = style.getPropertyValue("--academy-chart-ink").trim() || "#eee7dc";
    const muted = style.getPropertyValue("--academy-chart-muted").trim() || "#8d929e";
    const gridColor = style.getPropertyValue("--academy-chart-grid").trim() || "#283140";
    const low = style.getPropertyValue("--academy-chart-low").trim() || "#345b65";
    const high = style.getPropertyValue("--academy-chart-high").trim() || "#c37d55";
    const values = grid.flat().map((point) => point.volatility);
    const minVol = Math.min(...values);
    const maxVol = Math.max(...values);
    const volRange = Math.max(maxVol - minVol, 1e-8);
    const { yaw, pitch, zoom } = cameraRef.current;
    const scale = Math.min(width, height) * 0.64 * zoom;
    const project = (point: VolSurfacePoint): Projected => {
      const x = (point.moneyness - 1) / 0.6;
      const y = (point.maturity - 1) / 2;
      const z = ((point.volatility - minVol) / volRange - 0.5) * 0.8;
      const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
      const ry = x * Math.sin(yaw) + y * Math.cos(yaw);
      const py = ry * Math.cos(pitch) - z * Math.sin(pitch);
      const depth = ry * Math.sin(pitch) + z * Math.cos(pitch);
      return { ...point, x: width * 0.5 + rx * scale, y: height * 0.55 + py * scale, depth };
    };
    const projected = grid.map((row) => row.map(project));
    pointsRef.current = projected.flat();
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0c1220";
    context.fillRect(0, 0, width, height);

    for (let index = 0; index <= 6; index += 1) {
      const base: VolSurfacePoint = { moneyness: 0.7 + index * 0.1, strike: 0, maturity: grid[0][0].maturity, volatility: minVol };
      const end: VolSurfacePoint = { ...base, maturity: grid[grid.length - 1][0].maturity };
      const a = project(base); const b = project(end);
      context.strokeStyle = gridColor; context.lineWidth = 1; context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
    }

    const cells: Array<{ corners: Projected[]; depth: number; value: number }> = [];
    for (let row = 0; row < projected.length - 1; row += 1) {
      for (let column = 0; column < projected[row].length - 1; column += 1) {
        const corners = [projected[row][column], projected[row][column + 1], projected[row + 1][column + 1], projected[row + 1][column]];
        cells.push({ corners, depth: corners.reduce((sum, point) => sum + point.depth, 0) / 4, value: corners.reduce((sum, point) => sum + point.volatility, 0) / 4 });
      }
    }
    cells.sort((a, b) => a.depth - b.depth).forEach((cell) => {
      const normalized = (cell.value - minVol) / volRange;
      const gradient = context.createLinearGradient(cell.corners[0].x, cell.corners[0].y, cell.corners[2].x, cell.corners[2].y);
      gradient.addColorStop(0, `${low}${Math.round((0.72 + normalized * 0.2) * 255).toString(16).padStart(2, "0")}`);
      gradient.addColorStop(1, `${high}${Math.round((0.65 + normalized * 0.3) * 255).toString(16).padStart(2, "0")}`);
      context.fillStyle = gradient;
      context.strokeStyle = `${ink}26`;
      context.beginPath(); cell.corners.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)); context.closePath(); context.fill(); context.stroke();
    });

    const marker = pointsRef.current.reduce((nearest, point) => Math.hypot(point.moneyness - selected.moneyness, point.maturity - selected.maturity) < Math.hypot(nearest.moneyness - selected.moneyness, nearest.maturity - selected.maturity) ? point : nearest);
    context.fillStyle = ink; context.strokeStyle = "#0c1220"; context.lineWidth = 2; context.beginPath(); context.arc(marker.x, marker.y, 5, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = muted; context.font = "10px ui-monospace, monospace"; context.fillText("LOG-MONEYNESS →", width - 150, height - 16); context.fillText("MATURITY", 18, height - 16);
  }, [grid, selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    const observer = new ResizeObserver(draw); observer.observe(canvas);
    const nearest = (event: PointerEvent): Projected | null => {
      const rect = canvas.getBoundingClientRect();
      let match: Projected | null = null; let distance = 22;
      pointsRef.current.forEach((point) => { const next = Math.hypot(point.x - (event.clientX - rect.left), point.y - (event.clientY - rect.top)); if (next < distance) { match = point; distance = next; } });
      return match;
    };
    const onPointerDown = (event: PointerEvent) => { canvas.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, camera: { ...cameraRef.current }, moved: false }; };
    const onPointerMove = (event: PointerEvent) => {
      if (dragRef.current) {
        const dx = event.clientX - dragRef.current.x; const dy = event.clientY - dragRef.current.y;
        dragRef.current.moved ||= Math.hypot(dx, dy) > 4;
        cameraRef.current.yaw = dragRef.current.camera.yaw + dx * 0.008;
        cameraRef.current.pitch = Math.max(0.22, Math.min(1.18, dragRef.current.camera.pitch + dy * 0.006));
        draw(); return;
      }
      setHover(nearest(event));
    };
    const onPointerUp = (event: PointerEvent) => { const point = nearest(event); if (point && !dragRef.current?.moved) onSelect(point); dragRef.current = null; };
    const onWheel = (event: WheelEvent) => { event.preventDefault(); cameraRef.current.zoom = Math.max(0.72, Math.min(1.55, cameraRef.current.zoom * (event.deltaY > 0 ? 0.93 : 1.07))); draw(); };
    canvas.addEventListener("pointerdown", onPointerDown); canvas.addEventListener("pointermove", onPointerMove); canvas.addEventListener("pointerup", onPointerUp); canvas.addEventListener("pointerleave", onPointerUp); canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => { observer.disconnect(); canvas.removeEventListener("pointerdown", onPointerDown); canvas.removeEventListener("pointermove", onPointerMove); canvas.removeEventListener("pointerup", onPointerUp); canvas.removeEventListener("pointerleave", onPointerUp); canvas.removeEventListener("wheel", onWheel); };
  }, [draw, onSelect]);

  const reset = () => { cameraRef.current = { yaw: -0.72, pitch: 0.62, zoom: 1 }; draw(); };
  return <div className="academy-surface-3d"><canvas ref={canvasRef} aria-label="Interactive synthetic implied volatility surface. Drag to rotate, scroll to zoom, and click a node to select it." /><button type="button" onClick={reset}>RESET CAMERA</button><span>Drag rotate · Scroll zoom · Select node</span>{hover && <output>{hover.maturity.toFixed(2)}y · K {hover.strike.toFixed(1)} · {(hover.volatility * 100).toFixed(2)}%</output>}</div>;
}
