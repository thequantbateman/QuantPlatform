"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext does not provide next/link to direct Node component tests. */

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { pick, useI18n, type Locale } from "@/src/i18n";
import { discountFactor, zeroRate, type DiscountCurvePoint } from "@/src/quant/curves/rates";
import { applyCurveScenario, type CurveScenarioKind } from "@/src/quant/curves/scenarios";
import {
  bondPriceAnatomy,
  discountedBondCashFlows,
  priceBondFromCurve,
  type BondPriceAnatomy,
} from "@/src/quant/fixed-income/bonds";
import { carryRolldownAnalysis } from "@/src/quant/fixed-income/carry";
import { buildRateSpreadPnlGrid, calculateBondRisk, explainRateSpreadPnl } from "@/src/quant/fixed-income/risk";
import { assetSwapAnalytics, benchmarkYieldSpread, solveZSpread, swapSpreadAtTenor } from "@/src/quant/fixed-income/spreads";
import type { BondBenchmarkId, CouponFrequency, FixedRateBond } from "@/src/quant/fixed-income/types";
import type { AnalyticsPrimitive, AnalyticsScenario, LocalizedText } from "@/src/analytics/guidance/types";
import { AnalyticsGuide } from "./AnalyticsGuide";
import { FixedIncomeHeatmap, type FixedIncomeHeatmapSelection } from "./FixedIncomeHeatmap";
import { useAnalyticsGuidance } from "./useAnalyticsGuidance";
import { LineChart } from "@/src/components/charts/LineChart";
import { Formula } from "@/src/components/content/Formula";

type Mode = "bond" | "spreads" | "risk" | "curve" | "carry";
type BondPreset = "corporate" | "government";
type CurveView = "shock" | "krd" | "swap-spread" | "credit";

const TENORS = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30] as const;
const curve = (rates: readonly number[]): DiscountCurvePoint[] => TENORS.map((time, index) => ({ time, discount: discountFactor(rates[index], time) }));
const CURVES: Record<BondBenchmarkId, DiscountCurvePoint[]> = {
  government: curve([0.031, 0.032, 0.033, 0.0345, 0.0355, 0.037, 0.038, 0.039, 0.0405, 0.041]),
  swap: curve([0.033, 0.034, 0.0355, 0.037, 0.038, 0.0395, 0.0405, 0.0415, 0.0425, 0.043]),
  ois: curve([0.0305, 0.0312, 0.0325, 0.0338, 0.0347, 0.036, 0.0368, 0.0378, 0.0392, 0.0398]),
};

const PRESETS: Record<BondPreset, Omit<FixedRateBond, "cleanPrice"> & { cleanPrice: number }> = {
  corporate: { id: "TQB-CORP-7Y", faceValue: 100, annualCouponRate: 0.0475, couponFrequency: 2, settlementTime: 0.18, maturityTime: 7, cleanPrice: 96.8, currency: "USD" },
  government: { id: "TQB-GOV-5Y", faceValue: 100, annualCouponRate: 0.035, couponFrequency: 2, settlementTime: 0.18, maturityTime: 5, cleanPrice: 99.4, currency: "USD" },
};
const CREDIT_SPREAD_CURVE = [{ time: 1, spread: 0.0105 }, { time: 2, spread: 0.0115 }, { time: 3, spread: 0.0125 }, { time: 5, spread: 0.014 }, { time: 7, spread: 0.015 }, { time: 10, spread: 0.0165 }, { time: 20, spread: 0.018 }];
const MODES: readonly Mode[] = ["bond", "spreads", "risk", "curve", "carry"];
const RATE_GRID = [-50, -25, 0, 25, 50];
const SPREAD_GRID = [-50, -25, 0, 25, 50, 100];

const MODE_LABELS: Record<Locale, Record<Mode, string>> = {
  en: { bond: "Bond & cash flows", spreads: "Spread analytics", risk: "Rate vs spread risk", curve: "Curve & relative value", carry: "Carry & rolldown" },
  es: { bond: "Bono y flujos", spreads: "Analítica de spreads", risk: "Riesgo de tipos frente a spread", curve: "Curva y valor relativo", carry: "Carry y rolldown" },
};
const modeLabel = (locale: Locale, mode: Mode) => MODE_LABELS[locale][mode];

const benchmarkLabel = (locale: Locale, id: BondBenchmarkId) => ({
  government: pick(locale, { en: "Government curve", es: "Curva soberana" }),
  swap: pick(locale, { en: "Swap curve", es: "Curva swap" }),
  ois: pick(locale, { en: "OIS curve", es: "Curva OIS" }),
}[id]);

interface DerivedState {
  anatomy: BondPriceAnatomy;
  zSpread: number;
  curvePrice: number;
  governmentSpread: ReturnType<typeof benchmarkYieldSpread>;
  swapSpread: ReturnType<typeof benchmarkYieldSpread>;
  discountedCashFlows: ReturnType<typeof discountedBondCashFlows>;
  risk: ReturnType<typeof calculateBondRisk>;
  grid: ReturnType<typeof buildRateSpreadPnlGrid>;
  pnl: ReturnType<typeof explainRateSpreadPnl>;
  assetSwap: ReturnType<typeof assetSwapAnalytics>;
  carry: ReturnType<typeof carryRolldownAnalysis>;
}

function calculateState(bond: FixedRateBond, benchmark: BondBenchmarkId, rateShiftBps: number, spreadShiftBps: number, horizon: number, fundingRate: number): DerivedState {
  const selectedCurve = CURVES[benchmark];
  const z = solveZSpread(bond, selectedCurve);
  if (!z.converged) throw new Error("Z-spread solver did not converge.");
  const anatomy = bondPriceAnatomy(bond);
  const risk = calculateBondRisk(bond, selectedCurve, z.spread);
  return {
    anatomy,
    zSpread: z.spread,
    curvePrice: priceBondFromCurve(bond, selectedCurve, z.spread),
    governmentSpread: benchmarkYieldSpread(bond, CURVES.government),
    swapSpread: benchmarkYieldSpread(bond, CURVES.swap),
    discountedCashFlows: discountedBondCashFlows(bond, selectedCurve, z.spread),
    risk,
    grid: buildRateSpreadPnlGrid(bond, selectedCurve, z.spread, RATE_GRID, SPREAD_GRID),
    pnl: explainRateSpreadPnl(bond, selectedCurve, z.spread, rateShiftBps, spreadShiftBps),
    assetSwap: assetSwapAnalytics(bond, CURVES.swap),
    carry: carryRolldownAnalysis({ bond, benchmarkCurve: selectedCurve, spreadCurve: CREDIT_SPREAD_CURVE, currentSpread: z.spread, horizon, fundingRate }),
  };
}

