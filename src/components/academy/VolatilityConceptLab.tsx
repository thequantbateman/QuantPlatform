"use client";

import { useMemo, useState } from "react";
import { LineChart, type Series } from "@/src/components/charts/LineChart";
import type { AcademyLesson } from "@/src/content/academy/types";

type LabId = AcademyLesson["interactiveLabs"][number]["id"];
type Scenario = { id: string; label: string; note: string; primary: number; secondary: number };
type LabDefinition = {
  eyebrow: string;
  xLabel: string;
  yLabel: string;
  scenarios: Scenario[];
  build: (scenario: Scenario, intensity: number) => { x: number[]; series: Series[]; metrics: Array<[string, string]> };
};

const range = (count: number, start: number, end: number): number[] => Array.from({ length: count }, (_, index) => start + index * ((end - start) / (count - 1)));
const percent = (value: number): string => `${(value * 100).toFixed(2)}%`;

const definitions: Partial<Record<LabId, LabDefinition>> = {
  "realized-volatility": {
    eyebrow: "PATH → ESTIMATOR → ANNUALIZED STATE", xLabel: "Trading days", yLabel: "Annualized volatility", scenarios: [
      { id: "calm", label: "Calm", note: "Low dispersion with a stable state", primary: 0.11, secondary: 0.94 },
      { id: "cluster", label: "Vol cluster", note: "A shock persists through the rolling window", primary: 0.18, secondary: 0.94 },
      { id: "jump", label: "Jump", note: "One discontinuity dominates close-to-close variance", primary: 0.22, secondary: 0.97 },
    ],
    build: (scenario, intensity) => {
      const x = range(61, 0, 60); const shock = scenario.id === "calm" ? 0 : scenario.primary * intensity;
      const rolling = x.map((day) => scenario.primary + shock * Math.exp(-Math.abs(day - 30) / (scenario.id === "jump" ? 6 : 15)) * (day >= 25 ? 1 : 0.3));
      const ewma = x.map((day) => scenario.primary + shock * 0.86 * Math.exp(-Math.max(0, day - 30) / 12) * (day >= 28 ? 1 : 0.15));
      return { x, series: [{ name: "20d rolling", values: rolling, color: "#ff5a44" }, { name: "EWMA", values: ewma, color: "#22d3ee" }], metrics: [["Latest rolling", percent(rolling.at(-1) ?? 0)], ["Peak", percent(Math.max(...rolling))], ["EWMA λ", scenario.secondary.toFixed(2)]] };
    },
  },
  "variance-risk-premium": {
    eyebrow: "IMPLIED VARIANCE − SUBSEQUENT REALIZED VARIANCE", xLabel: "Forward months", yLabel: "Annualized variance", scenarios: [
      { id: "carry", label: "Carry", note: "Implied variance remains above realized", primary: 0.22, secondary: 0.17 },
      { id: "shock", label: "Tail shock", note: "Realized variance breaches the premium", primary: 0.25, secondary: 0.34 },
      { id: "normal", label: "Normalization", note: "The risk spread compresses", primary: 0.19, secondary: 0.18 },
    ],
    build: (scenario, intensity) => { const x = range(13, 0, 12); const implied = x.map((m) => scenario.primary ** 2 * (1 + 0.08 * Math.cos(m / 3))); const realized = x.map((m) => scenario.secondary ** 2 * (1 + intensity * 0.28 * Math.sin((m + 1) / 2))); const spread = implied.map((value, index) => value - realized[index]); return { x, series: [{ name: "implied variance", values: implied, color: "#f59e0b" }, { name: "realized variance", values: realized, color: "#22d3ee" }, { name: "variance spread", values: spread, color: "#fb7185" }], metrics: [["Mean VRP", (spread.reduce((sum, value) => sum + value, 0) / spread.length * 10_000).toFixed(1) + " bp²"], ["IV", percent(scenario.primary)], ["RV state", percent(scenario.secondary)]] }; },
  },
  "smile-skew": {
    eyebrow: "STRIKE GEOMETRY AND DENSITY", xLabel: "Forward moneyness K/F", yLabel: "Implied volatility", scenarios: [
      { id: "base", label: "Base smile", note: "Moderate downside skew", primary: -0.18, secondary: 0.48 },
      { id: "riskoff", label: "Risk-off", note: "Downside wing reprices", primary: -0.48, secondary: 0.70 },
      { id: "symmetric", label: "Symmetric", note: "Curvature without directional skew", primary: 0, secondary: 0.82 },
    ],
    build: (scenario, intensity) => { const x = range(49, 0.7, 1.3); const smile = x.map((m) => 0.2 + scenario.primary * Math.log(m) * intensity + scenario.secondary * Math.log(m) ** 2); const tangent = x.map((m) => 0.2 + scenario.primary * (m - 1) * intensity); return { x, series: [{ name: "implied smile", values: smile, color: "#ff5a44" }, { name: "ATM tangent", values: tangent, color: "#22d3ee" }], metrics: [["ATM", percent(0.2)], ["ATM skew", (scenario.primary * intensity).toFixed(3)], ["70% wing", percent(smile[0])]] }; },
  },
  "term-structure": {
    eyebrow: "TOTAL AND FORWARD VARIANCE", xLabel: "Maturity (years)", yLabel: "Annualized variance", scenarios: [
      { id: "normal", label: "Normal", note: "Gently rising cumulative uncertainty", primary: 0.19, secondary: 0.025 },
      { id: "event", label: "Event bump", note: "Variance concentrates near 3M", primary: 0.2, secondary: 0.12 },
      { id: "invert", label: "Front inversion", note: "Short-dated variance dominates", primary: 0.23, secondary: -0.07 },
    ],
    build: (scenario, intensity) => { const x = range(41, 0.05, 2); const total = x.map((t) => Math.max(0.0001, (scenario.primary ** 2 + scenario.secondary * intensity * Math.exp(-3 * t)) * t + (scenario.id === "event" ? 0.015 * intensity * Math.exp(-90 * (t - 0.25) ** 2) : 0))); const forward = total.map((value, index) => index === 0 ? value / x[0] : (value - total[index - 1]) / (x[index] - x[index - 1])); return { x, series: [{ name: "total variance", values: total, color: "#f59e0b" }, { name: "forward variance", values: forward, color: "#22d3ee" }], metrics: [["1Y total variance", total[Math.round(20)].toFixed(4)], ["Min forward", Math.min(...forward).toFixed(4)], ["State", scenario.label]] }; },
  },
  "local-volatility": {
    eyebrow: "SURFACE DERIVATIVES AND DUPIRE STABILITY", xLabel: "Strike", yLabel: "Local volatility / convexity", scenarios: [
      { id: "smooth", label: "Smooth", note: "Stable convex price slice", primary: 0.22, secondary: 0.04 },
      { id: "noisy", label: "Noisy quotes", note: "Differentiation amplifies small errors", primary: 0.25, secondary: 0.11 },
      { id: "wing", label: "Wing stress", note: "Sparse extrapolation destabilizes local vol", primary: 0.3, secondary: 0.18 },
    ],
    build: (scenario, intensity) => { const x = range(45, 70, 130); const local = x.map((k, index) => scenario.primary + 0.00006 * (k - 100) ** 2 + scenario.secondary * intensity * Math.sin(index * 1.7) * (scenario.id === "smooth" ? 0.05 : Math.abs(k - 100) / 30)); const density = x.map((k) => 0.09 * Math.exp(-1 * ((k - 100) / 17) ** 2)); return { x, series: [{ name: "local volatility", values: local, color: "#ff5a44" }, { name: "scaled density", values: density, color: "#22d3ee" }], metrics: [["ATM local vol", percent(local[22])], ["Max local vol", percent(Math.max(...local))], ["Noise state", scenario.label]] }; },
  },
  "stochastic-volatility": {
    eyebrow: "RANDOM VARIANCE STATE AND MEAN REVERSION", xLabel: "Simulation time", yLabel: "Instantaneous variance", scenarios: [
      { id: "revert", label: "Fast reversion", note: "Variance shocks decay rapidly", primary: 3.2, secondary: 0.35 },
      { id: "persistent", label: "Persistent", note: "A slow-moving volatility regime", primary: 0.8, secondary: 0.35 },
      { id: "volvol", label: "High vol-of-vol", note: "Variance paths disperse strongly", primary: 1.6, secondary: 0.8 },
    ],
    build: (scenario, intensity) => { const x = range(61, 0, 1); const mean = x.map((t) => 0.04 + 0.05 * Math.exp(-scenario.primary * t)); const upper = mean.map((v, index) => Math.max(0, v + scenario.secondary * intensity * 0.03 * Math.sin(index * 1.31) * Math.sqrt(x[index] + 0.02))); const lower = mean.map((v, index) => Math.max(0, v - scenario.secondary * intensity * 0.025 * Math.cos(index * 1.17) * Math.sqrt(x[index] + 0.02))); return { x, series: [{ name: "conditional mean", values: mean, color: "#f59e0b" }, { name: "path A", values: upper, color: "#ff5a44" }, { name: "path B", values: lower, color: "#22d3ee" }], metrics: [["Long-run vol", percent(0.2)], ["κ", scenario.primary.toFixed(2)], ["Vol-of-vol", scenario.secondary.toFixed(2)]] }; },
  },
  heston: {
    eyebrow: "HESTON VARIANCE STATE AND LEVERAGE CORRELATION", xLabel: "Maturity (years)", yLabel: "Variance / smile response", scenarios: [
      { id: "leverage", label: "Negative rho", note: "Selloffs lift variance and downside skew", primary: -0.75, secondary: 0.45 },
      { id: "volvol", label: "High vol-of-vol", note: "Variance distribution and smile curvature widen", primary: -0.45, secondary: 0.85 },
      { id: "reversion", label: "Fast reversion", note: "The short variance shock decays quickly", primary: -0.55, secondary: 0.25 },
    ],
    build: (scenario, intensity) => { const x = range(61, 0.02, 2); const variance = x.map((t) => 0.04 + 0.055 * intensity * Math.exp(-(scenario.id === "reversion" ? 3.4 : 1.2) * t)); const skew = x.map((t) => Math.abs(scenario.primary) * scenario.secondary * intensity * 0.08 * Math.exp(-0.65 * t)); return { x, series: [{ name: "expected variance", values: variance, color: "#f59e0b" }, { name: "downside skew response", values: skew, color: "#ff5a44" }], metrics: [["ρ", scenario.primary.toFixed(2)], ["Vol-of-vol", scenario.secondary.toFixed(2)], ["Long-run vol", percent(0.2)]] }; },
  },
  sabr: {
    eyebrow: "BACKBONE, CORRELATION AND VOL-OF-VOL", xLabel: "Forward moneyness K/F", yLabel: "Implied volatility", scenarios: [
      { id: "rho", label: "Negative rho", note: "Correlation steepens downside skew", primary: -0.65, secondary: 0.45 },
      { id: "nu", label: "High vol-of-vol", note: "ν lifts both wings", primary: -0.2, secondary: 0.9 },
      { id: "beta", label: "Low beta", note: "Backbone changes level sensitivity", primary: -0.35, secondary: 0.25 },
    ],
    build: (scenario, intensity) => { const x = range(49, 0.7, 1.3); const smile = x.map((m) => 0.19 + 0.12 * scenario.primary * intensity * Math.log(m) + 0.22 * scenario.secondary * Math.log(m) ** 2); const backbone = x.map((m) => 0.19 * m ** (-scenario.secondary * intensity)); return { x, series: [{ name: "SABR approximation", values: smile, color: "#ff5a44" }, { name: "backbone", values: backbone, color: "#22d3ee" }], metrics: [["ATM", percent(0.19)], ["ρ proxy", scenario.primary.toFixed(2)], ["ν proxy", scenario.secondary.toFixed(2)]] }; },
  },
  calibration: {
    eyebrow: "OPTIMIZER PATH AND RESIDUAL GEOMETRY", xLabel: "Iteration", yLabel: "Objective / condition (scaled)", scenarios: [
      { id: "clean", label: "Well identified", note: "Residuals decay with stable conditioning", primary: 0.75, secondary: 0.18 },
      { id: "weak", label: "Weak parameter", note: "Fit improves while conditioning deteriorates", primary: 0.9, secondary: 0.75 },
      { id: "local", label: "Local minimum", note: "Optimizer stalls above the global basin", primary: 0.45, secondary: 0.5 },
    ],
    build: (scenario, intensity) => { const x = range(31, 0, 30); const objective = x.map((i) => 0.12 * Math.exp(-scenario.primary * i / 4) + (scenario.id === "local" ? 0.013 : 0.001) + 0.004 * Math.abs(Math.sin(i)) / (i + 1)); const condition = x.map((i) => 0.015 + scenario.secondary * intensity * (1 - Math.exp(-i / 8)) * 0.08); return { x, series: [{ name: "weighted RMSE", values: objective, color: "#ff5a44" }, { name: "condition (scaled)", values: condition, color: "#f59e0b" }], metrics: [["Final RMSE", objective.at(-1)?.toFixed(4) ?? "—"], ["Condition state", scenario.label], ["Iterations", "30"]] }; },
  },
  "higher-order-risk": {
    eyebrow: "SPOT × VOLATILITY P&L GEOMETRY", xLabel: "Spot shock (%)", yLabel: "Model-currency P&L", scenarios: [
      { id: "vega", label: "Long vega", note: "Level shock dominates", primary: 38, secondary: -0.18 },
      { id: "vanna", label: "Negative vanna", note: "Spot down / vol up produces cross P&L", primary: 22, secondary: -0.65 },
      { id: "volga", label: "Long volga", note: "Volatility curvature dominates large shocks", primary: 28, secondary: 0.45 },
    ],
    build: (scenario, intensity) => { const x = range(41, -10, 10); const first = x.map((spot) => 0.52 * spot + scenario.primary * intensity * (-spot / 100)); const second = x.map((spot, index) => first[index] + 0.5 * 0.055 * spot ** 2 + scenario.secondary * spot * Math.abs(spot) * 0.04); return { x, series: [{ name: "first order", values: first, color: "#22d3ee" }, { name: "with vanna / volga", values: second, color: "#ff5a44" }], metrics: [["Vega / point", (scenario.primary * 0.01).toFixed(3)], ["Cross state", scenario.label], ["Max residual", Math.max(...second.map((v, i) => Math.abs(v - first[i]))).toFixed(2)]] }; },
  },
};

