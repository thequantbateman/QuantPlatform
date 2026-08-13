"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@/src/components/charts/LineChart";
import { LazyVolSurfaceLab } from "@/src/components/academy/LazyVolSurfaceLab";
import { blackScholes, type BlackScholesInput } from "@/src/quant/models/blackScholes";
import { impliedVolatility } from "@/src/quant/volatility/impliedVolatility";
import { priceVanilla, scenarioGrid, type GreekMetric, type VanillaInput, type VanillaMode } from "@/src/quant/pricing/vanilla";
import { bootstrapCurve, type CurveNode } from "@/src/quant/curves/rates";
import { pick, useI18n } from "@/src/i18n";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";
import { validateWithQuantEngine, type QuantEngineState } from "@/src/data/quantEngineClient";

type LabId = "vanilla" | "black-scholes" | "greeks" | "surface" | "curve";

const labIds: LabId[] = ["vanilla", "black-scholes", "greeks", "surface", "curve"];

export function Labs({ initialLab }: { initialLab?: string }) {
  const { t, locale } = useI18n();
  const { setPageContext } = useQuantBateman();
  const labTabs = [
    { id: "vanilla" as const, index: "01", label: pick(locale, { en: "Vanilla Pricer", es: "Pricer Vanilla" }), description: pick(locale, { en: "3 models + scenarios", es: "3 modelos + escenarios" }) },
    { id: "black-scholes" as const, index: "02", label: t("lab.bs"), description: t("lab.bsDesc") },
    { id: "greeks" as const, index: "03", label: t("lab.greeks"), description: t("lab.greeksDesc") },
    { id: "surface" as const, index: "04", label: t("lab.vol"), description: t("lab.volDesc") },
    { id: "curve" as const, index: "05", label: t("lab.curve"), description: t("lab.curveDesc") },
  ];
  const [active, setActive] = useState<LabId>(initialLab && labIds.includes(initialLab as LabId) ? initialLab as LabId : "black-scholes");
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("lab") as LabId | null; if (requested && labIds.includes(requested)) window.setTimeout(() => setActive(requested), 0); }, []);
  useEffect(() => { setPageContext({ section: "quant lab", action: active }); }, [active, setPageContext]);
  return (
    <div className="lab-page">
      <header className="page-hero section-shell compact-hero">
        <span className="eyebrow">{t("lab.eyebrow")}</span>
        <h1>{t("lab.title")}</h1>
        <p>{t("lab.copy")}</p>
      </header>
      <div className="lab-tabs section-shell" role="tablist" aria-label={pick(locale, { en: "Quant labs", es: "Laboratorios quant" })}>
        {labTabs.map((lab) => <button type="button" role="tab" aria-selected={active === lab.id} className={active === lab.id ? "active" : ""} onClick={() => setActive(lab.id)} key={lab.id}><span>{lab.index}</span><strong>{lab.label}</strong><small>{lab.description}</small></button>)}
      </div>
      <section className="lab-workspace section-shell">
        {active === "vanilla" && <VanillaOptionLab />}
        {active === "black-scholes" && <BlackScholesLab />}
        {active === "greeks" && <GreeksLab />}
        {active === "surface" && <LazyVolSurfaceLab compact />}
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
const metricAxisLabel = (metric: GreekMetric): string => ({ price: "PV (currency units)", delta: "Delta (per 1 spot unit)", gamma: "Gamma (per spot unit²)", vega: "Vega (per 1 vol point)", theta: "Theta (per day)", rho: "Rho (per 100bp)" })[metric];
const formatMetricValue = (metric: GreekMetric, value: number): string => Math.abs(value) < 0.0001 ? value.toExponential(2) : value.toFixed(metric === "gamma" ? 6 : 5);

function VanillaOptionLab() {
  const { locale } = useI18n(); const qb = useQuantBateman(); const [input, setInput] = useState<VanillaInput>(vanillaDefaults); const [advanced, setAdvanced] = useState(false); const [metric, setMetric] = useState<GreekMetric>("vega"); const [codeTab, setCodeTab] = useState<"formula" | "python" | "test">("formula"); const [ivPrice, setIvPrice] = useState(12); const [ivMessage, setIvMessage] = useState(""); const [engineState, setEngineState] = useState<QuantEngineState>("fallback"); const [lineage, setLineage] = useState({ source: "TQB frozen scenario", status: "DEMO", asOf: "static", dataMode: "DEMO" });
  useEffect(() => { const query = new URLSearchParams(window.location.search); const mode = query.get("mode") as VanillaMode | null; const spot = Number(query.get("spot")); const symbol = query.get("symbol"); const source = query.get("source"); const status = query.get("status"); const asOf = query.get("asOf"); const dataMode = query.get("dataMode"); if (source || status || asOf || dataMode) window.setTimeout(() => setLineage((current) => ({ source: source ?? current.source, status: status ?? current.status, asOf: asOf ?? current.asOf, dataMode: dataMode ?? current.dataMode })), 0); if (mode && ["equity", "fx", "forward"].includes(mode)) window.setTimeout(() => setInput((current) => ({ ...current, mode, spot: Number.isFinite(spot) && spot > 0 ? spot : current.spot, forward: Number.isFinite(spot) && spot > 0 ? spot : current.forward, strike: Number.isFinite(spot) && spot > 0 ? spot : current.strike, underlying: symbol ?? current.underlying })), 0); }, []);
  useEffect(() => { const controller = new AbortController(); const timer = window.setTimeout(() => { validateWithQuantEngine(input, controller.signal).then(setEngineState).catch(() => setEngineState("fallback")); }, 120); return () => { window.clearTimeout(timer); controller.abort(); }; }, [input]);
  const analytics = useMemo(() => priceVanilla(input), [input]); const grid = useMemo(() => scenarioGrid(input, metric), [input, metric]); const baseLevel = input.mode === "forward" ? input.forward : input.spot; const levels = useMemo(() => Array.from({ length: 61 }, (_, index) => baseLevel * (0.65 + index * 0.012)), [baseLevel]); const riskValues = useMemo(() => levels.map((level) => priceVanilla({ ...input, spot: level, forward: level })[metric]), [levels, input, metric]); const payoff = useMemo(() => levels.map((level) => Math.max((input.type === "call" ? 1 : -1) * (level - input.strike), 0) * input.notional), [levels, input.type, input.strike, input.notional]); const todayValue = useMemo(() => levels.map((level) => priceVanilla({ ...input, spot: level, forward: level }).price), [levels, input]); const model = input.mode === "fx" ? "Garman–Kohlhagen" : input.mode === "forward" ? "Black–76" : "Black–Scholes–Merton";
  const update = <K extends keyof VanillaInput>(key: K, value: VanillaInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const solveIv = () => { qb.setState("pricing", "Solving implied volatility..."); try { const common = { marketPrice: ivPrice, strike: input.strike, time: input.time, rate: input.rate, type: input.type }; const result = input.mode === "forward" ? impliedVolatility({ model: "black76", ...common, forward: input.forward }) : impliedVolatility({ model: input.mode === "fx" ? "gk" : "bsm", ...common, spot: input.spot, dividend: input.foreignRate }); setIvMessage(`${(result.volatility * 100).toFixed(4)}% · ${result.iterations} iter · residual ${result.residual.toExponential(2)}`); qb.success("Implied volatility solved."); } catch (error) { const message = error instanceof Error ? error.message : "Solver error"; setIvMessage(message); qb.error(message); } };
  const modeCopy = { equity: { symbol: "AAPL", spot: 218.44, strike: 220, vol: .22 }, fx: { symbol: "EURUSD", spot: 1.1642, strike: 1.17, vol: .095 }, forward: { symbol: "BRENT", spot: 71.84, strike: 72, vol: .28 } };
  return <div className="experiment vanilla-pricer">
    <LabHeader index="01" title={pick(locale, { en: "Vanilla Option Workstation", es: "Estación de Opciones Vanilla" })} copy={pick(locale, { en: "Move from a source-labelled underlying through model, price, risk, scenarios, mathematics and implementation.", es: "Avanza desde un subyacente con fuente hasta modelo, precio, riesgo, escenarios, matemáticas e implementación." })} note={`${model} · ACT/365-like · continuous rates`} />
    <div className="pricer-toolbar"><div className="mode-picker">{(["equity", "fx", "forward"] as VanillaMode[]).map((mode) => <button className={input.mode === mode ? "active" : ""} onClick={() => { const seed = modeCopy[mode]; setInput({ ...vanillaDefaults, mode, underlying: seed.symbol, spot: seed.spot, forward: seed.spot, strike: seed.strike, volatility: seed.vol }); }} key={mode}>{mode === "forward" ? "FORWARD / FUTURES" : mode.toUpperCase()}</button>)}</div><label className="mode-toggle"><input type="checkbox" checked={advanced} onChange={(event) => setAdvanced(event.target.checked)} />{advanced ? "ADVANCED" : "SIMPLE"}</label><div className="engine-health" title={engineState === "online" ? "FastAPI response validated" : "Deterministic TypeScript fallback active"}><i /> QUANT ENGINE · {engineState === "online" ? "FASTAPI ONLINE" : "LOCAL FALLBACK"}</div></div>
    <div className="pricer-grid"><aside className="control-panel trade-ticket"><div className="control-heading"><span>TRADE</span><b>{model}</b></div><div className="lineage-row"><span>{input.underlying}</span><strong>{baseLevel.toFixed(baseLevel < 10 ? 4 : 2)}</strong><em>{lineage.status} · {lineage.source}</em></div><div className="segmented"><button className={input.type === "call" ? "active" : ""} onClick={() => update("type", "call")}>Call</button><button className={input.type === "put" ? "active" : ""} onClick={() => update("type", "put")}>Put</button></div><ParameterInput label={input.mode === "forward" ? "Forward" : "Spot"} suffix="MARKET / USER" value={baseLevel} min={baseLevel < 10 ? .5 : 20} max={baseLevel < 10 ? 2 : 400} step={baseLevel < 10 ? .0001 : .5} onChange={(value) => update(input.mode === "forward" ? "forward" : "spot", value)} /><ParameterInput label="Strike" suffix="USER" value={input.strike} min={baseLevel < 10 ? .5 : 20} max={baseLevel < 10 ? 2 : 400} step={baseLevel < 10 ? .0001 : .5} onChange={(value) => update("strike", value)} /><ParameterInput label="Volatility" suffix="USER · decimal" value={input.volatility} min={.001} max={1} step={.001} onChange={(value) => update("volatility", value)} /><ParameterInput label="Time" suffix="years" value={input.time} min={.003} max={5} step={.01} onChange={(value) => update("time", value)} /><ParameterInput label={input.mode === "fx" ? "Domestic rate" : "Rate"} suffix="decimal" value={input.rate} min={-.02} max={.15} step={.001} onChange={(value) => update("rate", value)} />{(advanced || input.mode !== "forward") && <ParameterInput label={input.mode === "fx" ? "Foreign rate" : "Dividend yield"} suffix="decimal" value={input.foreignRate} min={0} max={.15} step={.001} onChange={(value) => update("foreignRate", value)} />}{advanced && <ParameterInput label="Notional" suffix="units" value={input.notional} min={1} max={1000000} step={1} onChange={(value) => update("notional", value)} />}<div className="desk-panel"><span>DATA LINEAGE</span><p>Underlying: {lineage.status} · {lineage.source} · {lineage.dataMode} · {lineage.asOf} · Volatility/rates: USER · PV: MODEL</p></div></aside>
      <div className="output-panel"><div className="pricer-output-head"><div className="metric-grid"><Metric label="PV · MODEL" value={analytics.price} primary /><Metric label="Delta" value={analytics.delta} /><Metric label="Gamma" value={analytics.gamma} /><Metric label="Vega / 1 vol pt" value={analytics.vega} /><Metric label="Theta / day" value={analytics.theta} /><Metric label="Rho / 100bp" value={analytics.rho} /></div></div><div className="diagnostic-strip"><span>FORWARD <b>{analytics.forward.toFixed(4)}</b></span><span>DF <b>{analytics.discountFactor.toFixed(6)}</b></span><span>INTRINSIC <b>{analytics.intrinsicValue.toFixed(4)}</b></span><span>TIME VALUE <b>{analytics.timeValue.toFixed(4)}</b></span><span>MONEYNESS <b>{analytics.moneyness.toFixed(4)}</b></span></div><div className="chart-card"><div className="chart-title"><div><span>RISK EXPLORER</span><strong>{metric.toUpperCase()} vs underlying</strong></div><div className="metric-picker">{metricOptions.map((item) => <button className={metric === item ? "active" : ""} onClick={() => setMetric(item)} key={item}>{item === "price" ? "PV" : item}</button>)}</div></div><LineChart x={levels} series={[{ name: metric, values: riskValues }]} xLabel={input.mode === "forward" ? "Forward" : "Spot"} yLabel={metricAxisLabel(metric)} description={`${metricAxisLabel(metric)} across the current ${input.mode === "forward" ? "forward" : "spot"} range.`} xFormatter={(value) => value.toFixed(baseLevel < 10 ? 4 : 2)} yFormatter={(value) => formatMetricValue(metric, value)} showTable height={300} /></div></div></div>
    <div className="analytics-grid"><section className="chart-card"><div className="chart-title"><div><span>SCENARIO MATRIX</span><strong>{metric.toUpperCase()} · underlying × volatility</strong></div><span>SINGLE VECTORIZED GRID</span></div><div className="scenario-table-wrap"><table className="scenario-matrix"><caption>{metricAxisLabel(metric)} by underlying level and volatility</caption><thead><tr><th scope="col">Underlying \ volatility</th>{grid.volatilities.map((vol) => <th scope="col" key={vol}>{(vol * 100).toFixed(1)}%</th>)}</tr></thead><tbody>{grid.values.map((row, rowIndex) => <tr key={grid.spots[rowIndex]}><th scope="row">{grid.spots[rowIndex].toFixed(baseLevel < 10 ? 4 : 2)}</th>{row.map((value, columnIndex) => <td key={`${rowIndex}-${columnIndex}`} style={{ "--cell-intensity": .2 + .8 * Math.min(1, Math.abs(value) / Math.max(1e-8, Math.abs(analytics[metric]) * 2)) } as React.CSSProperties}>{formatMetricValue(metric, value)}</td>)}</tr>)}</tbody></table></div></section><section className="chart-card"><div className="chart-title"><div><span>PAYOFF EXPLORER</span><strong>Value today ≠ payoff at maturity</strong></div><span>K {input.strike.toFixed(2)}</span></div><LineChart x={levels} series={[{ name: "Today", values: todayValue }, { name: "Payoff", values: payoff, color: "--chart-series-2" }]} xLabel="Terminal level" yLabel="Value (currency units)" description="Discounted option value today versus contractual payoff at maturity." xFormatter={(value) => value.toFixed(baseLevel < 10 ? 4 : 2)} yFormatter={(value) => value.toFixed(4)} height={250} /><p className="chart-note">{pick(locale, { en: "Today’s value includes discounted optionality and time value. The maturity payoff contains neither.", es: "El valor actual incluye opcionalidad descontada y valor temporal. El payoff al vencimiento no contiene ninguno." })}</p></section></div>
    <div className="secondary-grid"><section className="iv-calculator"><span className="eyebrow">IMPLIED VOLATILITY · BRENT</span><h3>{pick(locale, { en: "Invert price into volatility.", es: "Invierte precio en volatilidad." })}</h3><label>{pick(locale, { en: "Market option price", es: "Precio de opción de mercado" })}<input type="number" value={ivPrice} min="0" step="0.01" onChange={(event) => setIvPrice(Number(event.target.value))} /></label><button type="button" onClick={solveIv}>{pick(locale, { en: "SOLVE IV", es: "RESOLVER IV" })}</button><output>{ivMessage || pick(locale, { en: "Arbitrage bounds are checked before solving.", es: "Se comprueban límites de arbitraje antes de resolver." })}</output></section><section className="implementation-view"><div className="implementation-tabs">{(["formula", "python", "test"] as const).map((tab) => <button className={codeTab === tab ? "active" : ""} onClick={() => setCodeTab(tab)} key={tab}>{tab}</button>)}</div>{codeTab === "formula" && <code>V = φ · [S e^(−qT) N(φd₁) − K e^(−rT) N(φd₂)]</code>}{codeTab === "python" && <pre>{`def price(req):\n    d1 = (log(S/K) + (r-q+0.5*sigma**2)*T) / (sigma*sqrt(T))\n    return phi*(S*exp(-q*T)*N(phi*d1) - K*exp(-r*T)*N(phi*d2))`}</pre>}{codeTab === "test" && <pre>{`assert abs(call - put - (S*exp(-q*T) - K*exp(-r*T))) < 1e-10\nassert implied_vol(price(vol=.20)) == approx(.20)`}</pre>}</section></div>
    <section className="source-strip"><span>SOURCES &amp; FURTHER STUDY</span><a href="https://www.youtube.com/@ComputationsInFinance" target="_blank" rel="noreferrer">Computations in Finance ↗</a><a href="https://github.com/LechGrzelak/QuantFinanceBook/tree/master/PythonCodes/Chapter%2004" target="_blank" rel="noreferrer">QuantFinanceBook · Ch. 04 ↗</a><a href="https://www.quantlib.org/reference/" target="_blank" rel="noreferrer">QuantLib reference ↗</a><a href="/learn/equity/black-scholes">WHY? · Mathematics →</a></section>
  </div>;
}

function BlackScholesLab() {
  const { locale } = useI18n();
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
      <LabHeader index="01" title={pick(locale, { en: "Black-Scholes Playground", es: "Laboratorio Black–Scholes" })} copy={pick(locale, { en: "Move the state variables, then read price and hedge sensitivities as one connected system.", es: "Mueve las variables de estado y lee precio y sensibilidades de cobertura como un sistema conectado." })} note={pick(locale, { en: "European option · continuous rates/dividend · no transaction costs", es: "Opción europea · tipos/dividendos continuos · sin costes de transacción" })} />
      <div className="lab-grid">
        <aside className="control-panel">
          <div className="control-heading"><span>{pick(locale, { en: "MODEL PARAMETERS", es: "PARÁMETROS DEL MODELO" })}</span><button type="button" onClick={() => setInput(baseOption)}>{pick(locale, { en: "Reset", es: "Restablecer" })}</button></div>
          <div className="segmented"><button className={input.type === "call" ? "active" : ""} onClick={() => update("type", "call")}>Call</button><button className={input.type === "put" ? "active" : ""} onClick={() => update("type", "put")}>Put</button></div>
          <ParameterInput label="Spot" suffix="S" value={input.spot} min={40} max={180} step={1} onChange={(value) => update("spot", value)} />
          <ParameterInput label="Strike" suffix="K" value={input.strike} min={40} max={180} step={1} onChange={(value) => update("strike", value)} />
          <ParameterInput label={pick(locale, { en: "Time", es: "Tiempo" })} suffix={pick(locale, { en: "years", es: "años" })} value={input.time} min={0.003} max={5} step={0.01} onChange={(value) => update("time", value)} />
          <ParameterInput label={pick(locale, { en: "Risk-free rate", es: "Tipo libre de riesgo" })} suffix="decimal" value={input.rate} min={-0.02} max={0.15} step={0.001} onChange={(value) => update("rate", value)} />
          <ParameterInput label={pick(locale, { en: "Dividend yield", es: "Rentabilidad por dividendo" })} suffix="decimal" value={input.dividend} min={0} max={0.12} step={0.001} onChange={(value) => update("dividend", value)} />
          <ParameterInput label={pick(locale, { en: "Volatility", es: "Volatilidad" })} suffix="decimal" value={input.volatility} min={0.001} max={0.8} step={0.005} onChange={(value) => update("volatility", value)} />
          <div className="presets"><span>{pick(locale, { en: "PRESETS", es: "ESCENARIOS" })}</span><button onClick={() => setInput({ ...baseOption, spot: 120 })}>ITM</button><button onClick={() => setInput(baseOption)}>ATM</button><button onClick={() => setInput({ ...baseOption, spot: 80 })}>OTM</button></div>
          <button className="animate-button" type="button" onClick={() => { if (!animating) { const startTime = input.time < 0.05 ? 1 : input.time; animationStartRef.current = startTime; setInput((current) => ({ ...current, time: startTime })); } setAnimating((value) => !value); }}>{animating ? pick(locale, { en: "Pause expiry animation", es: "Pausar animación al vencimiento" }) : pick(locale, { en: "Animate time → expiry", es: "Animar tiempo → vencimiento" })}</button>
        </aside>
        <div className="output-panel">
          <div className="metric-grid"><Metric label="Price" value={analytics.price} primary /><Metric label="Delta" value={analytics.delta} /><Metric label="Gamma" value={analytics.gamma} /><Metric label="Vega / 1 vol pt" value={analytics.vega} /><Metric label="Theta / day" value={analytics.theta} /><Metric label="Rho / 100bp" value={analytics.rho} /></div>
          <div className="chart-card"><div className="chart-title"><div><span>OPTION VALUE</span><strong>Price across spot</strong></div></div><LineChart x={spots} series={[{ name: "Model", values: prices }, { name: "Intrinsic", values: intrinsic, color: "--chart-series-2" }]} xLabel="Spot" yLabel="Value (currency units)" description="Black–Scholes model value and intrinsic value across spot." xFormatter={(value) => value.toFixed(0)} yFormatter={(value) => value.toFixed(4)} /></div>
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
const greekHeatSpots = Array.from({ length: 12 }, (_, index) => 65 + index * 6.5);
const greekHeatTimes = Array.from({ length: 4 }, (_, index) => 0.05 + index * 0.48);

function GreeksLab() {
  const { locale } = useI18n();
  const [greek, setGreek] = useState<GreekKey>("gamma");
  const [input, setInput] = useState(baseOption);
  const [heatmap, setHeatmap] = useState(false);
  const spots = useMemo(() => Array.from({ length: 81 }, (_, index) => 55 + index * 1.125), []);
  const values = useMemo(() => spots.map((spot) => blackScholes({ ...input, spot })[greek]), [spots, input, greek]);
  const analytics = useMemo(() => blackScholes(input), [input]);
  const current = analytics[greek];
  const heatValues = useMemo(() => greekHeatTimes.map((time) => greekHeatSpots.map((spot) => blackScholes({ ...input, spot, time })[greek])), [input, greek]);
  const heatMax = Math.max(...heatValues.flat().map(Math.abs), 1e-8);
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
          <div className="chart-card"><div className="chart-title"><div><span>SENSITIVITY PROFILE</span><strong>{greek[0].toUpperCase() + greek.slice(1)} against spot</strong></div></div><LineChart x={spots} series={[{ name: greek, values }]} xLabel="Spot" yLabel={metricAxisLabel(greek)} description={`${metricAxisLabel(greek)} across spot under the current Black–Scholes state.`} xFormatter={(value) => value.toFixed(0)} yFormatter={(value) => formatMetricValue(greek, value)} height={310} /></div>
          {heatmap && <div className="heatmap-card"><div className="chart-title"><div><span>SPOT × TIME</span><strong>{metricAxisLabel(greek)}</strong></div><span>0.05Y → 1.49Y</span></div><div className="greek-heatmap-wrap"><table className="greek-heatmap"><caption>{metricAxisLabel(greek)} by time to expiry and spot</caption><thead><tr><th scope="col">Time \ spot</th>{greekHeatSpots.map((spot) => <th scope="col" key={spot}>{spot.toFixed(1)}</th>)}</tr></thead><tbody>{heatValues.map((row, rowIndex) => <tr key={greekHeatTimes[rowIndex]}><th scope="row">{greekHeatTimes[rowIndex].toFixed(2)}Y</th>{row.map((value, columnIndex) => <td key={greekHeatSpots[columnIndex]} style={{ "--cell-intensity": 0.15 + 0.85 * Math.abs(value) / heatMax } as React.CSSProperties} aria-label={`${greekHeatTimes[rowIndex].toFixed(2)} years, spot ${greekHeatSpots[columnIndex].toFixed(1)}, ${metricAxisLabel(greek)} ${formatMetricValue(greek, value)}`}>{formatMetricValue(greek, value)}</td>)}</tr>)}</tbody></table></div></div>}
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
  const { locale } = useI18n();
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
      <LabHeader index="04" title={pick(locale, { en: "Yield Curve Explorer", es: "Explorador de curva de tipos" })} copy={pick(locale, { en: "Move one node or reshape the entire term structure. Watch discounting and forwards inherit the decision.", es: "Mueve un nodo o transforma toda la estructura temporal. Observa cómo descuento y forwards heredan la decisión." })} note={pick(locale, { en: "Simplified educational zero-quote bootstrap · continuously compounded", es: "Bootstrap educativo simplificado de tipos cero · capitalización continua" })} />
      <div className="curve-actions"><button onClick={() => setNodes(curveSeed)}>{pick(locale, { en: "Reset curve", es: "Restablecer curva" })}</button><button onClick={() => transform("shift")}>{pick(locale, { en: "Parallel +25bp", es: "Paralela +25pb" })}</button><button onClick={() => transform("steepen")}>{pick(locale, { en: "Steepen", es: "Aumentar pendiente" })}</button><button onClick={() => transform("flatten")}>{pick(locale, { en: "Flatten", es: "Aplanar" })}</button><button onClick={() => transform("bump")}>{pick(locale, { en: "Every node +1bp", es: "Cada nodo +1pb" })}</button></div>
      <div className="curve-workspace">
        <div className="chart-card curve-chart-card"><div className="chart-title"><div><span>{pick(locale, { en: "INTERACTIVE ZERO CURVE", es: "CURVA CERO INTERACTIVA" })}</span><strong>{pick(locale, { en: "Drag a node vertically to reprice the structure", es: "Arrastra un nodo verticalmente para revalorar la estructura" })}</strong></div><span className="demo-chip">{pick(locale, { en: "DEMO QUOTES", es: "COTIZACIONES DEMO" })}</span></div><CurveCanvas nodes={nodes} onChange={setQuote} locale={locale} /><div className="curve-series"><span><i /> {pick(locale, { en: "Zero rate", es: "Tipo cero" })}</span><span><i /> {pick(locale, { en: "Forward rate", es: "Tipo forward" })}</span><span><i /> {pick(locale, { en: "Discount factor", es: "Factor de descuento" })}</span></div></div>
        <div className="bootstrap-flow" aria-label={pick(locale, { en: "Bootstrap flow", es: "Flujo de bootstrap" })}><span>{pick(locale, { en: "Market instruments", es: "Instrumentos de mercado" })}</span><b>↓</b><span>Bootstrap</span><b>↓</b><span>{pick(locale, { en: "Discount factors", es: "Factores de descuento" })}</span><b>↓</b><span>{pick(locale, { en: "Zero curve", es: "Curva cero" })}</span><b>↓</b><span>{pick(locale, { en: "Forward curve", es: "Curva forward" })}</span></div>
      </div>
      <div className="curve-table-wrap" id="curve-numeric-fallback"><table className="curve-table"><caption>{pick(locale, { en: "Keyboard numeric curve controls and exact outputs", es: "Controles numéricos de teclado y resultados exactos de la curva" })}</caption><thead><tr><th>Tenor</th><th>{pick(locale, { en: "Market quote", es: "Cotización" })}</th><th>{pick(locale, { en: "Zero rate", es: "Tipo cero" })}</th><th>{pick(locale, { en: "Discount factor", es: "Factor de descuento" })}</th><th>{pick(locale, { en: "Forward rate", es: "Tipo forward" })}</th><th>{pick(locale, { en: "Node control", es: "Control del nodo" })}</th></tr></thead><tbody>{curve.map((node, index) => <tr key={node.tenor}><td><strong>{node.tenor}</strong></td><td>{(node.quote * 100).toFixed(3)}%</td><td>{(node.zero * 100).toFixed(3)}%</td><td>{node.discount.toFixed(6)}</td><td className={node.forward >= 0 ? "positive" : "negative"}>{(node.forward * 100).toFixed(3)}%</td><td><input aria-label={`${node.tenor} ${pick(locale, { en: "quote as a decimal", es: "cotización en decimal" })}`} type="number" min="-0.01" max="0.09" step="0.0001" value={Number(node.quote.toFixed(6))} onChange={(event) => setQuote(index, Number(event.target.value))} /></td></tr>)}</tbody></table></div>
    </div>
  );
}

function CurveCanvas({ nodes, onChange, locale }: { nodes: CurveNode[]; onChange: (index: number, quote: number) => void; locale: "en" | "es" }) {
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
    const style = getComputedStyle(canvas); const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || style.getPropertyValue(fallback).trim();
    const chartGrid = token("--chart-grid", "--border"); const chartMuted = token("--chart-muted", "--muted"); const chartInk = token("--chart-ink", "--ink"); const zeroColor = token("--chart-series-1", "--accent"); const forwardColor = token("--chart-series-2", "--gold");
    context.clearRect(0, 0, width, height); context.font = "11px ui-monospace, monospace";
    context.strokeStyle = chartGrid; context.fillStyle = chartMuted;
    for (let tick = 0; tick <= 4; tick += 1) { const y = pad.t + tick / 4 * (height - pad.t - pad.b); context.beginPath(); context.moveTo(pad.l, y); context.lineTo(width - pad.r, y); context.stroke(); context.fillText(`${((maxRate - tick / 4 * (maxRate - minRate)) * 100).toFixed(1)}%`, 5, y + 4); }
    const drawSeries = (values: number[], color: string, widthLine: number) => { context.beginPath(); values.forEach((value, index) => index ? context.lineTo(mapX(curve[index].time), mapY(value)) : context.moveTo(mapX(curve[index].time), mapY(value))); context.strokeStyle = color; context.lineWidth = widthLine; context.stroke(); };
    drawSeries(curve.map((node) => node.zero), zeroColor, 2.3); drawSeries(curve.map((node) => node.forward), forwardColor, 1.5);
    curve.forEach((node) => { context.beginPath(); context.arc(mapX(node.time), mapY(node.quote), 5, 0, Math.PI * 2); context.fillStyle = chartInk; context.fill(); context.strokeStyle = zeroColor; context.lineWidth = 2; context.stroke(); context.fillStyle = chartMuted; context.fillText(node.tenor, mapX(node.time) - 8, height - 10); });
    const pointerDown = (event: PointerEvent) => { const box = canvas.getBoundingClientRect(); let nearest = -1; let distance = 18; curve.forEach((node, index) => { const current = Math.hypot(mapX(node.time) - (event.clientX - box.left), mapY(node.quote) - (event.clientY - box.top)); if (current < distance) { distance = current; nearest = index; } }); if (nearest >= 0) { dragRef.current = nearest; canvas.setPointerCapture(event.pointerId); } };
    const pointerMove = (event: PointerEvent) => { if (dragRef.current === null) return; const box = canvas.getBoundingClientRect(); const ratioY = 1 - ((event.clientY - box.top - pad.t) / (height - pad.t - pad.b)); onChange(dragRef.current, minRate + ratioY * (maxRate - minRate)); };
    const pointerUp = () => { dragRef.current = null; };
    canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointermove", pointerMove); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointerleave", pointerUp);
    return () => { canvas.removeEventListener("pointerdown", pointerDown); canvas.removeEventListener("pointermove", pointerMove); canvas.removeEventListener("pointerup", pointerUp); canvas.removeEventListener("pointerleave", pointerUp); };
  }, [nodes, onChange]);
  return <canvas ref={canvasRef} className="curve-canvas" aria-describedby="curve-numeric-fallback" aria-label={pick(locale, { en: "Interactive zero and forward curve. Drag rate nodes vertically, or use the keyboard numeric table below.", es: "Curvas cero y forward interactivas. Arrastra los nodos verticalmente o usa la tabla numérica de teclado inferior." })} />;
}

function LabHeader({ index, title, copy, note }: { index: string; title: string; copy: string; note: string }) {
  const { locale } = useI18n();
  return <header className="experiment-header"><div><span className="eyebrow">{pick(locale, { en: "EXPERIMENT", es: "EXPERIMENTO" })} {index}</span><h2>{title}</h2><p>{copy}</p></div><span className="assumption-note">{note}</span></header>;
}