function guidanceMetrics(state: DerivedState): Record<string, AnalyticsPrimitive> {
  return {
    bondPrice: state.anatomy.dirtyPrice,
    gSpreadBps: state.governmentSpread.spread * 10_000,
    iSpreadBps: state.swapSpread.spread * 10_000,
    zSpreadBps: state.zSpread * 10_000,
    benchmarkDv01: state.risk.benchmarkDv01,
    cs01: state.risk.cs01,
    ratePnl: state.pnl.ratePnl,
    spreadPnl: state.pnl.spreadPnl,
    totalContribution: state.carry.totalContribution,
  };
}

export function FixedIncomeLab() {
  const { formatNumber, locale } = useI18n();
  const [preset, setPreset] = useState<BondPreset>("corporate");
  const [bond, setBond] = useState<FixedRateBond>(PRESETS.corporate);
  const [benchmark, setBenchmark] = useState<BondBenchmarkId>("government");
  const [mode, setMode] = useState<Mode>("bond");
  const [rateShiftBps, setRateShiftBps] = useState(0);
  const [spreadShiftBps, setSpreadShiftBps] = useState(0);
  const [curveScenario, setCurveScenario] = useState<CurveScenarioKind>("parallel");
  const [curveShockBps, setCurveShockBps] = useState(25);
  const [curveView, setCurveView] = useState<CurveView>("shock");
  const [horizon, setHorizon] = useState(0.5);
  const [fundingRate, setFundingRate] = useState(0.03);
  const [selectedCashFlow, setSelectedCashFlow] = useState(0);
  const [heatSelection, setHeatSelection] = useState<FixedIncomeHeatmapSelection>({ row: 2, column: 2 });
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [beforeMetrics, setBeforeMetrics] = useState<Record<string, AnalyticsPrimitive> | null>(null);
  const { askAboutThis, publish, updateContext } = useAnalyticsGuidance({ labId: "fixed-income", model: "Cash-flow-aware fixed-income repricing" });

  const result = useMemo(() => {
    try { return { value: calculateState(bond, benchmark, rateShiftBps, spreadShiftBps, horizon, fundingRate), error: null }; }
    catch (error) { return { value: null, error: error instanceof Error ? error.message : "Invalid fixed-income state." }; }
  }, [benchmark, bond, fundingRate, horizon, rateShiftBps, spreadShiftBps]);
  const derived = result.value;
  const selectedFlow = derived?.discountedCashFlows[Math.min(selectedCashFlow, (derived?.discountedCashFlows.length ?? 1) - 1)] ?? null;
  const curveBefore = CURVES[benchmark];
  const curveAfter = applyCurveScenario(curveBefore, curveScenario, curveShockBps);
  const curveRates = (points: readonly DiscountCurvePoint[]) => points.map((point) => zeroRate(point.discount, point.time) * 100);
  const swapSpreads = TENORS.map((tenor) => swapSpreadAtTenor(CURVES.swap, CURVES.government, tenor) * 10_000);
  const relativeValueRows = useMemo(() => {
    if (!derived) return [];
    const comparables: FixedRateBond[] = [
      bond,
      { ...bond, id: "TQB-CORP-5Y", annualCouponRate: 0.0425, maturityTime: Math.max(bond.settlementTime + 1, 5), cleanPrice: 98.4 },
      { ...bond, id: "TQB-PEER-7Y", annualCouponRate: 0.05, cleanPrice: 94.9 },
    ];
    return comparables.map((item) => {
      const z = solveZSpread(item, curveBefore);
      const anatomy = bondPriceAnatomy(item);
      const risk = calculateBondRisk(item, curveBefore, z.spread);
      return { id: item.id, maturity: item.maturityTime - item.settlementTime, price: item.cleanPrice, ytm: anatomy.yieldToMaturity, zSpread: z.spread, spreadDuration: risk.spreadDuration, benchmarkDv01: risk.benchmarkDv01 };
    });
  }, [bond, curveBefore, derived]);
  const dv01NeutralRatio = relativeValueRows[1]?.benchmarkDv01
    ? (derived?.risk.benchmarkDv01 ?? 0) / relativeValueRows[1].benchmarkDv01
    : 0;
  const metrics = useMemo<Record<string, AnalyticsPrimitive>>(() => derived ? guidanceMetrics(derived) : {}, [derived]);
  const inputs = useMemo<Record<string, AnalyticsPrimitive>>(() => ({ bondPreset: preset, benchmark, mode, cleanPrice: bond.cleanPrice, coupon: bond.annualCouponRate, maturity: bond.maturityTime, rateShiftBps, spreadShiftBps, curveScenario, curveShockBps, horizon, fundingRate }), [benchmark, bond.annualCouponRate, bond.cleanPrice, bond.maturityTime, curveScenario, curveShockBps, fundingRate, horizon, mode, preset, rateShiftBps, spreadShiftBps]);

  useEffect(() => {
    updateContext({ scenarioId: activeScenarioId ?? undefined, inputs, metrics });
    try { localStorage.setItem("tqb-lab-context", JSON.stringify({ section: "fixed-income", model: "cash-flow-aware spread analytics", inputs, metrics })); } catch { /* Storage is optional. */ }
  }, [activeScenarioId, inputs, metrics, updateContext]);

  const copy = (value: LocalizedText) => pick(locale, value);
  const number = (value: number, digits = 2) => formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pct = (value: number) => `${number(value * 100, 3)}%`;
  const bps = (value: number) => `${number(value * 10_000, 1)} bp`;
  const money = (value: number) => number(value, 3);

  const reset = () => {
    setPreset("corporate"); setBond(PRESETS.corporate); setBenchmark("government"); setMode("bond"); setRateShiftBps(0); setSpreadShiftBps(0); setCurveScenario("parallel"); setCurveShockBps(25); setCurveView("shock"); setHorizon(0.5); setFundingRate(0.03); setActiveScenarioId(null); setBeforeMetrics(null);
  };
  const setPresetBond = (next: BondPreset) => { setPreset(next); setBond(PRESETS[next]); setSelectedCashFlow(0); };
  const setBondNumber = (field: "faceValue" | "annualCouponRate" | "maturityTime" | "cleanPrice", value: number) => setBond((current) => ({ ...current, [field]: value }));
  const applyScenario = (scenario: AnalyticsScenario) => {
    setBeforeMetrics(metrics);
    const next = scenario.initialInputs;
    const nextPreset = next.bondPreset === "government" || next.bondPreset === "corporate" ? next.bondPreset : preset;
    const nextBond = PRESETS[nextPreset];
    const nextBenchmark = next.benchmark === "government" || next.benchmark === "swap" || next.benchmark === "ois" ? next.benchmark : benchmark;
    const nextMode = MODES.includes(next.mode as Mode) ? next.mode as Mode : mode;
    const nextRate = typeof next.rateShiftBps === "number" ? next.rateShiftBps : rateShiftBps;
    const nextSpread = typeof next.spreadShiftBps === "number" ? next.spreadShiftBps : spreadShiftBps;
    const nextHorizon = typeof next.horizon === "number" ? next.horizon : horizon;
    const nextFunding = typeof next.fundingRate === "number" ? next.fundingRate : fundingRate;
    setPresetBond(nextPreset);
    setBenchmark(nextBenchmark);
    setMode(nextMode);
    setRateShiftBps(nextRate);
    setSpreadShiftBps(nextSpread);
    if (["parallel", "steepener", "flattener", "butterfly"].includes(String(next.curveScenario))) setCurveScenario(next.curveScenario as CurveScenarioKind);
    if (nextMode === "curve") setCurveView("shock");
    if (typeof next.curveShockBps === "number") setCurveShockBps(next.curveShockBps);
    setHorizon(nextHorizon);
    setFundingRate(nextFunding);
    setActiveScenarioId(scenario.id);
    const nextInputs = { ...inputs, ...next, bondPreset: nextPreset, benchmark: nextBenchmark, mode: nextMode, rateShiftBps: nextRate, spreadShiftBps: nextSpread, horizon: nextHorizon, fundingRate: nextFunding } as Record<string, AnalyticsPrimitive>;
    const nextState = calculateState(nextBond, nextBenchmark, nextRate, nextSpread, nextHorizon, nextFunding);
    publish({ kind: "scenario-loaded", scenarioId: scenario.id, inputs: nextInputs, metrics: guidanceMetrics(nextState) });
  };
  const announce = (kind: "benchmark" | "rate" | "spread", next: { benchmark?: BondBenchmarkId; rateShiftBps?: number; spreadShiftBps?: number } = {}) => {
    const nextBenchmark = next.benchmark ?? benchmark;
    const nextRate = next.rateShiftBps ?? rateShiftBps;
    const nextSpread = next.spreadShiftBps ?? spreadShiftBps;
    const nextState = calculateState(bond, nextBenchmark, nextRate, nextSpread, horizon, fundingRate);
    const nextInputs = { ...inputs, benchmark: nextBenchmark, rateShiftBps: nextRate, spreadShiftBps: nextSpread };
    const insight = kind === "benchmark"
      ? { title: { en: "Benchmark changed", es: "Benchmark cambiado" }, message: { en: "The bond didn't move. Your ruler did.", es: "El bono no se movió. Cambió tu regla." } }
      : kind === "rate"
        ? { title: { en: "Benchmark risk isolated", es: "Riesgo benchmark aislado" }, message: { en: "Credit is unchanged. You're seeing pure benchmark duration.", es: "El crédito no cambia. Estás viendo duración benchmark pura." } }
        : { title: { en: "Spread risk isolated", es: "Riesgo de spread aislado" }, message: { en: "The benchmark is unchanged. This P&L is coming from spread risk.", es: "El benchmark no cambia. Este P&L procede del riesgo de spread." } };
    publish({ kind: "comparison-created", scenarioId: activeScenarioId ?? undefined, inputs: nextInputs, metrics: guidanceMetrics(nextState), authoredInsight: { ...insight, contextSummary: { en: `${nextBenchmark}; rate ${nextRate}bp; spread ${nextSpread}bp`, es: `${nextBenchmark}; tipos ${nextRate}pb; spread ${nextSpread}pb` } } });
  };
  const moveMode = (event: KeyboardEvent<HTMLButtonElement>, current: Mode) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = MODES.indexOf(current);
    const target = event.key === "Home" ? 0 : event.key === "End" ? MODES.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + MODES.length) % MODES.length;
    setMode(MODES[target]);
    document.getElementById(`fixed-income-tab-${MODES[target]}`)?.focus();
  };

  return <main className="fixed-income-lab">
    <header className="fixed-income-hero section-shell">
      <div><span className="eyebrow">FIXED INCOME · {copy({ en: "SPREADS & CURVES", es: "SPREADS Y CURVAS" })}</span><h1>{locale === "en" ? <>FIXED INCOME,<br /><em>RELATIVE VALUE.</em></> : <>RENTA FIJA,<br /><em>VALOR RELATIVO.</em></>}</h1></div>
      <div><p>{copy({ en: "Price each cash flow, choose the ruler, calibrate the spread and separate benchmark risk from credit risk in one linked state.", es: "Valora cada flujo, elige la regla, calibra el spread y separa riesgo benchmark de riesgo de crédito en un único estado enlazado." })}</p><span>SYNTHETIC / EDUCATIONAL · DETERMINISTIC FULL REPRICING</span></div>
    </header>

    <div className="fixed-income-body section-shell">
      <AnalyticsGuide labId="fixed-income" activeScenarioId={activeScenarioId} snapshots={beforeMetrics ? { before: beforeMetrics, after: metrics } : null} onApply={applyScenario} onReset={reset} onManual={() => setActiveScenarioId(null)} onAsk={askAboutThis} />
      <section className="fixed-income-workbench" aria-labelledby="fixed-income-workbench-title">
        <header className="fixed-income-workbench-header"><div><span>ONE LINKED STATE</span><h2 id="fixed-income-workbench-title">{copy({ en: "What am I measuring—and against which curve?", es: "¿Qué estoy midiendo y contra qué curva?" })}</h2></div><div><small>{copy({ en: "Active benchmark", es: "Benchmark activo" })}</small><strong>{benchmarkLabel(locale, benchmark)}</strong></div></header>

        <div className="fixed-income-tabs" role="tablist" aria-label={copy({ en: "Fixed-income analysis mode", es: "Modo de análisis de renta fija" })}>{MODES.map((item, index) => <button type="button" role="tab" id={`fixed-income-tab-${item}`} aria-controls={`fixed-income-panel-${item}`} aria-selected={mode === item} tabIndex={mode === item ? 0 : -1} key={item} onClick={() => setMode(item)} onKeyDown={(event) => moveMode(event, item)}><span>0{index + 1}</span>{modeLabel(locale, item)}</button>)}</div>

        <div className="fixed-income-layout">
          <aside className="fixed-income-controls" aria-label={copy({ en: "Bond and benchmark controls", es: "Controles de bono y benchmark" })}>
            <div className="fixed-income-preset"><button type="button" aria-pressed={preset === "corporate"} onClick={() => setPresetBond("corporate")}>{copy({ en: "Corporate", es: "Corporativo" })}</button><button type="button" aria-pressed={preset === "government"} onClick={() => setPresetBond("government")}>{copy({ en: "Government", es: "Soberano" })}</button></div>
            <label><span>{copy({ en: "Face value", es: "Nominal" })}</span><input aria-label={copy({ en: "Face value", es: "Nominal" })} type="number" min="1" step="10" value={bond.faceValue} onChange={(event) => setBondNumber("faceValue", Number(event.currentTarget.value))} /></label>
            <label><span>{copy({ en: "Coupon", es: "Cupón" })}</span><input aria-label={copy({ en: "Coupon percent", es: "Cupón porcentual" })} type="number" min="0" max="30" step="0.05" value={bond.annualCouponRate * 100} onChange={(event) => setBondNumber("annualCouponRate", Number(event.currentTarget.value) / 100)} /><output>{pct(bond.annualCouponRate)}</output></label>
            <label><span>{copy({ en: "Frequency", es: "Frecuencia" })}</span><select aria-label={copy({ en: "Coupon frequency", es: "Frecuencia de cupón" })} value={bond.couponFrequency} onChange={(event) => setBond((current) => ({ ...current, couponFrequency: Number(event.currentTarget.value) as CouponFrequency }))}><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
            <label><span>{copy({ en: "Maturity", es: "Vencimiento" })}</span><input aria-label={copy({ en: "Maturity years", es: "Vencimiento en años" })} type="number" min="1" max="30" step="0.5" value={bond.maturityTime} onChange={(event) => setBondNumber("maturityTime", Math.max(1, Number(event.currentTarget.value)))} /><output>{bond.maturityTime.toFixed(1)}Y</output></label>
            <label><span>{copy({ en: "Clean price", es: "Precio clean" })}</span><input aria-label={copy({ en: "Clean price", es: "Precio clean" })} type="number" min="1" step="0.1" value={bond.cleanPrice} onChange={(event) => setBondNumber("cleanPrice", Number(event.currentTarget.value))} /></label>
            <fieldset><legend>{copy({ en: "Benchmark", es: "Benchmark" })}</legend>{(["government", "swap", "ois"] as const).map((item) => <button type="button" key={item} aria-pressed={benchmark === item} onClick={() => { setBenchmark(item); announce("benchmark", { benchmark: item }); }}>{benchmarkLabel(locale, item)}</button>)}</fieldset>
            <details><summary>{copy({ en: "Conventions", es: "Convenciones" })}</summary><dl><div><dt>{copy({ en: "Settlement", es: "Liquidación" })}</dt><dd>T+0.18Y educational</dd></div><div><dt>{copy({ en: "Day count", es: "Cómputo de días" })}</dt><dd>Regular year fractions</dd></div><div><dt>{copy({ en: "YTM", es: "YTM" })}</dt><dd>Periodic compounding</dd></div><div><dt>{copy({ en: "Z-spread", es: "Z-spread" })}</dt><dd>Continuous, parallel</dd></div><div><dt>{copy({ en: "Interpolation", es: "Interpolación" })}</dt><dd>Log-linear DF</dd></div></dl></details>
          </aside>

          <div className="fixed-income-main">
            {result.error && <p className="analytics-inline-warning" role="alert">{copy({ en: `Cannot calculate this state: ${result.error}`, es: `No se puede calcular este estado: ${result.error}` })}</p>}
            {derived && <>
              <section className="fixed-income-metrics" aria-label={copy({ en: "Bond and spread summary", es: "Resumen del bono y spreads" })}>
                <article><span>{copy({ en: "Dirty price", es: "Precio dirty" })}</span><strong>{money(derived.anatomy.dirtyPrice)}</strong><small>Clean {money(derived.anatomy.cleanPrice)} + AI {money(derived.anatomy.accruedInterest)}</small></article>
                <article><span>YTM</span><strong>{pct(derived.anatomy.yieldToMaturity)}</strong><small>{copy({ en: "single IRR", es: "TIR única" })}</small></article>
                <article><span>G-spread</span><strong>{bps(derived.governmentSpread.spread)}</strong><small>{copy({ en: "government yield ruler", es: "regla de yield soberana" })}</small></article>
                <article><span>I-spread</span><strong>{bps(derived.swapSpread.spread)}</strong><small>{copy({ en: "swap yield ruler", es: "regla de yield swap" })}</small></article>
                <article><span>Z-spread</span><strong>{bps(derived.zSpread)}</strong><small>{copy({ en: "cash-flow calibrated", es: "calibrado por flujos" })}</small></article>
                <article><span>{copy({ en: "Benchmark DV01", es: "DV01 benchmark" })}</span><strong>{money(derived.risk.benchmarkDv01)}</strong><small>{benchmarkLabel(locale, benchmark)}</small></article>
                <article><span>CS01</span><strong>{money(derived.risk.cs01)}</strong><small>{copy({ en: "parallel Z-spread +1bp", es: "Z-spread paralelo +1pb" })}</small></article>
              </section>

              {mode === "bond" && <section role="tabpanel" id="fixed-income-panel-bond" aria-labelledby="fixed-income-tab-bond" className="fixed-income-panel">
                <header><div><span>01 · CASH FLOWS → PRICE</span><h3>{copy({ en: "YTM summarizes the bond. The curve prices the cash flows.", es: "El YTM resume el bono. La curva valora los flujos." })}</h3></div><p>{copy({ en: "Select a payment to inspect its dated discount factor and present value.", es: "Selecciona un pago para inspeccionar su factor de descuento fechado y su valor actual." })}</p></header>
                <div className="cashflow-timeline" aria-label={copy({ en: "Bond cash-flow timeline", es: "Línea temporal de flujos del bono" })}><span>TODAY</span>{derived.discountedCashFlows.map((cashFlow, index) => <button type="button" aria-pressed={selectedCashFlow === index} key={cashFlow.index} onClick={() => setSelectedCashFlow(index)}><i /><b>{cashFlow.principal ? copy({ en: "Coupon + principal", es: "Cupón + principal" }) : copy({ en: "Coupon", es: "Cupón" })}</b><small>{cashFlow.paymentTime.toFixed(2)}Y</small></button>)}<span>MATURITY</span></div>
                {selectedFlow && <dl className="cashflow-readout"><div><dt>{copy({ en: "Payment time", es: "Fecha de pago" })}</dt><dd>{selectedFlow.paymentTime.toFixed(2)}Y</dd></div><div><dt>{copy({ en: "Amount", es: "Importe" })}</dt><dd>{money(selectedFlow.amount)}</dd></div><div><dt>{copy({ en: "Discount factor", es: "Factor de descuento" })}</dt><dd>{number(selectedFlow.discountFactor, 6)}</dd></div><div><dt>{copy({ en: "Present value", es: "Valor actual" })}</dt><dd>{money(selectedFlow.presentValue)}</dd></div></dl>}
                <div className="fixed-income-dual"><article><span>YTM</span><Formula latex={String.raw`P_{dirty}=\sum_i \frac{CF_i}{(1+y/f)^{f\tau_i}}`} /><p>{copy({ en: "One periodic internal rate reproduces the market dirty price.", es: "Un único tipo interno periódico reproduce el precio dirty de mercado." })}</p></article><article><span>ZERO CURVE</span><Formula latex={String.raw`P=\sum_i CF_i\,DF(0,t_i)`} /><p>{copy({ en: "Each dated cash flow uses its own term-structure discount factor.", es: "Cada flujo fechado usa su propio factor de la estructura temporal." })}</p></article></div>
                <details className="fixed-income-detail"><summary>{copy({ en: "Price anatomy and local yield risk", es: "Anatomía del precio y riesgo local de yield" })}</summary><dl><div><dt>{copy({ en: "Macaulay duration", es: "Duración Macaulay" })}</dt><dd>{number(derived.anatomy.macaulayDuration, 3)}Y</dd></div><div><dt>{copy({ en: "Modified duration", es: "Duración modificada" })}</dt><dd>{number(derived.anatomy.modifiedDuration, 3)}Y</dd></div><div><dt>{copy({ en: "Convexity", es: "Convexidad" })}</dt><dd>{number(derived.anatomy.convexity, 3)}</dd></div><div><dt>{copy({ en: "Yield DV01", es: "DV01 de yield" })}</dt><dd>{money(derived.anatomy.yieldDv01)}</dd></div></dl><p>{copy({ en: "Yield DV01 bumps the bond's summary YTM. Benchmark DV01 below bumps the selected zero curve; they are not interchangeable labels.", es: "El DV01 de yield mueve el YTM resumen. El DV01 benchmark mueve la curva cero seleccionada; no son etiquetas intercambiables." })}</p></details>
              </section>}

              {mode === "spreads" && <section role="tabpanel" id="fixed-income-panel-spreads" aria-labelledby="fixed-income-tab-spreads" className="fixed-income-panel">
                <header><div><span>02 · BENCHMARK → SPREAD</span><h3>{copy({ en: "A spread has no meaning without its benchmark.", es: "Un spread no tiene significado sin su benchmark." })}</h3></div><p>{copy({ en: "The same bond is measured against government, swap and full zero-curve rulers.", es: "El mismo bono se mide contra reglas soberanas, swap y de curva cero completa." })}</p></header>
                <LineChart x={curveBefore.map((point) => point.time)} series={[{ name: benchmarkLabel(locale, benchmark), values: curveRates(curveBefore) }, { name: copy({ en: "Benchmark + Z-spread", es: "Benchmark + Z-spread" }), values: curveRates(curveBefore).map((rate) => rate + derived.zSpread * 100) }]} xLabel={copy({ en: "Maturity (Years)", es: "Vencimiento (Años)" })} yLabel={copy({ en: "Yield / zero rate (%)", es: "Yield / tipo cero (%)" })} xFormatter={(value) => `${value.toFixed(1)}Y`} yFormatter={(value) => `${value.toFixed(2)}%`} description={copy({ en: "Active benchmark zero curve and the same curve shifted by the calibrated Z-spread.", es: "Curva cero benchmark activa y la misma curva desplazada por el Z-spread calibrado." })} showTable />
                <div className="spread-map" aria-label={copy({ en: "Spread decision map", es: "Mapa de decisión de spreads" })}>{[
                  ["G-SPREAD", copy({ en: "YTM − government benchmark", es: "YTM − benchmark soberano" }), "government"],
                  ["I-SPREAD", copy({ en: "YTM − swap benchmark", es: "YTM − benchmark swap" }), "swap"],
                  ["Z-SPREAD", copy({ en: "Full schedule through zero curve", es: "Calendario completo por curva cero" }), benchmark],
                  ["OAS", copy({ en: "State-dependent cash flows required", es: "Requiere flujos dependientes del estado" }), benchmark],
                  ["ASW", copy({ en: "Bond + swap → floating + spread", es: "Bono + swap → flotante + spread" }), "swap"],
                ].map(([name, description, target]) => <button type="button" key={name} onClick={() => { if (target === "government" || target === "swap" || target === "ois") setBenchmark(target); }}><b>{name}</b><span>{description}</span></button>)}</div>
                <div className="fixed-income-dual"><article><span>Z-SPREAD SOLVER</span><Formula latex={String.raw`P_{market}=\sum_i CF_i\,DF(0,t_i)e^{-s_Zt_i}`} /><p>{copy({ en: `Converged at ${bps(derived.zSpread)}; repriced dirty value ${money(derived.curvePrice)}.`, es: `Convergió en ${bps(derived.zSpread)}; valor dirty revalorado ${money(derived.curvePrice)}.` })}</p></article><article><span>ASSET SWAP</span><Formula latex={String.raw`s_{ASW}=\frac{P_{benchmark}-P_{market}}{N\,A_{swap}}`} /><p>{copy({ en: `ASW ${bps(derived.assetSwap.spread)} · par swap ${pct(derived.assetSwap.parSwapRate)} · annuity ${number(derived.assetSwap.annuity, 4)}.`, es: `ASW ${bps(derived.assetSwap.spread)} · swap par ${pct(derived.assetSwap.parSwapRate)} · anualidad ${number(derived.assetSwap.annuity, 4)}.` })}</p></article></div>
                <div className="asset-swap-flow" aria-label={copy({ en: "Asset-swap cash-flow transformation", es: "Transformación de flujos de asset swap" })}><span>{copy({ en: "Fixed-rate bond", es: "Bono a tipo fijo" })}<small>{copy({ en: "coupon + principal", es: "cupón + principal" })}</small></span><b>+</b><span>{copy({ en: "Interest-rate swap", es: "Swap de tipos" })}<small>{copy({ en: "pay fixed / receive floating", es: "paga fijo / recibe flotante" })}</small></span><b>→</b><span>{copy({ en: "Floating + ASW", es: "Flotante + ASW" })}<small>{copy({ en: "issuer risk remains", es: "permanece riesgo emisor" })}</small></span></div>
                <p className="fixed-income-coach">{copy({ en: "G-spread compared two yields. Z-spread is forcing the entire cash-flow schedule through the zero curve.", es: "G-spread comparó dos yields. Z-spread fuerza todo el calendario de flujos a través de la curva cero." })}</p>
              </section>}

              {mode === "risk" && <section role="tabpanel" id="fixed-income-panel-risk" aria-labelledby="fixed-income-tab-risk" className="fixed-income-panel">
                <header><div><span>03 · RATE × CREDIT</span><h3>{copy({ en: "Full-repricing P&L across two independent risk axes.", es: "P&L por revaloración completa en dos ejes de riesgo independientes." })}</h3></div><div className="risk-quick-controls"><label>{copy({ en: "Rate shock", es: "Shock de tipos" })}<select value={rateShiftBps} onChange={(event) => { const value = Number(event.currentTarget.value); setRateShiftBps(value); announce("rate", { rateShiftBps: value }); }}>{[-50, -25, 0, 25, 50].map((value) => <option key={value}>{value}</option>)}</select></label><label>{copy({ en: "Spread shock", es: "Shock de spread" })}<select value={spreadShiftBps} onChange={(event) => { const value = Number(event.currentTarget.value); setSpreadShiftBps(value); announce("spread", { spreadShiftBps: value }); }}>{[-50, -25, 0, 10, 25, 50, 100].map((value) => <option key={value}>{value}</option>)}</select></label></div></header>
                <FixedIncomeHeatmap grid={derived.grid} selected={heatSelection} onSelect={(selection) => { setHeatSelection(selection); const point = derived.grid.points[selection.row][selection.column]; setRateShiftBps(point.rateShiftBps); setSpreadShiftBps(point.spreadShiftBps); }} />
                <dl className="risk-decomposition"><div><dt>{copy({ en: "Rate P&L", es: "P&L de tipos" })}</dt><dd>{money(derived.pnl.ratePnl)}</dd></div><div><dt>{copy({ en: "Spread P&L", es: "P&L de spread" })}</dt><dd>{money(derived.pnl.spreadPnl)}</dd></div><div><dt>{copy({ en: "Interaction", es: "Interacción" })}</dt><dd>{money(derived.pnl.interactionPnl)}</dd></div><div><dt>{copy({ en: "Total P&L", es: "P&L total" })}</dt><dd>{money(derived.pnl.totalPnl)}</dd></div></dl>
                <div className="fixed-income-dual"><article><span>{copy({ en: "SPREAD RISK", es: "RIESGO DE SPREAD" })}</span><Formula latex={String.raw`\frac{\Delta P}{P}\approx-D_s\Delta s`} /><p>{copy({ en: `Spread duration ${number(derived.risk.spreadDuration, 3)}Y · DTS ${number(derived.risk.dts, 1)}. DTS is a portfolio-risk heuristic, not a pricing model.`, es: `Duración de spread ${number(derived.risk.spreadDuration, 3)}A · DTS ${number(derived.risk.dts, 1)}. DTS es una heurística de riesgo, no un modelo de valoración.` })}</p></article><article><span>{copy({ en: "FULL REPRICING", es: "REVALORACIÓN COMPLETA" })}</span><p>{copy({ en: "Benchmark and spread shifts reprice every cash flow. The interaction term reconciles nonlinear total P&L.", es: "Los shocks benchmark y de spread revaloran cada flujo. La interacción reconcilia el P&L total no lineal." })}</p></article></div>
              </section>}

              {mode === "curve" && <section role="tabpanel" id="fixed-income-panel-curve" aria-labelledby="fixed-income-tab-curve" className="fixed-income-panel">
                <header><div><span>04 · LEVEL · SLOPE · CURVATURE</span><h3>{copy({ en: "Direction and shape are different dimensions.", es: "Dirección y forma son dimensiones distintas." })}</h3></div><div className="risk-quick-controls"><label>{copy({ en: "Curve scenario", es: "Escenario de curva" })}<select value={curveScenario} onChange={(event) => setCurveScenario(event.currentTarget.value as CurveScenarioKind)}>{(["parallel", "steepener", "flattener", "butterfly"] as const).map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>{copy({ en: "Magnitude", es: "Magnitud" })}<input type="number" step="5" value={curveShockBps} onChange={(event) => setCurveShockBps(Number(event.currentTarget.value))} /></label></div></header>
                <div className="fixed-income-subtabs" role="tablist" aria-label={copy({ en: "Curve and relative-value view", es: "Vista de curva y valor relativo" })}>{(["shock", "krd", "swap-spread", "credit"] as const).map((item) => <button type="button" role="tab" aria-selected={curveView === item} key={item} onClick={() => setCurveView(item)}>{({ shock: copy({ en: "Curve shock", es: "Shock de curva" }), krd: "KRD", "swap-spread": copy({ en: "Swap spreads", es: "Swap spreads" }), credit: copy({ en: "Credit curve", es: "Curva de crédito" }) })[item]}</button>)}</div>
                {curveView === "shock" && <LineChart x={curveBefore.map((point) => point.time)} series={[{ name: copy({ en: "Before curve", es: "Curva inicial" }), values: curveRates(curveBefore) }, { name: copy({ en: "After curve", es: "Curva final" }), values: curveRates(curveAfter) }]} xLabel={copy({ en: "Maturity (Years)", es: "Vencimiento (Años)" })} yLabel={copy({ en: "Zero rate (%)", es: "Tipo cero (%)" })} xFormatter={(value) => `${value.toFixed(1)}Y`} yFormatter={(value) => `${value.toFixed(2)}%`} description={copy({ en: `${curveScenario} zero-curve shock with explicit financial axes.`, es: `Shock ${curveScenario} de curva cero con ejes financieros explícitos.` })} showTable />}
                {curveView === "krd" && <LineChart x={derived.risk.keyRateDv01.map((point) => point.tenor)} series={[{ name: copy({ en: "Key-rate DV01", es: "DV01 key-rate" }), values: derived.risk.keyRateDv01.map((point) => point.dv01) }]} xLabel={copy({ en: "Key Rate Tenor (Years)", es: "Tenor key-rate (Años)" })} yLabel="DV01" xFormatter={(value) => `${value.toFixed(1)}Y`} yFormatter={(value) => value.toFixed(4)} description={copy({ en: "One-basis-point zero-node bumps under the shared curve interpolation.", es: "Bumps de un punto básico por nodo cero bajo la interpolación compartida." })} showTable />}
                {curveView === "swap-spread" && <LineChart x={TENORS} series={[{ name: copy({ en: "Swap spread", es: "Swap spread" }), values: swapSpreads }]} xLabel={copy({ en: "Tenor (Years)", es: "Tenor (Años)" })} yLabel={copy({ en: "Swap Spread (bps)", es: "Swap Spread (pb)" })} xFormatter={(value) => `${value.toFixed(1)}Y`} yFormatter={(value) => `${value.toFixed(1)}bp`} description={copy({ en: "Par/zero proxy swap rate minus the matched government benchmark. Supply, funding, liquidity and balance-sheet forces can all matter.", es: "Proxy par/cero swap menos benchmark soberano equivalente. Oferta, funding, liquidez y balance pueden influir." })} showTable />}
                {curveView === "credit" && <LineChart x={CREDIT_SPREAD_CURVE.map((point) => point.time)} series={[{ name: copy({ en: "Synthetic issuer spread curve", es: "Curva sintética de spread emisor" }), values: CREDIT_SPREAD_CURVE.map((point) => point.spread * 10_000) }]} xLabel={copy({ en: "Maturity (Years)", es: "Vencimiento (Años)" })} yLabel={copy({ en: "Spread (bps)", es: "Spread (pb)" })} xFormatter={(value) => `${value.toFixed(1)}Y`} yFormatter={(value) => `${value.toFixed(1)}bp`} description={copy({ en: "Synthetic educational issuer term structure; no live credit data is implied.", es: "Estructura temporal sintética y educativa del emisor; no implica datos de crédito en vivo." })} showTable />}
                <div className="fixed-income-dual"><article><span>2s10s · {copy({ en: "SLOPE", es: "PENDIENTE" })}</span><Formula latex={String.raw`2s10s=y_{10Y}-y_{2Y}`} /><p>{number((zeroRate(curveBefore[7].discount, 10) - zeroRate(curveBefore[3].discount, 2)) * 10_000, 1)} bp · {copy({ en: "10Y swap spread", es: "swap spread 10A" })} {number(swapSpreadAtTenor(CURVES.swap, CURVES.government, 10) * 10_000, 1)} bp</p></article><article><span>{copy({ en: "5Y BUTTERFLY CONVENTION", es: "CONVENCIÓN BUTTERFLY 5A" })}</span><Formula latex={String.raw`Fly_{2,5,10}=y_{2Y}+y_{10Y}-2y_{5Y}`} /><p>{number((zeroRate(curveBefore[3].discount, 2) + zeroRate(curveBefore[7].discount, 10) - 2 * zeroRate(curveBefore[5].discount, 5)) * 10_000, 1)} bp</p></article></div>
                <details className="fixed-income-detail"><summary>{copy({ en: "Relative-value comparison", es: "Comparación de valor relativo" })}</summary><div className="fixed-income-table-wrap"><table><thead><tr><th>{copy({ en: "Bond", es: "Bono" })}</th><th>{copy({ en: "Maturity", es: "Vencimiento" })}</th><th>{copy({ en: "Clean price", es: "Precio clean" })}</th><th>YTM</th><th>Z-spread</th><th>{copy({ en: "Spread duration", es: "Duración de spread" })}</th></tr></thead><tbody>{relativeValueRows.map((row) => <tr key={row.id}><th>{row.id}</th><td>{row.maturity.toFixed(2)}Y</td><td>{money(row.price)}</td><td>{pct(row.ytm)}</td><td>{bps(row.zSpread)}</td><td>{number(row.spreadDuration, 3)}Y</td></tr>)}</tbody></table></div><p>{copy({ en: "The 5Y row isolates same-issuer curve location; the peer row holds maturity approximately constant. Spread alone does not identify rating, liquidity, seniority or optionality.", es: "La fila 5A aísla la posición en curva del mismo emisor; la fila peer mantiene aproximadamente el vencimiento. El spread por sí solo no identifica rating, liquidez, seniority u opcionalidad." })}</p></details>
                <p className="fixed-income-coach">{copy({ en: `Equal notionals do not imply equal rate risk. The 5Y comparable needs ${dv01NeutralRatio.toFixed(2)} units per unit of the current bond to match benchmark DV01 before choosing trade direction.`, es: `Nominales iguales no implican riesgo de tipos igual. El comparable 5A necesita ${dv01NeutralRatio.toFixed(2)} unidades por unidad del bono actual para igualar el DV01 benchmark antes de elegir la dirección del trade.` })}</p>
              </section>}

              {mode === "carry" && <section role="tabpanel" id="fixed-income-panel-carry" aria-labelledby="fixed-income-tab-carry" className="fixed-income-panel">
                <header><div><span>05 · CONDITIONAL SCENARIO</span><h3>{copy({ en: "Carry & rolldown under unchanged curves.", es: "Carry y rolldown con curvas sin cambios." })}</h3></div><div className="risk-quick-controls"><label>{copy({ en: "Horizon", es: "Horizonte" })}<select value={horizon} onChange={(event) => setHorizon(Number(event.currentTarget.value))}><option value="0.25">3M</option><option value="0.5">6M</option><option value="1">12M</option></select></label><label>{copy({ en: "Funding rate", es: "Tipo de funding" })}<input type="number" step="0.25" value={fundingRate * 100} onChange={(event) => setFundingRate(Number(event.currentTarget.value) / 100)} /></label></div></header>
                <dl className="carry-waterfall"><div><dt>{copy({ en: "Coupon / pull-to-par carry", es: "Carry de cupón / pull-to-par" })}</dt><dd>{money(derived.carry.carry)}</dd></div><div><dt>{copy({ en: "Curve rolldown", es: "Rolldown de curva" })}</dt><dd>{money(derived.carry.curveRolldown)}</dd></div><div><dt>{copy({ en: "Spread rolldown", es: "Rolldown de spread" })}</dt><dd>{money(derived.carry.spreadRolldown)}</dd></div><div><dt>{copy({ en: "Funding", es: "Funding" })}</dt><dd>{money(derived.carry.funding)}</dd></div><div><dt>{copy({ en: "Total hypothetical contribution", es: "Contribución hipotética total" })}</dt><dd>{money(derived.carry.totalContribution)}</dd></div></dl>
                <div className="fixed-income-dual"><article><span>{copy({ en: "ROLLED COORDINATES", es: "COORDENADAS TRAS EL ROLL" })}</span><p>{copy({ en: `Remaining maturity moves to ${(bond.maturityTime - bond.settlementTime - horizon).toFixed(2)}Y; benchmark ${pct(derived.carry.rolledBenchmarkRate)}; issuer spread ${bps(derived.carry.rolledSpread)}.`, es: `El vencimiento restante pasa a ${(bond.maturityTime - bond.settlementTime - horizon).toFixed(2)}A; benchmark ${pct(derived.carry.rolledBenchmarkRate)}; spread emisor ${bps(derived.carry.rolledSpread)}.` })}</p></article><article><span>{copy({ en: "ASSUMPTION", es: "SUPUESTO" })}</span><strong>{copy({ en: "UNCHANGED CURVES", es: "CURVAS SIN CAMBIOS" })}</strong><p>{copy({ en: "No probability or guarantee is attached to this holding-period decomposition.", es: "Esta descomposición de mantenimiento no incorpora probabilidad ni garantía." })}</p></article></div>
                <p className="fixed-income-coach">{copy({ en: "Rolldown isn't free money. You're assuming the curve you roll down doesn't move against you.", es: "El rolldown no es dinero gratis. Asumes que la curva por la que avanzas no se mueve en tu contra." })}</p>
              </section>}
            </>}
          </div>
        </div>
      </section>

      <section className="fixed-income-quality-gates" aria-label={copy({ en: "Advanced methodology gates", es: "Gates de metodología avanzada" })}>
        <details><summary>OAS QUALITY GATE · NOT MODELED</summary><p>{copy({ en: "OAS needs validated interest-rate dynamics, exercise policy and state-dependent cash flows. This deterministic engine will not publish a fake Z-spread-minus-option shortcut.", es: "OAS necesita dinámica de tipos validada, política de ejercicio y flujos dependientes del estado. Este motor determinista no publicará un atajo falso de Z-spread menos opción." })}</p><a href="/learn/rates/caps-floors-swaptions">{copy({ en: "Study rate optionality", es: "Estudiar opcionalidad de tipos" })} →</a></details>
        <details><summary>CDS-BOND BASIS GATE · NOT MODELED</summary><p>{copy({ en: "A defensible basis requires CDS convention, recovery, funding, repo, liquidity and transaction-cost inputs. The current engine has no CDS leg and therefore shows no synthetic basis number.", es: "Una base defendible requiere convención CDS, recovery, funding, repo, liquidez y costes. El motor actual no tiene pata CDS y por ello no muestra una base sintética." })}</p></details>
      </section>
      <footer className="fixed-income-method"><div><span>{copy({ en: "MODEL BOUNDARY", es: "LÍMITE DEL MODELO" })}</span><p>{copy({ en: "Regular fixed-rate cash flows; deterministic continuously compounded zero curves; log-linear discount-factor interpolation; periodic YTM; continuously compounded Z-spread; matched-schedule single-curve ASW; full deterministic repricing. No live credit data, calendars, taxes, default, liquidity or stochastic rates.", es: "Flujos fijos regulares; curvas cero deterministas continuas; interpolación log-lineal de factores; YTM periódico; Z-spread continuo; ASW de curva única y calendario alineado; revaloración determinista completa. Sin datos de crédito en vivo, calendarios, impuestos, default, liquidez ni tipos estocásticos." })}</p></div><nav aria-label={copy({ en: "Related Academy lessons", es: "Lecciones relacionadas" })}><a href="/learn/rates/discount-factors">{copy({ en: "Understand discount factors", es: "Entender factores de descuento" })} →</a><a href="/learn/rates/curve-bootstrapping">{copy({ en: "Learn bootstrapping", es: "Aprender bootstrap" })} →</a><a href="/learn/rates/curve-risk">{copy({ en: "Understand curve risk", es: "Entender riesgo de curva" })} →</a><a href="/learn/rates/interest-rate-swaps">{copy({ en: "Understand swaps", es: "Entender swaps" })} →</a></nav></footer>
    </div>
  </main>;
}
