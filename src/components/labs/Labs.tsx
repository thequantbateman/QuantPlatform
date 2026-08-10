"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@/src/components/charts/LineChart";
import { SurfaceCanvas } from "@/src/components/charts/SurfaceCanvas";
import { blackScholes, type BlackScholesInput } from "@/src/quant/models/blackScholes";
import { impliedVolatility } from "@/src/quant/volatility/impliedVolatility";
import { priceVanilla, scenarioGrid, type GreekMetric, type VanillaInput, type VanillaMode } from "@/src/quant/pricing/vanilla";
import { bootstrapCurve, type CurveNode } from "@/src/quant/curves/rates";
import { syntheticVolatility, type SurfaceParameters } from "@/src/quant/volatility/syntheticSurface";
import { pick, useI18n } from "@/src/i18n";
import { TheQuantBatemanAvatar, type BatemanAnimationState } from "@/src/components/avatar/Avatar";
import { validateWithQuantEngine, type QuantEngineState } from "@/src/data/quantEngineClient";

type LabId = "vanilla" | "black-scholes" | "greeks" | "surface" | "curve";

const labIds: LabId[] = ["vanilla", "black-scholes", "greeks", "surface", "curve"];

export function Labs() {
  const { t, locale } = useI18n();
  const labTabs = [
    { id: "vanilla" as const, index: "01", label: pick(locale, { en: "Vanilla Pricer", es: "Pricer Vanilla" }), description: pick(locale, { en: "3 models + scenarios", es: "3 modelos + escenarios" }) },
    { id: "black-scholes" as const, index: "02", label: t("lab.bs"), description: t("lab.bsDesc") },
    { id: "greeks" as const, index: "03", label: t("lab.greeks"), description: t("lab.greeksDesc") },
    { id: "surface" as const, index: "04", label: t("lab.vol"), description: t("lab.volDesc") },
    { id: "curve" as const, index: "05", label: t("lab.curve"), description: t("lab.curveDesc") },
  ];
  const [active, setActive] = useState<LabId>("black-scholes");
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("lab") as LabId | null; if (requested && labIds.includes(requested)) window.setTimeout(() => setActive(requested), 0); }, []);
  return (
    <div className="lab-page">
      <header className="page-hero section-shell compact-hero">
        <span className="eyebrow">{t("lab.eyebrow")}</span>
        <h1>{t("lab.title")}</h1>
        <p>{t("lab.copy")}</p>
      </header>
      <div className="lab-tabs section-shell" role="tablist" aria-label="Quant labs">
        {labTabs.map((lab) => <button type="button" role="tab" aria-selected={active === lab.id} className={active === lab.id ? "active" : ""} onClick={() => setActive(lab.id)} key={lab.id}><span>{lab.index}</span><strong>{lab.label}</strong><small>{lab.description}</small></button>)}
      </div>
      <section className="lab-workspace section-shell">
        {active === "vanilla" && <VanillaOptionLab />}
        {active === "black-scholes" && <BlackScholesLab />}
        {active === "greeks" && <GreeksLab />}
        {active === "surface" && <VolatilitySurfaceLab />}
        {active === "curve" && <YieldCurveLab />}
      </section>
    </div>
  );
}

function ParameterInput({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="parameter-input">
      <span><b>{label}</b><em>{suffix}</em></span>
      <div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><input type="number" min={min} max={max} step={step} value={Number(value.toFixed(6))} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value))))} aria-label={`${label} exact value`} /></div>
    </label>
  );
}

const baseOption: BlackScholesInput = { spot: 100, strike: 100, time: 1, rate: 0.04, dividend: 0.01, volatility: 0.2, type: "call" };

const vanillaDefaults: VanillaInput = { mode: "equity", underlying: "AAPL", spot: 218.44, forward: 71.84, strike: 220, time: 1, rate: 0.04, foreignRate: 0.01, volatility: 0.22, type: "call", notional: 1 };
const metricOptions: GreekMetric[] = ["price", "delta", "gamma", "vega", "theta", "rho"];

