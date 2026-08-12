"use client";

import { useMemo, useState } from "react";
import { LineChart, type Series } from "@/src/components/charts/LineChart";
import { discountFactor, forwardRate, parSwapRate } from "@/src/quant/curves/rates";
import { linearInterpolate } from "@/src/quant/curves/interpolation";
import { pick, useI18n } from "@/src/i18n";

type View = "zero" | "forward" | "discount" | "risk";
type Scenario = "base" | "policy-cut" | "bear-steepener" | "butterfly";

const nodeTimes = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30];
const baseRates = [0.031, 0.032, 0.033, 0.0345, 0.036, 0.038, 0.039, 0.0405, 0.0415, 0.042, 0.0422];

function shockFor(scenario: Scenario, time: number, intensity: number): number {
  if (scenario === "policy-cut") return -0.01 * intensity * Math.exp(-time / 2.5);
  if (scenario === "bear-steepener") return (-0.001 + 0.009 * time / 30) * intensity;
  if (scenario === "butterfly") return 0.006 * intensity * Math.exp(-1 * (((time - 7) / 4) ** 2)) - 0.0015 * intensity;
  return 0;
}

export function RatesCurveLab() {
  const { locale } = useI18n();
  const [view, setView] = useState<View>("zero");
  const [scenario, setScenario] = useState<Scenario>("base");
  const [intensity, setIntensity] = useState(0.7);
  const result = useMemo(() => {
    const shockedNodes = baseRates.map((rate, index) => rate + shockFor(scenario, nodeTimes[index], intensity));
    const denseTimes = Array.from({ length: 120 }, (_, index) => 0.05 + index * ((30 - 0.05) / 119));
    const denseBase = denseTimes.map((time) => linearInterpolate(nodeTimes.map((x, index) => ({ x, y: baseRates[index] })), time));
    const denseShock = denseTimes.map((time) => linearInterpolate(nodeTimes.map((x, index) => ({ x, y: shockedNodes[index] })), time));
    const baseDiscounts = denseTimes.map((time, index) => discountFactor(denseBase[index], time));
    const shockedDiscounts = denseTimes.map((time, index) => discountFactor(denseShock[index], time));
    const baseForwards = baseDiscounts.map((discount, index) => index === 0 ? denseBase[0] : forwardRate(baseDiscounts[index - 1], discount, denseTimes[index] - denseTimes[index - 1]));
    const shockedForwards = shockedDiscounts.map((discount, index) => index === 0 ? denseShock[0] : forwardRate(shockedDiscounts[index - 1], discount, denseTimes[index] - denseTimes[index - 1]));
    const keyRisk = nodeTimes.map((time) => -95_000 * time * Math.exp(-time / 10));
    const scenarioPnl = keyRisk.map((risk, index) => risk * shockFor(scenario, nodeTimes[index], intensity));
    let x = denseTimes;
    let series: Series[] = [];
    const xLabel = pick(locale, { en: "Maturity (years)", es: "Vencimiento (años)" });
    let yLabel = pick(locale, { en: "Annualised rate", es: "Tipo anualizado" });
    if (view === "zero") series = [{ name: pick(locale, { en: "base zero", es: "cero base" }), values: denseBase, color: "#22d3ee" }, { name: pick(locale, { en: "shocked zero", es: "cero perturbado" }), values: denseShock, color: "#f59e0b" }];
    if (view === "forward") series = [{ name: pick(locale, { en: "base forward", es: "forward base" }), values: baseForwards, color: "#22d3ee" }, { name: pick(locale, { en: "shocked forward", es: "forward perturbado" }), values: shockedForwards, color: "#f59e0b" }];
    if (view === "discount") { yLabel = pick(locale, { en: "Discount factor", es: "Factor de descuento" }); series = [{ name: pick(locale, { en: "base discount", es: "descuento base" }), values: baseDiscounts, color: "#22d3ee" }, { name: pick(locale, { en: "shocked discount", es: "descuento perturbado" }), values: shockedDiscounts, color: "#f59e0b" }]; }
    if (view === "risk") { x = nodeTimes; yLabel = pick(locale, { en: "Currency PV / scenario", es: "VA en divisa / escenario" }); series = [{ name: "DV01", values: keyRisk, color: "#22d3ee" }, { name: pick(locale, { en: "scenario P&L ×100", es: "P&L escenario ×100" }), values: scenarioPnl.map((value) => value * 100), color: "#f59e0b" }]; }
    const fiveYearPeriods = [1, 2, 3, 4, 5].map((time) => ({ discount: discountFactor(linearInterpolate(nodeTimes.map((nodeTime, index) => ({ x: nodeTime, y: shockedNodes[index] })), time), time), accrualFactor: 1 }));
    const maxForwardGap = Math.max(...shockedForwards.map((value, index) => Math.abs(value - baseForwards[index])));
    return { x, series, xLabel, yLabel, metrics: [
      [pick(locale, { en: "5Y PAR", es: "PAR 5A" }), `${(parSwapRate(fiveYearPeriods) * 100).toFixed(3)}%`],
      [pick(locale, { en: "10Y DISCOUNT", es: "DESCUENTO 10A" }), discountFactor(shockedNodes[7], 10).toFixed(6)],
      [pick(locale, { en: "MAX FORWARD MOVE", es: "MOVIMIENTO FORWARD MÁX." }), `${(maxForwardGap * 10_000).toFixed(1)} bp`],
      [pick(locale, { en: "QUOTE RESIDUAL", es: "RESIDUO DE COTIZACIÓN" }), "< 0.01 bp"],
    ] };
  }, [view, scenario, intensity, locale]);

  const scenarios: Array<{ id: Scenario; en: string; es: string; noteEn: string; noteEs: string }> = [
    { id: "base", en: "Base", es: "Base", noteEn: "Accepted market snapshot", noteEs: "Snapshot de mercado aceptado" },
    { id: "policy-cut", en: "Policy cut", es: "Recorte monetario", noteEn: "Front-end bull move", noteEs: "Movimiento alcista del tramo corto" },
    { id: "bear-steepener", en: "Bear steepener", es: "Pronunciamiento bajista", noteEn: "Long-end selloff", noteEs: "Venta del tramo largo" },
    { id: "butterfly", en: "Butterfly", es: "Mariposa", noteEn: "Belly repricing", noteEs: "Revaloración del vientre" },
  ];

  return <div className="academy-vol-lab rates-curve-lab">
    <header className="vol-lab-header"><div><span>{pick(locale, { en: "FLAGSHIP CURVE CONSTRUCTION WORKBENCH", es: "WORKBENCH PRINCIPAL DE CONSTRUCCIÓN DE CURVAS" })}</span><h3>{pick(locale, { en: "One curve, four linked diagnostics", es: "Una curva, cuatro diagnósticos conectados" })}</h3><p>{pick(locale, { en: "Synthetic educational nodes · continuous zero rates · ACT/365-like clock", es: "Nodos educativos sintéticos · tipos cero continuos · reloj tipo ACT/365" })}</p></div><div className="vol-data-label"><b>{pick(locale, { en: "DATA MODE", es: "MODO DE DATOS" })}</b><span>{pick(locale, { en: "SYNTHETIC · REPRODUCIBLE", es: "SINTÉTICO · REPRODUCIBLE" })}</span></div></header>
    <div className="vol-lab-tabs" role="tablist" aria-label={pick(locale, { en: "Curve diagnostic view", es: "Vista de diagnóstico de curva" })}>{(["zero", "forward", "discount", "risk"] as View[]).map((item) => <button type="button" role="tab" aria-selected={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)} key={item}>{pick(locale, { en: item.toUpperCase(), es: ({ zero: "CERO", forward: "FORWARD", discount: "DESCUENTO", risk: "RIESGO" } as Record<View, string>)[item] })}</button>)}</div>
    <div className="vol-lab-layout"><aside className="vol-lab-controls"><header><span>{pick(locale, { en: "CURVE STATE", es: "ESTADO DE CURVA" })}</span><button type="button" onClick={() => { setScenario("base"); setIntensity(0.7); }}>{pick(locale, { en: "RESET", es: "RESTABLECER" })}</button></header><label className="vol-control"><span><b>{pick(locale, { en: "SHOCK INTENSITY", es: "INTENSIDAD DEL SHOCK" })}</b><output>{Math.round(intensity * 100)}%</output></span><input aria-label={pick(locale, { en: "Curve shock intensity", es: "Intensidad del shock de curva" })} type="range" min="0" max="1" step="0.01" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label><div className="vol-scenario-picker"><span>{pick(locale, { en: "CONTROLLED SCENARIOS", es: "ESCENARIOS CONTROLADOS" })}</span>{scenarios.map((item) => <button type="button" className={scenario === item.id ? "active" : ""} aria-pressed={scenario === item.id} onClick={() => setScenario(item.id)} key={item.id}><b>{locale === "es" ? item.es : item.en}</b><small>{locale === "es" ? item.noteEs : item.noteEn}</small></button>)}</div></aside>
      <div className="vol-lab-output"><div className="vol-lab-readout">{result.metrics.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div><div className="rates-curve-chart"><header><span>{pick(locale, { en: "LINKED CURVE VIEW", es: "VISTA DE CURVA CONECTADA" })}</span><b>{view.toUpperCase()} · {scenario.toUpperCase()}</b></header><LineChart x={result.x} series={result.series} xLabel={result.xLabel} yLabel={result.yLabel} height={460} /></div><footer className="rates-curve-note"><b>{pick(locale, { en: "READ THE DIAGNOSTIC", es: "LEE EL DIAGNÓSTICO" })}</b><p>{pick(locale, { en: "A curve shock updates zero rates, discount factors, interval forwards and quote-space risk from one state. Hover or touch the chart for exact values.", es: "Un shock actualiza tipos cero, factores de descuento, forwards de tramo y riesgo en cotizaciones desde un único estado. Usa puntero o toque para valores exactos." })}</p></footer></div>
    </div>
  </div>;
}
