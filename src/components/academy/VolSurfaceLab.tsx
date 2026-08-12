"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart } from "@/src/components/charts/LineChart";
import { VolSurfaceCanvas } from "./VolSurfaceCanvas";
import { buildVolSurface, defaultVolSurfaceParameters, educationalVolatility, nearestSurfacePoint, type VolSurfaceParameters, type VolSurfacePoint, type VolSurfaceScenario } from "@/src/quant/volatility/volSurface";

type View = "heatmap" | "3d" | "smile" | "term";

const scenarios: Array<{ id: VolSurfaceScenario; label: string; note: string }> = [
  { id: "base", label: "Base", note: "Static teaching surface" },
  { id: "spot-crash", label: "Spot crash", note: "Spot −18%, front vol and downside skew rise" },
  { id: "vol-spike", label: "Vol spike", note: "Broad level shock with stronger front end" },
  { id: "term-inversion", label: "Term inversion", note: "Short-dated uncertainty dominates" },
  { id: "skew-steepening", label: "Skew steepening", note: "Downside wing reprices most" },
  { id: "normalization", label: "Normalization", note: "A stressed surface decays toward base" },
];

const tenors = [{ label: "1W", value: 7 / 365 }, { label: "1M", value: 30 / 365 }, { label: "3M", value: 0.25 }, { label: "6M", value: 0.5 }, { label: "1Y", value: 1 }, { label: "2Y", value: 2 }];