function VanillaOptionLab() {
  const { locale } = useI18n(); const [input, setInput] = useState<VanillaInput>(vanillaDefaults); const [advanced, setAdvanced] = useState(false); const [metric, setMetric] = useState<GreekMetric>("vega"); const [avatarState, setAvatarState] = useState<BatemanAnimationState>("idle"); const [codeTab, setCodeTab] = useState<"formula" | "python" | "test">("formula"); const [ivPrice, setIvPrice] = useState(12); const [ivMessage, setIvMessage] = useState(""); const [engineState, setEngineState] = useState<QuantEngineState>("fallback");
  useEffect(() => { const query = new URLSearchParams(window.location.search); const mode = query.get("mode") as VanillaMode | null; const spot = Number(query.get("spot")); const symbol = query.get("symbol"); if (mode && ["equity", "fx", "forward"].includes(mode)) window.setTimeout(() => setInput((current) => ({ ...current, mode, spot: Number.isFinite(spot) && spot > 0 ? spot : current.spot, forward: Number.isFinite(spot) && spot > 0 ? spot : current.forward, strike: Number.isFinite(spot) && spot > 0 ? spot : current.strike, underlying: symbol ?? current.underlying })), 0); }, []);
  useEffect(() => { const controller = new AbortController(); const timer = window.setTimeout(() => { validateWithQuantEngine(input, controller.signal).then(setEngineState).catch(() => setEngineState("fallback")); }, 120); return () => { window.clearTimeout(timer); controller.abort(); }; }, [input]);
  const analytics = useMemo(() => priceVanilla(input), [input]); const grid = useMemo(() => scenarioGrid(input, metric), [input, metric]); const baseLevel = input.mode === "forward" ? input.forward : input.spot; const levels = useMemo(() => Array.from({ length: 61 }, (_, index) => baseLevel * (0.65 + index * 0.012)), [baseLevel]); const riskValues = useMemo(() => levels.map((level) => priceVanilla({ ...input, spot: level, forward: level })[metric]), [levels, input, metric]); const payoff = useMemo(() => levels.map((level) => Math.max((input.type === "call" ? 1 : -1) * (level - input.strike), 0) * input.notional), [levels, input.type, input.strike, input.notional]); const todayValue = useMemo(() => levels.map((level) => priceVanilla({ ...input, spot: level, forward: level }).price), [levels, input]); const model = input.mode === "fx" ? "Garman–Kohlhagen" : input.mode === "forward" ? "Black–76" : "Black–Scholes–Merton";
  const update = <K extends keyof VanillaInput>(key: K, value: VanillaInput[K]) => { setAvatarState("working"); setInput((current) => ({ ...current, [key]: value })); window.setTimeout(() => setAvatarState("explaining"), 260); };
  const solveIv = () => { try { const common = { marketPrice: ivPrice, strike: input.strike, time: input.time, rate: input.rate, type: input.type }; const result = input.mode === "forward" ? impliedVolatility({ model: "black76", ...common, forward: input.forward }) : impliedVolatility({ model: input.mode === "fx" ? "gk" : "bsm", ...common, spot: input.spot, dividend: input.foreignRate }); setIvMessage(`${(result.volatility * 100).toFixed(4)}% · ${result.iterations} iter · residual ${result.residual.toExponential(2)}`); setAvatarState("success"); } catch (error) { setIvMessage(error instanceof Error ? error.message : "Solver error"); setAvatarState("skeptical"); } };
  const modeCopy = { equity: { symbol: "AAPL", spot: 218.44, strike: 220, vol: .22 }, fx: { symbol: "EURUSD", spot: 1.1642, strike: 1.17, vol: .095 }, forward: { symbol: "BRENT", spot: 71.84, strike: 72, vol: .28 } };
  return <div className="experiment vanilla-pricer">
    <LabHeader index="01" title={pick(locale, { en: "Vanilla Option Workstation", es: "Estación de Opciones Vanilla" })} copy={pick(locale, { en: "Move from a source-labelled underlying through model, price, risk, scenarios, mathematics and implementation.", es: "Avanza desde un subyacente con fuente hasta modelo, precio, riesgo, escenarios, matemáticas e implementación." })} note={`${model} · ACT/365-like · continuous rates`} />
    <div className="pricer-toolbar"><div className="mode-picker">{(["equity", "fx", "forward"] as VanillaMode[]).map((mode) => <button className={input.mode === mode ? "active" : ""} onClick={() => { const seed = modeCopy[mode]; setInput({ ...vanillaDefaults, mode, underlying: seed.symbol, spot: seed.spot, forward: seed.spot, strike: seed.strike, volatility: seed.vol }); }} key={mode}>{mode === "forward" ? "FORWARD / FUTURES" : mode.toUpperCase()}</button>)}</div><label className="mode-toggle"><input type="checkbox" checked={advanced} onChange={(event) => setAdvanced(event.target.checked)} />{advanced ? "ADVANCED" : "SIMPLE"}</label><div className="engine-health" title={engineState === "online" ? "FastAPI response validated" : "Deterministic TypeScript fallback active"}><i /> QUANT ENGINE · {engineState === "online" ? "FASTAPI ONLINE" : "LOCAL FALLBACK"}</div></div>
    <div className="pricer-grid"><aside className="control-panel trade-ticket"><div className="control-heading"><span>TRADE</span><b>{model}</b></div><div className="lineage-row"><span>{input.underlying}</span><strong>{baseLevel.toFixed(baseLevel < 10 ? 4 : 2)}</strong><em>DEMO · TQB frozen scenario</em></div><div className="segmented"><button className={input.type === "call" ? "active" : ""} onClick={() => update("type", "call")}>Call</button><button className={input.type === "put" ? "active" : ""} onClick={() => update("type", "put")}>Put</button></div><ParameterInput label={input.mode === "forward" ? "Forward" : "Spot"} suffix="MARKET / USER" value={baseLevel} min={baseLevel < 10 ? .5 : 20} max={baseLevel < 10 ? 2 : 400} step={baseLevel < 10 ? .0001 : .5} onChange={(value) => update(input.mode === "forward" ? "forward" : "spot", value)} /><ParameterInput label="Strike" suffix="USER" value={input.strike} min={baseLevel < 10 ? .5 : 20} max={baseLevel < 10 ? 2 : 400} step={baseLevel < 10 ? .0001 : .5} onChange={(value) => update("strike", value)} /><ParameterInput label="Volatility" suffix="USER · decimal" value={input.volatility} min={.001} max={1} step={.001} onChange={(value) => update("volatility", value)} /><ParameterInput label="Time" suffix="years" value={input.time} min={.003} max={5} step={.01} onChange={(value) => update("time", value)} /><ParameterInput label={input.mode === "fx" ? "Domestic rate" : "Rate"} suffix="decimal" value={input.rate} min={-.02} max={.15} step={.001} onChange={(value) => update("rate", value)} />{(advanced || input.mode !== "forward") && <ParameterInput label={input.mode === "fx" ? "Foreign rate" : "Dividend yield"} suffix="decimal" value={input.foreignRate} min={0} max={.15} step={.001} onChange={(value) => update("foreignRate", value)} />}{advanced && <ParameterInput label="Notional" suffix="units" value={input.notional} min={1} max={1000000} step={1} onChange={(value) => update("notional", value)} />}<div className="desk-panel"><span>DATA LINEAGE</span><p>Spot / forward: DEMO · Volatility: USER · Rates: USER / REFERENCE · PV: MODEL</p></div></aside>
      <div className="output-panel"><div className="pricer-output-head"><div className="metric-grid"><Metric label="PV · MODEL" value={analytics.price} primary /><Metric label="Delta" value={analytics.delta} /><Metric label="Gamma" value={analytics.gamma} /><Metric label="Vega / 1 vol pt" value={analytics.vega} /><Metric label="Theta / day" value={analytics.theta} /><Metric label="Rho / 100bp" value={analytics.rho} /></div><TheQuantBatemanAvatar state={avatarState} compact interactive context="vanilla option pricing" /></div><div className="diagnostic-strip"><span>FORWARD <b>{analytics.forward.toFixed(4)}</b></span><span>DF <b>{analytics.discountFactor.toFixed(6)}</b></span><span>INTRINSIC <b>{analytics.intrinsicValue.toFixed(4)}</b></span><span>TIME VALUE <b>{analytics.timeValue.toFixed(4)}</b></span><span>MONEYNESS <b>{analytics.moneyness.toFixed(4)}</b></span></div><div className="chart-card"><div className="chart-title"><div><span>RISK EXPLORER</span><strong>{metric.toUpperCase()} vs underlying</strong></div><div className="metric-picker">{metricOptions.map((item) => <button className={metric === item ? "active" : ""} onClick={() => setMetric(item)} key={item}>{item === "price" ? "PV" : item}</button>)}</div></div><LineChart x={levels} series={[{ name: metric, values: riskValues }]} xLabel={input.mode === "forward" ? "Forward" : "Spot"} yLabel={metric.toUpperCase()} height={300} /></div></div></div>
    <div className="analytics-grid"><section className="chart-card"><div className="chart-title"><div><span>SCENARIO MATRIX</span><strong>{metric.toUpperCase()} · underlying × volatility</strong></div><span>SINGLE VECTORIZED GRID</span></div><div className="scenario-matrix"><b />{grid.volatilities.map((vol) => <b key={vol}>{(vol * 100).toFixed(1)}%</b>)}{grid.values.flatMap((row, rowIndex) => [<b key={`s-${rowIndex}`}>{grid.spots[rowIndex].toFixed(2)}</b>, ...row.map((value, columnIndex) => <i key={`${rowIndex}-${columnIndex}`} style={{ opacity: .2 + .8 * Math.min(1, Math.abs(value) / Math.max(1e-8, Math.abs(analytics[metric]) * 2)) }}>{Math.abs(value) < .001 ? value.toExponential(1) : value.toFixed(3)}</i>)])}</div></section><section className="chart-card"><div className="chart-title"><div><span>PAYOFF EXPLORER</span><strong>Value today ≠ payoff at maturity</strong></div><span>K {input.strike.toFixed(2)}</span></div><LineChart x={levels} series={[{ name: "Today", values: todayValue }, { name: "Payoff", values: payoff, color: "#8b8277" }]} xLabel="Terminal level" yLabel="Value" height={250} /><p className="chart-note">{pick(locale, { en: "Today’s value includes discounted optionality and time value. The maturity payoff contains neither.", es: "El valor actual incluye opcionalidad descontada y valor temporal. El payoff al vencimiento no contiene ninguno." })}</p></section></div>
    <div className="secondary-grid"><section className="iv-calculator"><span className="eyebrow">IMPLIED VOLATILITY · BRENT</span><h3>{pick(locale, { en: "Invert price into volatility.", es: "Invierte precio en volatilidad." })}</h3><label>{pick(locale, { en: "Market option price", es: "Precio de opción de mercado" })}<input type="number" value={ivPrice} min="0" step="0.01" onChange={(event) => setIvPrice(Number(event.target.value))} /></label><button type="button" onClick={solveIv}>{pick(locale, { en: "SOLVE IV", es: "RESOLVER IV" })}</button><output>{ivMessage || pick(locale, { en: "Arbitrage bounds are checked before solving.", es: "Se comprueban límites de arbitraje antes de resolver." })}</output></section><section className="implementation-view"><div className="implementation-tabs">{(["formula", "python", "test"] as const).map((tab) => <button className={codeTab === tab ? "active" : ""} onClick={() => setCodeTab(tab)} key={tab}>{tab}</button>)}</div>{codeTab === "formula" && <code>V = φ · [S e^(−qT) N(φd₁) − K e^(−rT) N(φd₂)]</code>}{codeTab === "python" && <pre>{`def price(req):\n    d1 = (log(S/K) + (r-q+0.5*sigma**2)*T) / (sigma*sqrt(T))\n    return phi*(S*exp(-q*T)*N(phi*d1) - K*exp(-r*T)*N(phi*d2))`}</pre>}{codeTab === "test" && <pre>{`assert abs(call - put - (S*exp(-q*T) - K*exp(-r*T))) < 1e-10\nassert implied_vol(price(vol=.20)) == approx(.20)`}</pre>}</section></div>
    <section className="source-strip"><span>SOURCES &amp; FURTHER STUDY</span><a href="https://www.youtube.com/@ComputationsInFinance" target="_blank" rel="noreferrer">Computations in Finance ↗</a><a href="https://github.com/LechGrzelak/QuantFinanceBook/tree/master/PythonCodes/Chapter%2004" target="_blank" rel="noreferrer">QuantFinanceBook · Ch. 04 ↗</a><a href="https://www.quantlib.org/reference/" target="_blank" rel="noreferrer">QuantLib reference ↗</a><a href="/learn/equity/black-scholes">WHY? · Mathematics →</a></section>
  </div>;
}

