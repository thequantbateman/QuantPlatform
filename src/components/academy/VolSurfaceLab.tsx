"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { LineChart } from "@/src/components/charts/LineChart";
import { formatYear } from "@/src/components/charts/chartModel";
import { pick, useI18n } from "@/src/i18n";
import { VolSurfaceCanvas } from "./VolSurfaceCanvas";
import { buildVolSurface, defaultVolSurfaceParameters, educationalVolatility, nearestSurfacePoint, type VolSurfaceParameters, type VolSurfacePoint, type VolSurfaceScenario } from "@/src/quant/volatility/volSurface";

type View = "heatmap" | "3d" | "smile" | "term";
const views: readonly View[] = ["heatmap", "3d", "smile", "term"];

const scenarios: Array<{ id: VolSurfaceScenario; en: { label: string; note: string }; es: { label: string; note: string } }> = [
  { id: "base", en: { label: "Base", note: "Static teaching surface" }, es: { label: "Base", note: "Superficie educativa estática" } },
  { id: "spot-crash", en: { label: "Spot crash", note: "Spot −18%; front vol and downside skew rise" }, es: { label: "Caída de spot", note: "Spot −18%; suben la vol corta y el skew bajista" } },
  { id: "vol-spike", en: { label: "Vol spike", note: "Broad level shock with stronger front end" }, es: { label: "Pico de volatilidad", note: "Shock amplio con mayor impacto frontal" } },
  { id: "term-inversion", en: { label: "Term inversion", note: "Short-dated uncertainty dominates" }, es: { label: "Inversión temporal", note: "Domina la incertidumbre de corto plazo" } },
  { id: "skew-steepening", en: { label: "Skew steepening", note: "Downside wing reprices most" }, es: { label: "Aumento del skew", note: "El ala bajista se revaloriza más" } },
  { id: "normalization", en: { label: "Normalization", note: "A stressed surface decays toward base" }, es: { label: "Normalización", note: "La superficie tensionada revierte hacia la base" } },
];

const tenors = [{ label: "1W", value: 7 / 365 }, { label: "1M", value: 30 / 365 }, { label: "3M", value: 0.25 }, { label: "6M", value: 0.5 }, { label: "1Y", value: 1 }, { label: "2Y", value: 2 }];