export function VolSurfaceLab({ compact = false }: { compact?: boolean }) {
  const [view, setView] = useState<View>("heatmap");
  const [params, setParams] = useState<VolSurfaceParameters>(defaultVolSurfaceParameters);
  const [maturity, setMaturity] = useState(0.5);
  const [moneyness, setMoneyness] = useState(1);
  const [playing, setPlaying] = useState(false);
  const grid = useMemo(() => buildVolSurface(params), [params]);
  const selected = useMemo(() => nearestSurfacePoint(grid, moneyness, maturity), [grid, moneyness, maturity]);
  const currentScenario = scenarios.find((scenario) => scenario.id === params.scenario) ?? scenarios[0];
  const smile = useMemo(() => Array.from({ length: 41 }, (_, index) => 0.7 + index * 0.015).map((ratio) => ({ x: ratio, y: educationalVolatility(ratio, maturity, params) })), [maturity, params]);
  const term = useMemo(() => Array.from({ length: 41 }, (_, index) => 7 / 365 + index * ((2 - 7 / 365) / 40)).map((time) => ({ x: time, y: educationalVolatility(moneyness, time, params) })), [moneyness, params]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setParams((current) => ({ ...current, phase: current.phase >= 0.995 ? 0 : Math.min(1, current.phase + 0.025) })), 90);
    return () => window.clearInterval(timer);
  }, [playing]);

  const update = <K extends keyof VolSurfaceParameters>(key: K, value: VolSurfaceParameters[K]) => setParams((current) => ({ ...current, [key]: value }));
  const selectPoint = useCallback((point: VolSurfacePoint) => { setMaturity(point.maturity); setMoneyness(point.moneyness); }, []);
  const selectScenario = (scenario: VolSurfaceScenario) => { setPlaying(false); setParams((current) => ({ ...current, scenario, phase: scenario === "normalization" ? 0 : scenario === "base" ? 0 : 1 })); };

  return <div className={`academy-vol-lab ${compact ? "is-compact" : ""}`}>
    <header className="vol-lab-header"><div><span>VOL SURFACE LAB · ONE LINKED STATE</span><h3>Implied volatility surface</h3><p>Inspect the same deterministic grid as a heatmap, rotatable surface, smile or term slice.</p></div><div className="vol-data-label"><b>SYNTHETIC / EDUCATIONAL</b><span>NOT MARKET DATA · NOT A PREDICTION</span></div></header>
    <div className="vol-lab-tabs" role="tablist" aria-label="Volatility surface views">{(["heatmap", "3d", "smile", "term"] as View[]).map((item) => <button role="tab" aria-selected={view === item} className={view === item ? "active" : ""} type="button" onClick={() => setView(item)} key={item}>{item === "term" ? "TERM STRUCTURE" : item.toUpperCase()}</button>)}</div>
    <div className="vol-lab-layout"><aside className="vol-lab-controls">
      <header><span>SURFACE STATE</span><button type="button" onClick={() => { setPlaying(false); setParams(defaultVolSurfaceParameters); setMaturity(0.5); setMoneyness(1); }}>RESET</button></header>
      <Control label="Spot" value={params.spot} min={50} max={150} step={1} format={(value) => value.toFixed(0)} onChange={(value) => update("spot", value)} />
      <Control label="ATM vol" value={params.atmVol} min={0.08} max={0.6} step={0.005} format={(value) => `${(value * 100).toFixed(1)}%`} onChange={(value) => update("atmVol", value)} />
      <Control label="Skew" value={params.skew} min={-0.8} max={0.3} step={0.01} format={(value) => value.toFixed(2)} onChange={(value) => update("skew", value)} />
      <Control label="Curvature" value={params.curvature} min={0} max={1.5} step={0.01} format={(value) => value.toFixed(2)} onChange={(value) => update("curvature", value)} />
      <Control label="Term slope" value={params.termSlope} min={-0.15} max={0.18} step={0.005} format={(value) => value.toFixed(3)} onChange={(value) => update("termSlope", value)} />
      <div className="vol-scenario-picker"><span>CONTROLLED SCENARIO</span>{scenarios.map((scenario) => <button type="button" aria-pressed={params.scenario === scenario.id} className={params.scenario === scenario.id ? "active" : ""} onClick={() => selectScenario(scenario.id)} key={scenario.id}><b>{scenario.label}</b><small>{scenario.note}</small></button>)}</div>
      <div className="vol-playback"><div><button type="button" onClick={() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; setPlaying((current) => !current); }} disabled={params.scenario === "base"}>{playing ? "PAUSE" : "PLAY"}</button><output>T{Math.round(params.phase * 4)}</output></div><input aria-label="Scenario time" type="range" min="0" max="1" step="0.01" value={params.phase} onChange={(event) => { setPlaying(false); update("phase", Number(event.target.value)); }} /><p>{currentScenario.note}. Controlled simulation only.</p></div>
    </aside><div className="vol-lab-output">
      <div className="vol-lab-readout"><div><span>SELECTED NODE</span><b>{selected.maturity < 0.1 ? `${Math.round(selected.maturity * 365)}D` : `${selected.maturity.toFixed(2)}Y`}</b></div><div><span>STRIKE / MONEYNESS</span><b>{selected.strike.toFixed(1)} / {selected.moneyness.toFixed(2)}</b></div><div><span>IMPLIED VOL</span><b>{(selected.volatility * 100).toFixed(2)}%</b></div><div><span>SCENARIO SPOT</span><b>{(selected.strike / selected.moneyness).toFixed(1)}</b></div></div>
      {view === "heatmap" && <Heatmap grid={grid} selected={selected} onSelect={selectPoint} />}
      {view === "3d" && <VolSurfaceCanvas grid={grid} selected={selected} onSelect={selectPoint} />}
      {view === "smile" && <div className="vol-slice-view"><header><div><span>SMILE SLICE</span><b>{tenors.find((tenor) => Math.abs(tenor.value - maturity) < 0.002)?.label ?? `${maturity.toFixed(2)}Y`}</b></div><div className="vol-tenors">{tenors.map((tenor) => <button type="button" className={Math.abs(tenor.value - maturity) < 0.002 ? "active" : ""} onClick={() => setMaturity(tenor.value)} key={tenor.label}>{tenor.label}</button>)}</div></header><LineChart x={smile.map((point) => point.x)} series={[{ name: "implied volatility", values: smile.map((point) => point.y), color: "#bd7653" }]} xLabel="Moneyness K / S" yLabel="Implied volatility" height={390} /></div>}
      {view === "term" && <div className="vol-slice-view"><header><div><span>TERM SLICE</span><b>MONEYNESS {moneyness.toFixed(2)}</b></div><input aria-label="Selected moneyness" type="range" min="0.7" max="1.3" step="0.01" value={moneyness} onChange={(event) => setMoneyness(Number(event.target.value))} /></header><LineChart x={term.map((point) => point.x)} series={[{ name: "implied volatility", values: term.map((point) => point.y), color: "#bd7653" }]} xLabel="Maturity (years)" yLabel="Implied volatility" height={390} /></div>}
      <details className="vol-grid-table"><summary>Accessible numeric surface grid</summary><div><table><thead><tr><th>Maturity</th>{grid[0].map((point) => <th key={point.moneyness}>{point.moneyness.toFixed(2)}</th>)}</tr></thead><tbody>{grid.map((row) => <tr key={row[0].maturity}><th>{row[0].maturity.toFixed(2)}y</th>{row.map((point) => <td key={`${point.maturity}-${point.moneyness}`}>{(point.volatility * 100).toFixed(2)}%</td>)}</tr>)}</tbody></table></div></details>
    </div></div>
  </div>;
}