function BlackScholesLab() {
  const [input, setInput] = useState(baseOption);
  const [animating, setAnimating] = useState(false);
  const animationStartRef = useRef(baseOption.time);
  const analytics = useMemo(() => blackScholes(input), [input]);
  const spots = useMemo(() => Array.from({ length: 61 }, (_, index) => input.strike * (0.45 + index * 0.0185)), [input.strike]);
  const prices = useMemo(() => spots.map((spot) => blackScholes({ ...input, spot }).price), [spots, input]);
  const intrinsic = useMemo(() => spots.map((spot) => Math.max((input.type === "call" ? 1 : -1) * (spot - input.strike), 0)), [spots, input]);

  useEffect(() => {
    if (!animating) return;
    let frame = 0;
    const started = performance.now();
    const startTime = animationStartRef.current;
    const animate = (now: number) => {
      const progress = Math.min((now - started) / 5200, 1);
      setInput((current) => ({ ...current, time: Math.max(0.003, startTime * (1 - progress)) }));
      if (progress < 1) frame = requestAnimationFrame(animate); else setAnimating(false);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [animating]);

  const update = <K extends keyof BlackScholesInput>(key: K, value: BlackScholesInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  return (
    <div className="experiment">
      <LabHeader index="01" title="Black-Scholes Playground" copy="Move the state variables, then read price and hedge sensitivities as one connected system." note="European option · continuous rates/dividend · no transaction costs" />
      <div className="lab-grid">
        <aside className="control-panel">
          <div className="control-heading"><span>MODEL PARAMETERS</span><button type="button" onClick={() => setInput(baseOption)}>Reset</button></div>
          <div className="segmented"><button className={input.type === "call" ? "active" : ""} onClick={() => update("type", "call")}>Call</button><button className={input.type === "put" ? "active" : ""} onClick={() => update("type", "put")}>Put</button></div>
          <ParameterInput label="Spot" suffix="S" value={input.spot} min={40} max={180} step={1} onChange={(value) => update("spot", value)} />
          <ParameterInput label="Strike" suffix="K" value={input.strike} min={40} max={180} step={1} onChange={(value) => update("strike", value)} />
          <ParameterInput label="Time" suffix="years" value={input.time} min={0.003} max={5} step={0.01} onChange={(value) => update("time", value)} />
          <ParameterInput label="Risk-free rate" suffix="decimal" value={input.rate} min={-0.02} max={0.15} step={0.001} onChange={(value) => update("rate", value)} />
          <ParameterInput label="Dividend yield" suffix="decimal" value={input.dividend} min={0} max={0.12} step={0.001} onChange={(value) => update("dividend", value)} />
          <ParameterInput label="Volatility" suffix="decimal" value={input.volatility} min={0.001} max={0.8} step={0.005} onChange={(value) => update("volatility", value)} />
          <div className="presets"><span>PRESETS</span><button onClick={() => setInput({ ...baseOption, spot: 120 })}>ITM</button><button onClick={() => setInput(baseOption)}>ATM</button><button onClick={() => setInput({ ...baseOption, spot: 80 })}>OTM</button></div>
          <button className="animate-button" type="button" onClick={() => { if (!animating) { const startTime = input.time < 0.05 ? 1 : input.time; animationStartRef.current = startTime; setInput((current) => ({ ...current, time: startTime })); } setAnimating((value) => !value); }}>{animating ? "Pause expiry animation" : "Animate time → expiry"}</button>
        </aside>
        <div className="output-panel">
          <div className="metric-grid"><Metric label="Price" value={analytics.price} primary /><Metric label="Delta" value={analytics.delta} /><Metric label="Gamma" value={analytics.gamma} /><Metric label="Vega / 1 vol pt" value={analytics.vega} /><Metric label="Theta / day" value={analytics.theta} /><Metric label="Rho / 100bp" value={analytics.rho} /></div>
          <div className="chart-card"><div className="chart-title"><div><span>OPTION VALUE</span><strong>Price across spot</strong></div><div className="legend"><i /> Model <i /> Intrinsic</div></div><LineChart x={spots} series={[{ name: "Model", values: prices }, { name: "Intrinsic", values: intrinsic, color: "#8b8277" }]} xLabel="Spot" yLabel="Value" /></div>
          <div className="formula-card"><span className="eyebrow">PRICING FORMULA</span><code>C = S e<sup>−qT</sup>N(d₁) − K e<sup>−rT</sup>N(d₂)</code><p>d₁ = {Number.isFinite(analytics.d1) ? analytics.d1.toFixed(4) : "∞"} · d₂ = {Number.isFinite(analytics.d2) ? analytics.d2.toFixed(4) : "∞"}</p></div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, primary = false }: { label: string; value: number; primary?: boolean }) {
  return <div className={primary ? "metric primary" : "metric"}><span>{label}</span><strong>{Math.abs(value) < 0.0001 ? value.toExponential(2) : value.toFixed(4)}</strong></div>;
}

type GreekKey = "delta" | "gamma" | "vega" | "theta";

function GreeksLab() {
  const { locale } = useI18n();
  const [greek, setGreek] = useState<GreekKey>("gamma");
  const [input, setInput] = useState(baseOption);
  const [heatmap, setHeatmap] = useState(false);
  const spots = useMemo(() => Array.from({ length: 81 }, (_, index) => 55 + index * 1.125), []);
  const values = useMemo(() => spots.map((spot) => blackScholes({ ...input, spot })[greek]), [spots, input, greek]);
  const analytics = useMemo(() => blackScholes(input), [input]);
  const current = analytics[greek];
  const heatValues = useMemo(() => Array.from({ length: 48 }, (_, index) => {
    const col = index % 12; const row = Math.floor(index / 12);
    return blackScholes({ ...input, spot: 65 + col * 6.5, time: 0.05 + row * 0.48 })[greek];
  }), [input, greek]);
  const heatMax = Math.max(...heatValues.map(Math.abs), 1e-8);
  const update = <K extends keyof BlackScholesInput>(key: K, value: BlackScholesInput[K]) => setInput((currentInput) => ({ ...currentInput, [key]: value }));
  useEffect(() => { localStorage.setItem("tqb-lab-context", JSON.stringify({ model: "Black-Scholes", selectedGreek: greek, ...input, view: heatmap ? "spot-time" : "spot" })); }, [greek, input, heatmap]);
  return (
    <div className="experiment">
      <LabHeader index="02" title={pick(locale, { en: "Interactive Greeks Dashboard", es: "Panel interactivo de griegas" })} copy={pick(locale, { en: "Read sensitivity as geometry: slope, curvature, volatility exposure and decay.", es: "Lee la sensibilidad como geometría: pendiente, curvatura, exposición a volatilidad y decaimiento." })} note={pick(locale, { en: "Analytical Greeks · Black–Scholes conventions", es: "Griegas analíticas · convenciones Black–Scholes" })} />
      <div className="lab-grid">
        <aside className="control-panel">
          <div className="control-heading"><span>SENSITIVITY</span><em>∂V</em></div>
          <div className="greek-picker">{(["delta", "gamma", "vega", "theta"] as GreekKey[]).map((item) => <button className={greek === item ? "active" : ""} key={item} onClick={() => setGreek(item)}><strong>{item}</strong><small>{item === "delta" ? "direction" : item === "gamma" ? "curvature" : item === "vega" ? "volatility" : "time decay"}</small></button>)}</div>
          <div className="segmented"><button className={input.type === "call" ? "active" : ""} onClick={() => update("type", "call")}>Call</button><button className={input.type === "put" ? "active" : ""} onClick={() => update("type", "put")}>Put</button></div>
          <ParameterInput label="Spot" suffix="S" value={input.spot} min={40} max={180} step={1} onChange={(value) => update("spot", value)} />
          <ParameterInput label={pick(locale, { en: "Strike", es: "Strike" })} suffix="K" value={input.strike} min={40} max={180} step={1} onChange={(value) => update("strike", value)} />
          <ParameterInput label={pick(locale, { en: "Time", es: "Tiempo" })} suffix="years" value={input.time} min={0.01} max={5} step={0.01} onChange={(value) => update("time", value)} />
          <ParameterInput label={pick(locale, { en: "Rate", es: "Tipo" })} suffix="decimal" value={input.rate} min={-0.02} max={0.15} step={0.001} onChange={(value) => update("rate", value)} />
          <ParameterInput label={pick(locale, { en: "Dividend", es: "Dividendo" })} suffix="decimal" value={input.dividend} min={0} max={0.12} step={0.001} onChange={(value) => update("dividend", value)} />
          <ParameterInput label={pick(locale, { en: "Volatility", es: "Volatilidad" })} suffix="decimal" value={input.volatility} min={0.05} max={0.8} step={0.01} onChange={(value) => update("volatility", value)} />
          <span className="control-label">MONEYNESS PRESET</span>
          <div className="presets"><button className={input.spot === 120 ? "active" : ""} onClick={() => update("spot", 120)}>ITM</button><button className={input.spot === 100 ? "active" : ""} onClick={() => update("spot", 100)}>ATM</button><button className={input.spot === 80 ? "active" : ""} onClick={() => update("spot", 80)}>OTM</button></div>
          <label className="toggle-row" htmlFor="spot-time-view" aria-label="Toggle Spot by Time view"><span><strong>Spot × Time view</strong><small>Reveal the sensitivity plane</small></span><input id="spot-time-view" type="checkbox" checked={heatmap} onChange={(event) => setHeatmap(event.target.checked)} /></label>
          <div className="desk-panel"><span>DESK VIEW</span><p>{greek === "gamma" ? "Near expiry, ATM gamma concentrates sharply. Your hedge ratio starts moving faster than your coffee can compensate." : greek === "vega" ? "Vega is not a view on realised vol alone. Surface dynamics, tenor and smile all get a vote." : greek === "theta" ? "Theta is the model’s carry invoice. Weekend conventions and surface moves decide what actually arrives." : "Delta is a local hedge coordinate, not a permanent statement about direction."}</p></div>
        </aside>
        <div className="output-panel">
          <div className="metric-grid"><Metric label="Price" value={analytics.price} primary /><Metric label="Delta" value={analytics.delta} /><Metric label="Gamma" value={analytics.gamma} /><Metric label="Vega / 1 vol pt" value={analytics.vega} /><Metric label="Theta / day" value={analytics.theta} /><Metric label="Rho / 100bp" value={analytics.rho} /></div>
          <div className="greek-readout"><span>CURRENT {greek.toUpperCase()} · SPOT {input.spot}</span><strong>{current.toFixed(5)}</strong><em>{input.type.toUpperCase()} · σ {(input.volatility * 100).toFixed(1)}%</em></div>
          <div className="chart-card"><div className="chart-title"><div><span>SENSITIVITY PROFILE</span><strong>{greek[0].toUpperCase() + greek.slice(1)} against spot</strong></div></div><LineChart x={spots} series={[{ name: greek, values }]} xLabel="Spot" yLabel={greek.toUpperCase()} height={310} /></div>
          {heatmap && <div className="heatmap-card"><div className="chart-title"><div><span>SPOT × TIME</span><strong>Relative {greek} intensity</strong></div><span>2.0Y → 0.05Y</span></div><div className="greek-heatmap">{heatValues.map((value, index) => <i key={index} title={`${value.toFixed(5)}`} style={{ opacity: 0.15 + 0.85 * Math.abs(value) / heatMax }} />)}</div></div>}
        </div>
      </div>
    </div>
  );
}

function VolatilitySurfaceLab() {
  const { locale } = useI18n();
  const [params, setParams] = useState<SurfaceParameters>({ atm: 0.184, skew: -0.075, convexity: 0.62, termStructure: 0.018 });
  const [sliceMaturity, setSliceMaturity] = useState(1);
  const [view, setView] = useState<"constant" | "smile" | "skew" | "term" | "surface" | "local">("surface");
  const moneyness = useMemo(() => Array.from({ length: 41 }, (_, index) => 0.7 + index * 0.015), []);
  const smile = useMemo(() => moneyness.map((m) => syntheticVolatility(m, sliceMaturity, params)), [moneyness, sliceMaturity, params]);
  const maturities = useMemo(() => Array.from({ length: 41 }, (_, index) => 0.05 + index * 0.075), []);
  const term = useMemo(() => maturities.map((time) => syntheticVolatility(1, time, params)), [maturities, params]);
  const update = (key: keyof SurfaceParameters, value: number) => setParams((current) => ({ ...current, [key]: value }));
  const tenors = [{ label: "1M", value: 1 / 12 }, { label: "3M", value: 0.25 }, { label: "6M", value: 0.5 }, { label: "1Y", value: 1 }, { label: "2Y", value: 2 }, { label: "5Y", value: 5 }];
  useEffect(() => { localStorage.setItem("tqb-lab-context", JSON.stringify({ model: "Synthetic volatility surface", view, sliceMaturity, ...params })); }, [params, sliceMaturity, view]);
  const viewCopy = {
    constant: pick(locale, { en: "One volatility for every strike and expiry: useful as a baseline, never a description of the market.", es: "Una volatilidad para cada strike y vencimiento: útil como base, nunca como descripción del mercado." }),
    smile: pick(locale, { en: "Wing richness reveals that terminal returns are not priced as lognormal.", es: "La riqueza de las alas revela que los retornos terminales no se valoran como lognormales." }),
    skew: pick(locale, { en: "Skew prices directional asymmetry and crash protection across strikes.", es: "El skew valora la asimetría direccional y la protección ante caídas." }),
    term: pick(locale, { en: "Term structure separates event risk, short-dated flow and long-run uncertainty.", es: "La estructura temporal separa eventos, flujos de corto plazo e incertidumbre de largo plazo." }),
    surface: pick(locale, { en: "The surface joins smile and term. Rotate, deform and inspect linked slices.", es: "La superficie une sonrisa y plazo. Rótala, defórmala e inspecciona cortes vinculados." }),
    local: pick(locale, { en: "Local volatility converts today’s vanilla surface into state-dependent instantaneous variance; hedge dynamics remain a separate question.", es: "La volatilidad local convierte la superficie vanilla de hoy en varianza instantánea dependiente del estado; la dinámica de cobertura es otra cuestión." }),
  }[view];
  return (
    <div className="experiment">
      <LabHeader index="03" title={pick(locale, { en: "Unified Volatility Explorer", es: "Explorador unificado de volatilidad" })} copy={pick(locale, { en: "Move from constant volatility to smile, skew, term structure, surface and local-vol interpretation.", es: "Avanza de volatilidad constante a sonrisa, skew, estructura temporal, superficie e interpretación local." })} note={pick(locale, { en: "Pedagogical synthetic surface · not live market data", es: "Superficie sintética educativa · no son datos en vivo" })} />
      <div className="vol-progression" role="tablist" aria-label="Volatility model progression">{(["constant", "smile", "skew", "term", "surface", "local"] as const).map((item, index) => <button role="tab" aria-selected={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)} key={item}><span>0{index + 1}</span>{item === "local" ? "local vol" : item}</button>)}</div>
      <div className="vol-explainer"><span>{view.toUpperCase()}</span><p>{viewCopy}</p></div>
      <div className="surface-lab-grid">
        <aside className="control-panel">
          <div className="control-heading"><span>SURFACE PARAMETERS</span><button onClick={() => setParams({ atm: 0.184, skew: -0.075, convexity: 0.62, termStructure: 0.018 })}>Reset</button></div>
          <ParameterInput label="ATM volatility" suffix="decimal" value={params.atm} min={0.05} max={0.6} step={0.005} onChange={(value) => update("atm", value)} />
          <ParameterInput label="Skew" suffix="slope" value={params.skew} min={-0.5} max={0.5} step={0.005} onChange={(value) => update("skew", value)} />
          <ParameterInput label="Convexity" suffix="curvature" value={params.convexity} min={0} max={1.5} step={0.01} onChange={(value) => update("convexity", value)} />
          <ParameterInput label="Term structure" suffix="slope" value={params.termStructure} min={-0.08} max={0.12} step={0.002} onChange={(value) => update("termStructure", value)} />
          <div className="surface-summary"><span>ATM 1Y</span><strong>{(syntheticVolatility(1, 1, params) * 100).toFixed(2)}%</strong><span>80% / 120% wing</span><strong>{(syntheticVolatility(0.8, 1, params) * 100).toFixed(2)} / {(syntheticVolatility(1.2, 1, params) * 100).toFixed(2)}</strong></div>
          <div className="tenor-picker"><span>{pick(locale, { en: "MATURITY SLICE", es: "CORTE DE VENCIMIENTO" })}</span><div>{tenors.map((tenor) => <button className={Math.abs(sliceMaturity - tenor.value) < 0.001 ? "active" : ""} onClick={() => setSliceMaturity(tenor.value)} key={tenor.label}>{tenor.label}</button>)}</div></div>
          <div className="desk-panel"><span>DESK VIEW</span><p>{pick(locale, { en: "A fitted surface marks vanillas. A dynamics assumption decides tomorrow’s hedge. Do not confuse the two.", es: "Una superficie ajustada marca vanillas. Un supuesto dinámico decide la cobertura de mañana. No los confundas." })}</p></div>
        </aside>
        <div className="surface-output">
          <div className="chart-card surface-main"><div className="chart-title"><div><span>VOLATILITY SURFACE</span><strong>Implied volatility · moneyness × maturity</strong></div><span className="demo-chip">SYNTHETIC</span></div><SurfaceCanvas params={params} /></div>
          <div className="slice-grid">
            <div className="chart-card"><div className="chart-title"><div><span>SMILE SLICE</span><strong>Maturity {sliceMaturity.toFixed(2)}y</strong></div><input aria-label="Smile maturity" type="range" min="0.08" max="5" step="0.01" value={sliceMaturity} onChange={(event) => setSliceMaturity(Number(event.target.value))} /></div><LineChart x={moneyness} series={[{ name: "vol", values: smile }]} xLabel="Moneyness" yLabel="IV" height={210} /></div>
            <div className="chart-card"><div className="chart-title"><div><span>TERM SLICE</span><strong>ATM moneyness</strong></div></div><LineChart x={maturities} series={[{ name: "vol", values: term }]} xLabel="Maturity" yLabel="IV" height={210} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const curveSeed: CurveNode[] = [
  { tenor: "1M", time: 1 / 12, quote: 0.031 }, { tenor: "3M", time: 0.25, quote: 0.0325 }, { tenor: "6M", time: 0.5, quote: 0.0338 },
  { tenor: "1Y", time: 1, quote: 0.035 }, { tenor: "2Y", time: 2, quote: 0.0362 }, { tenor: "5Y", time: 5, quote: 0.038 },
  { tenor: "10Y", time: 10, quote: 0.0392 }, { tenor: "20Y", time: 20, quote: 0.0387 }, { tenor: "30Y", time: 30, quote: 0.0381 },
];

function YieldCurveLab() {
  const [nodes, setNodes] = useState(curveSeed);
  const curve = useMemo(() => bootstrapCurve(nodes), [nodes]);
  const setQuote = useCallback((index: number, quote: number) => setNodes((current) => current.map((node, nodeIndex) => nodeIndex === index ? { ...node, quote: Math.max(-0.02, Math.min(0.12, quote)) } : node)), []);
  const transform = (action: "shift" | "steepen" | "flatten" | "bump") => setNodes((current) => current.map((node) => {
    const centred = (node.time - 5) / 30;
    const amount = action === "shift" ? 0.0025 : action === "bump" ? 0.0001 : action === "steepen" ? 0.006 * centred : -0.006 * centred;
    return { ...node, quote: node.quote + amount };
  }));
  return (
    <div className="experiment">
      <LabHeader index="04" title="Yield Curve Explorer" copy="Move one node or reshape the entire term structure. Watch discounting and forwards inherit the decision." note="Simplified educational zero-quote bootstrap · continuously compounded" />
      <div className="curve-actions"><button onClick={() => setNodes(curveSeed)}>Reset curve</button><button onClick={() => transform("shift")}>Parallel +25bp</button><button onClick={() => transform("steepen")}>Steepen</button><button onClick={() => transform("flatten")}>Flatten</button><button onClick={() => transform("bump")}>Every node +1bp</button></div>
      <div className="curve-workspace">
        <div className="chart-card curve-chart-card"><div className="chart-title"><div><span>INTERACTIVE ZERO CURVE</span><strong>Drag a node vertically to reprice the structure</strong></div><span className="demo-chip">DEMO QUOTES</span></div><CurveCanvas nodes={nodes} onChange={setQuote} /><div className="curve-series"><span><i /> Zero rate</span><span><i /> Forward rate</span><span><i /> Discount factor</span></div></div>
        <div className="bootstrap-flow" aria-label="Bootstrap flow"><span>Market instruments</span><b>↓</b><span>Bootstrap</span><b>↓</b><span>Discount factors</span><b>↓</b><span>Zero curve</span><b>↓</b><span>Forward curve</span></div>
      </div>
      <div className="curve-table-wrap"><table className="curve-table"><thead><tr><th>Tenor</th><th>Market quote</th><th>Zero rate</th><th>Discount factor</th><th>Forward rate</th><th>Node control</th></tr></thead><tbody>{curve.map((node, index) => <tr key={node.tenor}><td><strong>{node.tenor}</strong></td><td>{(node.quote * 100).toFixed(3)}%</td><td>{(node.zero * 100).toFixed(3)}%</td><td>{node.discount.toFixed(6)}</td><td className={node.forward >= 0 ? "positive" : "negative"}>{(node.forward * 100).toFixed(3)}%</td><td><input aria-label={`${node.tenor} quote`} type="range" min="-0.01" max="0.09" step="0.0001" value={node.quote} onChange={(event) => setQuote(index, Number(event.target.value))} /></td></tr>)}</tbody></table></div>
    </div>
  );
}

function CurveCanvas({ nodes, onChange }: { nodes: CurveNode[]; onChange: (index: number, quote: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const curve = bootstrapCurve(nodes);
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
    const context = canvas.getContext("2d"); if (!context) return;
    context.scale(ratio, ratio);
    const width = rect.width; const height = rect.height; const pad = { l: 48, r: 25, t: 20, b: 35 };
    const mapX = (time: number) => pad.l + (Math.log1p(time) / Math.log(31)) * (width - pad.l - pad.r);
    const minRate = -0.015; const maxRate = 0.085;
    const mapY = (rate: number) => pad.t + (1 - (rate - minRate) / (maxRate - minRate)) * (height - pad.t - pad.b);
    context.clearRect(0, 0, width, height); context.font = "11px ui-monospace, monospace";
    context.strokeStyle = "#d8d3ca"; context.fillStyle = "#817b72";
    for (let tick = 0; tick <= 4; tick += 1) { const y = pad.t + tick / 4 * (height - pad.t - pad.b); context.beginPath(); context.moveTo(pad.l, y); context.lineTo(width - pad.r, y); context.stroke(); context.fillText(`${((maxRate - tick / 4 * (maxRate - minRate)) * 100).toFixed(1)}%`, 5, y + 4); }
    const drawSeries = (values: number[], color: string, widthLine: number) => { context.beginPath(); values.forEach((value, index) => index ? context.lineTo(mapX(curve[index].time), mapY(value)) : context.moveTo(mapX(curve[index].time), mapY(value))); context.strokeStyle = color; context.lineWidth = widthLine; context.stroke(); };
    drawSeries(curve.map((node) => node.zero), "#7a263a", 2.3); drawSeries(curve.map((node) => node.forward), "#9a7655", 1.5);
    curve.forEach((node) => { context.beginPath(); context.arc(mapX(node.time), mapY(node.quote), 5, 0, Math.PI * 2); context.fillStyle = "#f7f3eb"; context.fill(); context.strokeStyle = "#7a263a"; context.lineWidth = 2; context.stroke(); context.fillStyle = "#625e57"; context.fillText(node.tenor, mapX(node.time) - 8, height - 10); });
    const pointerDown = (event: PointerEvent) => { const box = canvas.getBoundingClientRect(); let nearest = -1; let distance = 18; curve.forEach((node, index) => { const current = Math.hypot(mapX(node.time) - (event.clientX - box.left), mapY(node.quote) - (event.clientY - box.top)); if (current < distance) { distance = current; nearest = index; } }); if (nearest >= 0) { dragRef.current = nearest; canvas.setPointerCapture(event.pointerId); } };
    const pointerMove = (event: PointerEvent) => { if (dragRef.current === null) return; const box = canvas.getBoundingClientRect(); const ratioY = 1 - ((event.clientY - box.top - pad.t) / (height - pad.t - pad.b)); onChange(dragRef.current, minRate + ratioY * (maxRate - minRate)); };
    const pointerUp = () => { dragRef.current = null; };
    canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointermove", pointerMove); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointerleave", pointerUp);
    return () => { canvas.removeEventListener("pointerdown", pointerDown); canvas.removeEventListener("pointermove", pointerMove); canvas.removeEventListener("pointerup", pointerUp); canvas.removeEventListener("pointerleave", pointerUp); };
  }, [nodes, onChange]);
  return <canvas ref={canvasRef} className="curve-canvas" aria-label="Interactive zero and forward curve. Drag rate nodes vertically." />;
}

function LabHeader({ index, title, copy, note }: { index: string; title: string; copy: string; note: string }) {
  return <header className="experiment-header"><div><span className="eyebrow">EXPERIMENT {index}</span><h2>{title}</h2><p>{copy}</p></div><span className="assumption-note">{note}</span></header>;
}