export function VolSurfaceLab({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const [view, setView] = useState<View>("heatmap");
  const [params, setParams] = useState<VolSurfaceParameters>(defaultVolSurfaceParameters);
  const [maturity, setMaturity] = useState(0.5);
  const [moneyness, setMoneyness] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const grid = useMemo(() => view === "3d"
    ? buildVolSurface(params, Array.from({ length: 19 }, (_, index) => 7 / 365 + index * ((2 - 7 / 365) / 18)), Array.from({ length: 31 }, (_, index) => 0.7 + index * 0.02))
    : buildVolSurface(params), [params, view]);
  const selected = useMemo(() => nearestSurfacePoint(grid, moneyness, maturity), [grid, moneyness, maturity]);
  const currentScenario = scenarios.find((scenario) => scenario.id === params.scenario) ?? scenarios[0];
  const smile = useMemo(() => Array.from({ length: 41 }, (_, index) => 0.7 + index * 0.015).map((ratio) => ({ x: ratio, y: educationalVolatility(ratio, maturity, params) })), [maturity, params]);
  const term = useMemo(() => Array.from({ length: 41 }, (_, index) => 7 / 365 + index * ((2 - 7 / 365) / 40)).map((time) => ({ x: time, y: educationalVolatility(moneyness, time, params) })), [moneyness, params]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setPlaying(false);
    };
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setParams((current) => ({ ...current, phase: current.phase >= 0.995 ? 0 : Math.min(1, current.phase + 0.025) })), 90);
    return () => window.clearInterval(timer);
  }, [playing]);

  const update = <K extends keyof VolSurfaceParameters>(key: K, value: VolSurfaceParameters[K]) => setParams((current) => ({ ...current, [key]: value }));
  const selectPoint = useCallback((point: VolSurfacePoint) => { setMaturity(point.maturity); setMoneyness(point.moneyness); }, []);
  const selectScenario = (scenario: VolSurfaceScenario) => { setPlaying(false); setParams((current) => ({ ...current, scenario, phase: scenario === "normalization" ? 0 : scenario === "base" ? 0 : 1 })); };
  const selectViewFromKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>, current: View) => {
    const currentIndex = views.indexOf(current);
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? views.length - 1
        : event.key === "ArrowRight" ? (currentIndex + 1) % views.length
          : event.key === "ArrowLeft" ? (currentIndex - 1 + views.length) % views.length
            : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const next = views[nextIndex];
    setView(next);
    window.requestAnimationFrame(() => document.getElementById(`vol-surface-tab-${next}`)?.focus());
  };

  return <div className={`academy-vol-lab ${compact ? "is-compact" : ""}`}>
    <header className="vol-lab-header"><div><span>{pick(locale, { en: "VOL SURFACE LAB · ONE LINKED STATE", es: "LAB DE SUPERFICIE · UN ESTADO CONECTADO" })}</span><h3>{pick(locale, { en: "Implied volatility surface", es: "Superficie de volatilidad implícita" })}</h3><p>{pick(locale, { en: "Inspect the same deterministic grid as a heatmap, rotatable surface, smile or term slice.", es: "Inspecciona la misma malla determinista como heatmap, superficie rotatoria, sonrisa o corte temporal." })}</p></div><div className="vol-data-label"><b>{pick(locale, { en: "SYNTHETIC / EDUCATIONAL", es: "SINTÉTICO / EDUCATIVO" })}</b><span>{pick(locale, { en: "NOT MARKET DATA · NOT A PREDICTION", es: "NO SON DATOS DE MERCADO · NO ES UNA PREDICCIÓN" })}</span></div></header>
    <div className="vol-lab-tabs" role="tablist" aria-label={pick(locale, { en: "Volatility surface views", es: "Vistas de la superficie de volatilidad" })}>{views.map((item) => <button role="tab" id={`vol-surface-tab-${item}`} aria-controls={`vol-surface-panel-${item}`} aria-selected={view === item} tabIndex={view === item ? 0 : -1} className={view === item ? "active" : ""} type="button" onClick={() => setView(item)} onKeyDown={(event) => selectViewFromKeyboard(event, item)} key={item}>{({ heatmap: pick(locale, { en: "HEATMAP", es: "MAPA TÉRMICO" }), "3d": "3D", smile: pick(locale, { en: "SMILE", es: "SONRISA" }), term: pick(locale, { en: "TERM STRUCTURE", es: "ESTRUCTURA TEMPORAL" }) })[item]}</button>)}</div>
    <div className="vol-lab-layout"><aside className="vol-lab-controls">
      <header><span>{pick(locale, { en: "SURFACE STATE", es: "ESTADO DE LA SUPERFICIE" })}</span><button type="button" onClick={() => { setPlaying(false); setParams(defaultVolSurfaceParameters); setMaturity(0.5); setMoneyness(1); }}>{pick(locale, { en: "RESET", es: "RESTABLECER" })}</button></header>
      <Control label="Spot" value={params.spot} min={50} max={150} step={1} format={(value) => value.toFixed(0)} onChange={(value) => update("spot", value)} />
      <Control label={pick(locale, { en: "ATM volatility", es: "Volatilidad ATM" })} value={params.atmVol} min={0.08} max={0.6} step={0.005} format={(value) => `${(value * 100).toFixed(1)}%`} onChange={(value) => update("atmVol", value)} />
      <Control label={pick(locale, { en: "Skew", es: "Sesgo" })} value={params.skew} min={-0.8} max={0.3} step={0.01} format={(value) => value.toFixed(2)} onChange={(value) => update("skew", value)} />
      <Control label={pick(locale, { en: "Curvature", es: "Curvatura" })} value={params.curvature} min={0} max={1.5} step={0.01} format={(value) => value.toFixed(2)} onChange={(value) => update("curvature", value)} />
      <Control label={pick(locale, { en: "Term slope", es: "Pendiente temporal" })} value={params.termSlope} min={-0.15} max={0.18} step={0.005} format={(value) => value.toFixed(3)} onChange={(value) => update("termSlope", value)} />
      <div className="vol-scenario-picker"><span>{pick(locale, { en: "CONTROLLED SCENARIO", es: "ESCENARIO CONTROLADO" })}</span>{scenarios.map((scenario) => <button type="button" aria-pressed={params.scenario === scenario.id} className={params.scenario === scenario.id ? "active" : ""} onClick={() => selectScenario(scenario.id)} key={scenario.id}><b>{scenario[locale].label}</b><small>{scenario[locale].note}</small></button>)}</div>
      <div className="vol-playback"><div><button type="button" aria-label={reducedMotion ? pick(locale, { en: "Autoplay unavailable with reduced motion", es: "Reproducción automática no disponible con movimiento reducido" }) : undefined} onClick={() => setPlaying((current) => !current)} disabled={params.scenario === "base" || reducedMotion}>{playing ? pick(locale, { en: "PAUSE", es: "PAUSA" }) : pick(locale, { en: "PLAY", es: "REPRODUCIR" })}</button><output>T{Math.round(params.phase * 4)}</output></div><input aria-label={pick(locale, { en: "Scenario time", es: "Tiempo del escenario" })} type="range" min="0" max="1" step="0.01" value={params.phase} onChange={(event) => { setPlaying(false); update("phase", Number(event.target.value)); }} /><p>{currentScenario[locale].note}. {pick(locale, { en: "Controlled simulation only.", es: "Simulación controlada únicamente." })}</p></div>
    </aside><div className="vol-lab-output">
      <div className="vol-lab-readout"><div><span>{pick(locale, { en: "SELECTED NODE", es: "NODO SELECCIONADO" })}</span><b>{selected.maturity < 0.1 ? `${Math.round(selected.maturity * 365)}D` : `${selected.maturity.toFixed(2)}Y`}</b></div><div><span>{pick(locale, { en: "STRIKE / MONEYNESS", es: "STRIKE / MONETICIDAD" })}</span><b>{selected.strike.toFixed(1)} / {selected.moneyness.toFixed(2)}</b></div><div><span>{pick(locale, { en: "IMPLIED VOL", es: "VOL. IMPLÍCITA" })}</span><b>{(selected.volatility * 100).toFixed(2)}%</b></div><div><span>{pick(locale, { en: "SCENARIO SPOT", es: "SPOT DEL ESCENARIO" })}</span><b>{(selected.strike / selected.moneyness).toFixed(1)}</b></div></div>
      <div role="tabpanel" id="vol-surface-panel-heatmap" aria-labelledby="vol-surface-tab-heatmap" tabIndex={0} hidden={view !== "heatmap"}>{view === "heatmap" && <Heatmap grid={grid} selected={selected} onSelect={selectPoint} locale={locale} />}</div>
      <div role="tabpanel" id="vol-surface-panel-3d" aria-labelledby="vol-surface-tab-3d" tabIndex={0} hidden={view !== "3d"}>{view === "3d" && <VolSurfaceCanvas grid={grid} selected={selected} onSelect={selectPoint} />}</div>
      <div role="tabpanel" id="vol-surface-panel-smile" aria-labelledby="vol-surface-tab-smile" tabIndex={0} hidden={view !== "smile"}>{view === "smile" && <div className="vol-slice-view"><header><div><span>{pick(locale, { en: "SMILE SLICE", es: "CORTE DE SONRISA" })}</span><b>{tenors.find((tenor) => Math.abs(tenor.value - maturity) < 0.002)?.label ?? `${maturity.toFixed(2)}Y`}</b></div><div className="vol-tenors">{tenors.map((tenor) => <button type="button" className={Math.abs(tenor.value - maturity) < 0.002 ? "active" : ""} onClick={() => setMaturity(tenor.value)} key={tenor.label}>{tenor.label}</button>)}</div></header><LineChart x={smile.map((point) => point.x)} series={[{ name: pick(locale, { en: "implied volatility", es: "volatilidad implícita" }), values: smile.map((point) => point.y * 100) }]} xLabel={pick(locale, { en: "Moneyness K / S", es: "Moneticidad K / S" })} yLabel={pick(locale, { en: "Implied volatility (%)", es: "Volatilidad implícita (%)" })} description={pick(locale, { en: "Implied volatility smile at the selected maturity.", es: "Sonrisa de volatilidad implícita para el vencimiento seleccionado." })} xFormatter={(value) => value.toFixed(2)} yFormatter={(value) => `${value.toFixed(2)}%`} height={390} /></div>}</div>
      <div role="tabpanel" id="vol-surface-panel-term" aria-labelledby="vol-surface-tab-term" tabIndex={0} hidden={view !== "term"}>{view === "term" && <div className="vol-slice-view"><header><div><span>{pick(locale, { en: "TERM SLICE", es: "CORTE TEMPORAL" })}</span><b>{pick(locale, { en: "MONEYNESS", es: "MONETICIDAD" })} {moneyness.toFixed(2)}</b></div><input aria-label={pick(locale, { en: "Selected moneyness", es: "Moneticidad seleccionada" })} type="range" min="0.7" max="1.3" step="0.01" value={moneyness} onChange={(event) => setMoneyness(Number(event.target.value))} /></header><LineChart x={term.map((point) => point.x)} series={[{ name: pick(locale, { en: "implied volatility", es: "volatilidad implícita" }), values: term.map((point) => point.y * 100) }]} xLabel={pick(locale, { en: "Maturity (years)", es: "Vencimiento (años)" })} yLabel={pick(locale, { en: "Implied volatility (%)", es: "Volatilidad implícita (%)" })} description={pick(locale, { en: "Implied volatility term structure at the selected moneyness.", es: "Estructura temporal de volatilidad implícita para la moneticidad seleccionada." })} xFormatter={formatYear} yFormatter={(value) => `${value.toFixed(2)}%`} height={390} /></div>}</div>
      <details className="vol-grid-table"><summary>{pick(locale, { en: "Accessible numeric surface grid", es: "Malla numérica accesible de la superficie" })}</summary><div><table><thead><tr><th>{pick(locale, { en: "Maturity", es: "Vencimiento" })}</th>{grid[0].map((point) => <th key={point.moneyness}>{point.moneyness.toFixed(2)}</th>)}</tr></thead><tbody>{grid.map((row) => <tr key={row[0].maturity}><th>{row[0].maturity.toFixed(2)}y</th>{row.map((point) => <td key={`${point.maturity}-${point.moneyness}`}>{(point.volatility * 100).toFixed(2)}%</td>)}</tr>)}</tbody></table></div></details>
    </div></div>
  </div>;
}