function Control({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (value: number) => string; onChange: (value: number) => void }) {
  return <label className="vol-control"><span><b>{label}</b><output>{format(value)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function Heatmap({ grid, selected, onSelect }: { grid: VolSurfacePoint[][]; selected: VolSurfacePoint; onSelect: (point: VolSurfacePoint) => void }) {
  const values = grid.flat().map((point) => point.volatility); const minimum = Math.min(...values); const maximum = Math.max(...values); const range = Math.max(maximum - minimum, 1e-8);
  return <div className="academy-heatmap"><div className="heatmap-legend"><span>LOW {(minimum * 100).toFixed(1)}%</span><i /><span>HIGH {(maximum * 100).toFixed(1)}%</span></div><div className="heatmap-grid" style={{ gridTemplateColumns: `74px repeat(${grid[0].length}, minmax(42px, 1fr))` }}><span /><>{grid[0].map((point) => <span className="heatmap-axis" key={point.moneyness}>K/S<br />{point.moneyness.toFixed(2)}</span>)}</>{grid.map((row) => <div className="heatmap-row" style={{ gridColumn: `1 / span ${row.length + 1}`, gridTemplateColumns: `74px repeat(${row.length}, minmax(42px, 1fr))` }} key={row[0].maturity}><span className="heatmap-axis">{row[0].maturity < 0.1 ? `${Math.round(row[0].maturity * 365)}D` : `${row[0].maturity.toFixed(2)}Y`}</span>{row.map((point) => { const normalized = (point.volatility - minimum) / range; const active = Math.abs(point.moneyness - selected.moneyness) < 0.001 && Math.abs(point.maturity - selected.maturity) < 0.001; return <button type="button" className={active ? "active" : ""} aria-label={`Maturity ${point.maturity.toFixed(2)} years, strike ${point.strike.toFixed(1)}, moneyness ${point.moneyness.toFixed(2)}, implied volatility ${(point.volatility * 100).toFixed(2)} percent`} title={`${point.maturity.toFixed(2)}y · K ${point.strike.toFixed(1)} · ${(point.volatility * 100).toFixed(2)}%`} onClick={() => onSelect(point)} style={{ "--heat": normalized } as React.CSSProperties} key={`${point.maturity}-${point.moneyness}`}><b>{(point.volatility * 100).toFixed(1)}</b><span>%</span></button>; })}</div>)}</div><p>Maturity ↓ · Moneyness → · Select any cell for exact state.</p></div>;
}