export function VolatilityConceptLab({ lesson }: { lesson: AcademyLesson }) {
  const lab = lesson.interactiveLabs[0];
  const definition = definitions[lab?.id];
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [intensity, setIntensity] = useState(0.7);
  const scenario = definition?.scenarios[scenarioIndex] ?? definition?.scenarios[0];
  const result = useMemo(() => definition && scenario ? definition.build(scenario, intensity) : undefined, [definition, scenario, intensity]);
  if (!definition || !scenario || !result) return null;

  return <div className="vol-concept-lab">
    <header><div><span>{definition.eyebrow}</span><h3>{lab.title}</h3><p>{lab.description}</p></div><b>SYNTHETIC · CONTROLLED SCENARIOS</b></header>
    <div className="vol-concept-scenarios" aria-label={`${lesson.title} scenarios`}>{definition.scenarios.map((item, index) => <button type="button" className={index === scenarioIndex ? "active" : ""} aria-pressed={index === scenarioIndex} onClick={() => setScenarioIndex(index)} key={item.id}><b>{item.label}</b><small>{item.note}</small></button>)}</div>
    <label className="vol-concept-intensity"><span><b>SCENARIO INTENSITY</b><output>{Math.round(intensity * 100)}%</output></span><input aria-label="Scenario intensity" type="range" min="0" max="1" step="0.01" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label>
    <div className="vol-concept-metrics">{result.metrics.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
    <div className="vol-concept-chart"><LineChart x={result.x} series={result.series} xLabel={definition.xLabel} yLabel={definition.yLabel} height={410} /></div>
    <footer><span>ACTIVE STATE</span><p><b>{scenario.label}</b> — {scenario.note}. Move the intensity control and inspect every series with pointer or touch.</p></footer>
  </div>;
}