function Control({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (value: number) => string; onChange: (value: number) => void }) {
  return <label className="vol-control"><span><b>{label}</b><output>{format(value)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function Heatmap({ grid, selected, onSelect, locale }: { grid: VolSurfacePoint[][]; selected: VolSurfacePoint; onSelect: (point: VolSurfacePoint) => void; locale: "en" | "es" }) {
  const values = grid.flat().map((point) => point.volatility); const minimum = Math.min(...values); const maximum = Math.max(...values); const range = Math.max(maximum - minimum, 1e-8);
  return <div className="academy-heatmap"><div className="heatmap-legend"><span>{locale === "es" ? "BAJA" : "LOW"} {(minimum * 100).toFixed(1)}%</span><i /><span>{locale === "es" ? "ALTA" : "HIGH"} {(maximum * 100).toFixed(1)}%</span></div><div className="heatmap-grid" style={{ gridTemplateColumns: `74px repeat(${grid[0].length}, minmax(42px, 1fr))` }}><span /><>{grid[0].map((point) => <span className="heatmap-axis" key={point.moneyness}>K/S<br />{point.moneyness.toFixed(2)}</span>)}</>{grid.map((row) => <div className="heatmap-row" style={{ gridColumn: `1 / span ${row.length + 1}`, gridTemplateColumns: `74px repeat(${row.length}, minmax(42px, 1fr))` }} key={row[0].maturity}><span className="heatmap-axis">{row[0].maturity < 0.1 ? `${Math.round(row[0].maturity * 365)}D` : `${row[0].maturity.toFixed(2)}Y`}</span>{row.map((point) => { const normalized = (point.volatility - minimum) / range; const active = Math.abs(point.moneyness - selected.moneyness) < 0.001 && Math.abs(point.maturity - selected.maturity) < 0.001; return <button type="button" className={active ? "active" : ""} aria-pressed={active} aria-label={locale === "es" ? `Vencimiento ${point.maturity.toFixed(2)} años, strike ${point.strike.toFixed(1)}, moneyness ${point.moneyness.toFixed(2)}, volatilidad implícita ${(point.volatility * 100).toFixed(2)} por ciento` : `Maturity ${point.maturity.toFixed(2)} years, strike ${point.strike.toFixed(1)}, moneyness ${point.moneyness.toFixed(2)}, implied volatility ${(point.volatility * 100).toFixed(2)} percent`} title={`${point.maturity.toFixed(2)}y · K ${point.strike.toFixed(1)} · ${(point.volatility * 100).toFixed(2)}%`} onClick={() => onSelect(point)} style={{ "--heat": normalized } as React.CSSProperties} key={`${point.maturity}-${point.moneyness}`}><b>{(point.volatility * 100).toFixed(1)}</b><span>%</span></button>; })}</div>)}</div><p>{locale === "es" ? "Vencimiento ↓ · Moneyness → · Selecciona una celda para ver el estado exacto." : "Maturity ↓ · Moneyness → · Select any cell for exact state."}</p></div>;
}
