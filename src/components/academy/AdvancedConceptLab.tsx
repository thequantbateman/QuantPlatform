"use client";

import { useMemo, useState } from "react";
import { LineChart, type Series } from "@/src/components/charts/LineChart";
import { formatPercent, formatYear } from "@/src/components/charts/chartModel";
import type { AcademyLabId, AcademyLesson } from "@/src/content/academy/types";
import { pick, useI18n } from "@/src/i18n";
import { blackScholes } from "@/src/quant/models/blackScholes";
import { conditionalBinomialExpectation, girsanovDensity, measureState, type PricingMeasure } from "@/src/quant/probability/measureChange";
import { buildExposureProfile, expectedPositiveExposure, historicalVarEs, unilateralCva } from "@/src/quant/risk/exposure";
import { antitheticVarianceReduction, compareGbmSchemes, monteCarloStandardError } from "@/src/quant/simulation/schemes";
import { QuantFlow } from "./QuantFlow";

type Copy = { en: string; es: string };
const c = (en: string, es: string): Copy => ({ en, es });
const range = (count: number, start: number, end: number): number[] => Array.from({ length: count }, (_, index) => start + index * (end - start) / Math.max(1, count - 1));
const pct = (value: number): string => `${(value * 100).toFixed(2)}%`;

function Control({ label, value, min, max, step, format = (x) => x.toFixed(2), onChange }: { label: string; value: number; min: number; max: number; step: number; format?: (value: number) => string; onChange: (value: number) => void }) {
  return <label className="advanced-control"><span><b>{label}</b><output>{format(value)}</output></span><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function Readouts({ values }: { values: Array<[string, string, string?]> }) {
  return <div className="advanced-readouts">{values.map(([label, value, note]) => <div key={label}><span>{label}</span><b>{value}</b>{note && <small>{note}</small>}</div>)}</div>;
}

function LabShell({ eyebrow, title, description, controls, children, footnote }: { eyebrow: string; title: string; description: string; controls: React.ReactNode; children: React.ReactNode; footnote: string }) {
  return <section className="advanced-lab"><header><div><span>{eyebrow}</span><h3>{title}</h3><p>{description}</p></div><b>SYNTHETIC · EDUCATIONAL</b></header><div className="advanced-lab-grid"><aside>{controls}</aside><div className="advanced-lab-output">{children}</div></div><footer><span>MODEL BOUNDARY</span><p>{footnote}</p></footer></section>;
}

function FiltrationLab({ lesson }: { lesson: AcademyLesson }) {
  const { locale } = useI18n();
  const id = lesson.interactiveLabs[0].id;
  const [time, setTime] = useState(1);
  const [probability, setProbability] = useState(0.56);
  const payoff = conditionalBinomialExpectation(18, -8, probability);
  const eventLabels = [c("Initial term sheet", "Term sheet inicial"), c("Spot and first fixing", "Spot y primer fixing"), c("Barrier observation", "Observación de barrera"), c("Final fixing", "Fixing final")];
  const adapted = time >= 2;
  const isConditional = id === "conditional-expectation";
  return <LabShell eyebrow={pick(locale, c("INFORMATION EXPLORER", "EXPLORADOR DE INFORMACIÓN"))} title={lesson.title} description={pick(locale, c("Move the information clock. The admissible decision and conditional value update without revealing future states.", "Mueve el reloj informativo. La decisión admisible y el valor condicional se actualizan sin revelar estados futuros."))} footnote={pick(locale, c("Finite-state illustration only. Real filtrations encode continuous and asynchronous information.", "Ilustración de estados finitos. Las filtraciones reales codifican información continua y asíncrona."))} controls={<><Control label={pick(locale, c("Information time", "Tiempo informativo"))} value={time} min={0} max={3} step={1} format={(value) => `t${value}`} onChange={setTime} />{isConditional && <Control label={pick(locale, c("Conditional up probability", "Probabilidad condicional alcista"))} value={probability} min={0.05} max={0.95} step={0.01} format={pct} onChange={setProbability} />}</>}>
    <div className="information-timeline" role="list" aria-label={pick(locale, c("Information timeline", "Línea temporal de información"))}>{eventLabels.map((event, index) => <div role="listitem" className={index <= time ? "revealed" : "hidden"} key={event.en}><span>t{index}</span><b>{pick(locale, event)}</b><small>{index <= time ? pick(locale, c("MEASURABLE NOW", "MEDIBLE AHORA")) : pick(locale, c("NOT YET OBSERVABLE", "AÚN NO OBSERVABLE"))}</small></div>)}</div>
    <Readouts values={isConditional ? [[pick(locale, c("E[X | Fₜ]", "E[X | Fₜ]")), payoff.toFixed(2), pick(locale, c("node-weighted payoff", "payoff ponderado por nodo"))], [pick(locale, c("Tower check", "Comprobación de torre")), "PASS", "E[E[X|F₂]|F₁]=E[X|F₁]"]] : [[pick(locale, c("Known events", "Sucesos conocidos")), `${2 ** (time + 1)}`, pick(locale, c("nested information atoms", "átomos informativos anidados"))], [pick(locale, c("Barrier hedge", "Cobertura de barrera")), adapted ? pick(locale, c("ADMISSIBLE", "ADMISIBLE")) : pick(locale, c("TOO EARLY", "DEMASIADO PRONTO")), pick(locale, c("depends on t2 observation", "depende de la observación t2"))]]} />
    <QuantFlow eyebrow={pick(locale, c("MEASURABILITY FLOW", "FLUJO DE MEDIBILIDAD"))} title={pick(locale, c("Information determines admissible action", "La información determina la acción admisible"))} thesis={pick(locale, c("A trading rule can use exactly the events revealed by the current σ-algebra.", "Una regla de trading puede usar exactamente los sucesos revelados por la σ-álgebra actual."))} nodes={[{ id: "flow-info", label: "Fₜ", value: `${2 ** (time + 1)} atoms`, detail: pick(locale, c("Current information partition", "Partición informativa actual")), kind: "information" }, { id: "flow-state", label: pick(locale, c("State", "Estado")), value: `t${time}`, detail: pick(locale, c("Observable variables only", "Solo variables observables")), kind: "model" }, { id: "flow-action", label: pick(locale, c("Decision", "Decisión")), value: adapted ? "adapted" : "blocked", detail: pick(locale, c("No future observation enters the rule", "Ninguna observación futura entra en la regla")), kind: "risk" }]} />
  </LabShell>;
}

function MeasureLab({ lesson }: { lesson: AcademyLesson }) {
  const { locale } = useI18n();
  const id = lesson.interactiveLabs[0].id;
  const [measure, setMeasure] = useState<PricingMeasure>(id === "forward-measures" ? "QT" : "Q");
  const [mu, setMu] = useState(0.085);
  const [rate, setRate] = useState(0.035);
  const [vol, setVol] = useState(0.22);
  const [time, setTime] = useState(1);
  const lambda = (mu - rate) / vol;
  const x = range(81, -3 * Math.sqrt(time), 3 * Math.sqrt(time));
  const density = x.map((brownian) => girsanovDensity(lambda, brownian, time));
  const state = measureState(measure, mu, rate, rate + 0.004);
  const series: Series[] = [{ name: "Zₜ(Wₜ)", values: density, color: "--chart-series-2" }];
  return <LabShell eyebrow={pick(locale, c("MEASURE-CHANGE ENGINE", "MOTOR DE CAMBIO DE MEDIDA"))} title={lesson.title} description={pick(locale, c("Switch measure and move the physical inputs. Drift, numeraire, martingale and density update together.", "Cambia de medida y mueve las entradas físicas. Drift, numerario, martingala y densidad se actualizan conjuntamente."))} footnote={pick(locale, c("One-factor constant-coefficient diffusion. The density is illustrative and not a calibrated risk-premium model.", "Difusión unifactor de coeficientes constantes. La densidad es ilustrativa y no un modelo calibrado de prima de riesgo."))} controls={<><div className="measure-picker" role="group" aria-label={pick(locale, c("Pricing measure", "Medida de valoración"))}>{(["P", "Q", "QT"] as PricingMeasure[]).map((item) => <button className={measure === item ? "active" : ""} onClick={() => setMeasure(item)} key={item}>{item === "QT" ? "Qᵀ" : item}</button>)}</div><Control label={pick(locale, c("Physical drift μ", "Drift físico μ"))} value={mu} min={-0.02} max={0.16} step={0.001} format={pct} onChange={setMu} /><Control label={pick(locale, c("Money-market rate r", "Tipo monetario r"))} value={rate} min={-0.01} max={0.10} step={0.001} format={pct} onChange={setRate} /><Control label={pick(locale, c("Volatility σ", "Volatilidad σ"))} value={vol} min={0.05} max={0.60} step={0.005} format={pct} onChange={setVol} /><Control label={pick(locale, c("Horizon", "Horizonte"))} value={time} min={0.1} max={5} step={0.1} format={(value) => `${value.toFixed(1)}Y`} onChange={setTime} /></>}>
    <Readouts values={[[pick(locale, c("Active drift", "Drift activo")), pct(state.drift), measure === "P" ? "μ" : measure === "Q" ? "r" : "forward"], [pick(locale, c("Market price λ", "Precio de riesgo λ")), lambda.toFixed(4), "(μ−r)/σ"], [pick(locale, c("Numeraire", "Numerario")), state.numeraire, state.martingale]]} />
    <div className="advanced-chart"><LineChart x={x} series={series} xLabel={pick(locale, c("Brownian state Wₜ", "Estado browniano Wₜ"))} yLabel={pick(locale, c("Likelihood ratio Zₜ", "Razón de verosimilitud Zₜ"))} description={pick(locale, c("Likelihood-ratio weights across the current Brownian state range.", "Pesos de razón de verosimilitud en el rango actual del estado browniano."))} xFormatter={(value) => value.toFixed(2)} yFormatter={(value) => value.toFixed(3)} height={310} /></div>
    <QuantFlow eyebrow={pick(locale, c("PRICING COORDINATES", "COORDENADAS DE VALORACIÓN"))} title={pick(locale, c("Change weight, drift and martingale together", "Cambia conjuntamente peso, drift y martingala"))} thesis={state.expectation} nodes={[{ id: "measure-p", label: pick(locale, c("Physical law", "Ley física")), value: `μ=${pct(mu)}`, detail: pick(locale, c("Forecast and risk-premium distribution", "Distribución de predicción y prima de riesgo")), kind: "measure" }, { id: "measure-density", label: pick(locale, c("Density", "Densidad")), value: `λ=${lambda.toFixed(3)}`, detail: pick(locale, c("Positive likelihood-ratio process", "Proceso positivo de razón de verosimilitud")), kind: "model" }, { id: "measure-q", label: measure === "QT" ? "Qᵀ" : "Q", value: state.martingale, detail: state.numeraire, kind: "market" }]} />
  </LabShell>;
}

function NumericalLab({ lesson }: { lesson: AcademyLesson }) {
  const { locale } = useI18n();
  const id = lesson.interactiveLabs[0].id;
  const [steps, setSteps] = useState(32);
  const [seed, setSeed] = useState(42);
  const [vol, setVol] = useState(0.25);
  const [paths, setPaths] = useState(4096);
  const comparison = useMemo(() => compareGbmSchemes({ spot: 100, rate: 0.035, volatility: vol, horizon: 1, steps, seed }), [vol, steps, seed]);
  const exact = comparison.exact.at(-1)!;
  const eulerError = Math.abs(comparison.euler.at(-1)! - exact);
  const milsteinError = Math.abs(comparison.milstein.at(-1)! - exact);
  const standardError = monteCarloStandardError(182, paths);
  const correlation = Math.max(-0.98, -0.2 - 0.75 * Math.min(1, vol / 0.5));
  const reduction = antitheticVarianceReduction(correlation);
  const isFourier = id === "fourier-cos";
  const frequencies = range(Math.min(128, steps * 2), 0, Math.PI * Math.min(128, steps * 2));
  const characteristic = frequencies.map((u) => Math.exp(-0.5 * vol ** 2 * u ** 2) * Math.cos((0.035 - 0.5 * vol ** 2) * u));
  const baseSeries: Series[] = isFourier ? [{ name: "Re φ(u)", values: characteristic, color: "--chart-series-3" }] : [{ name: pick(locale, c("exact", "exacto")), values: comparison.exact, color: "--chart-series-3" }, { name: "Euler", values: comparison.euler, color: "--chart-series-2" }, { name: "Milstein", values: comparison.milstein, color: "--chart-series-1" }];
  const x = isFourier ? frequencies : comparison.time;
  return <LabShell eyebrow={pick(locale, c("NUMERICAL ERROR LAB", "LABORATORIO DE ERROR NUMÉRICO"))} title={lesson.title} description={pick(locale, c("Use a fixed seed to separate discretization, sampling and truncation effects.", "Usa una semilla fija para separar discretización, muestreo y truncamiento."))} footnote={pick(locale, c("GBM and Gaussian transform examples are analytical references, not production calibration engines.", "Los ejemplos GBM y de transformada gaussiana son referencias analíticas, no motores de calibración productivos."))} controls={<><Control label={isFourier ? pick(locale, c("COS modes", "Modos COS")) : pick(locale, c("Time steps", "Pasos temporales"))} value={steps} min={4} max={128} step={4} format={(value) => value.toFixed(0)} onChange={setSteps} /><Control label={pick(locale, c("Seed", "Semilla"))} value={seed} min={1} max={99} step={1} format={(value) => value.toFixed(0)} onChange={setSeed} /><Control label={pick(locale, c("Volatility", "Volatilidad"))} value={vol} min={0.05} max={0.60} step={0.01} format={pct} onChange={setVol} /><Control label={pick(locale, c("Path count", "Número de trayectorias"))} value={paths} min={512} max={32768} step={512} format={(value) => value.toLocaleString()} onChange={setPaths} /></>}>
    <Readouts values={isFourier ? [[pick(locale, c("Modes", "Modos")), `${steps}`, pick(locale, c("frequency truncation", "truncamiento en frecuencia"))], [pick(locale, c("Tail coefficient", "Coeficiente de cola")), Math.abs(characteristic.at(-1)!).toExponential(2), pick(locale, c("smaller is better", "menor es mejor"))], [pick(locale, c("Reference", "Referencia")), "φ(0)=1", characteristic[0].toFixed(6)]] : id === "variance-reduction" ? [[pick(locale, c("Plain SE", "EE simple")), standardError.toFixed(4), `N=${paths.toLocaleString()}`], [pick(locale, c("Antithetic factor", "Factor antitético")), reduction.toFixed(3), `ρ=${correlation.toFixed(3)}`], [pick(locale, c("Reduced SE", "EE reducido")), (standardError * Math.sqrt(reduction)).toFixed(4), pick(locale, c("same path budget", "mismo presupuesto"))]] : [[pick(locale, c("Euler terminal error", "Error terminal Euler")), eulerError.toFixed(4), `M=${steps}`], [pick(locale, c("Milstein terminal error", "Error terminal Milstein")), milsteinError.toFixed(4), pick(locale, c("same shocks", "mismos shocks"))], [pick(locale, c("Monte Carlo SE", "EE Monte Carlo")), standardError.toFixed(4), `N=${paths.toLocaleString()}`]]} />
    <div className="advanced-chart"><LineChart x={x} series={baseSeries} xLabel={isFourier ? pick(locale, c("frequency u", "frecuencia u")) : pick(locale, c("time (years)", "tiempo (años)"))} yLabel={isFourier ? "Re φ(u)" : pick(locale, c("spot level", "nivel spot"))} description={isFourier ? pick(locale, c("Real characteristic-function coefficients by frequency.", "Coeficientes reales de la función característica por frecuencia.")) : pick(locale, c("Exact, Euler and Milstein spot paths using the same shocks.", "Trayectorias spot exacta, Euler y Milstein con los mismos shocks."))} xFormatter={isFourier ? (value) => value.toFixed(1) : formatYear} yFormatter={(value) => value.toFixed(isFourier ? 4 : 2)} height={330} /></div>
    <QuantFlow eyebrow={pick(locale, c("ERROR BUDGET", "PRESUPUESTO DE ERROR"))} title={pick(locale, c("Model → algorithm → evidence", "Modelo → algoritmo → evidencia"))} thesis={pick(locale, c("Each numerical approximation has an independent control and a reference diagnostic.", "Cada aproximación numérica tiene un control independiente y un diagnóstico de referencia."))} nodes={[{ id: "num-law", label: pick(locale, c("Target law", "Ley objetivo")), value: "Q / GBM", detail: pick(locale, c("Measure and SDE fixed", "Medida y EDE fijadas")), kind: "measure" }, { id: "num-algo", label: pick(locale, c("Algorithm", "Algoritmo")), value: isFourier ? `${steps} modes` : `${steps} steps`, detail: pick(locale, c("Discretization or transform control", "Control de discretización o transformada")), kind: "model" }, { id: "num-check", label: pick(locale, c("Diagnostic", "Diagnóstico")), value: isFourier ? "φ(0)=1" : `SE=${standardError.toFixed(3)}`, detail: pick(locale, c("Visible convergence evidence", "Evidencia visible de convergencia")), kind: "risk" }]} />
  </LabShell>;
}

function GreeksLab({ lesson }: { lesson: AcademyLesson }) {
  const { locale } = useI18n();
  const id = lesson.interactiveLabs[0].id;
  const [spot, setSpot] = useState(100);
  const [vol, setVol] = useState(0.22);
  const [time, setTime] = useState(1);
  const [cost, setCost] = useState(0.001);
  const analytics = blackScholes({ spot, strike: 100, time, rate: 0.035, dividend: 0.01, volatility: vol, type: "call" });
  const x = range(81, 60, 140);
  const deltas = x.map((nextSpot) => blackScholes({ spot: nextSpot, strike: 100, time, rate: 0.035, dividend: 0.01, volatility: vol, type: "call" }).delta);
  const gammas = x.map((nextSpot) => blackScholes({ spot: nextSpot, strike: 100, time, rate: 0.035, dividend: 0.01, volatility: vol, type: "call" }).gamma);
  const basePrice = analytics.price;
  const upVol = blackScholes({ spot, strike: 100, time, rate: 0.035, dividend: 0.01, volatility: Math.min(1, vol + 0.01), type: "call" });
  const downVol = blackScholes({ spot, strike: 100, time, rate: 0.035, dividend: 0.01, volatility: Math.max(0.001, vol - 0.01), type: "call" });
  const volga = (upVol.price - 2 * basePrice + downVol.price) / (0.01 ** 2) * 0.0001;
  const vanna = (upVol.delta - downVol.delta) / 0.02 * 0.01;
  const hedgeSteps = range(41, 0, 1);
  const hedgePnl = hedgeSteps.map((_, index) => 0.45 * Math.sin(index * 0.63) * Math.sqrt(index / 40) - cost * index * spot * 0.16);
  const isHedge = id === "hedging-pnl";
  const series: Series[] = isHedge ? [{ name: pick(locale, c("cumulative hedge P&L", "P&L acumulado de cobertura")), values: hedgePnl, color: "--chart-series-4" }] : id === "higher-order-greeks" ? [{ name: "Gamma", values: gammas, color: "--chart-series-2" }] : [{ name: "Delta", values: deltas, color: "--chart-series-1" }];
  return <LabShell eyebrow={pick(locale, c("RISK RESPONSE LAB", "LABORATORIO DE RESPUESTA DE RIESGO"))} title={lesson.title} description={pick(locale, c("Move spot, volatility and horizon. Prices, desk-unit Greeks and hedge residuals share one pricing state.", "Mueve spot, volatilidad y horizonte. Precios, griegas de mesa y residuos comparten un estado de valoración."))} footnote={pick(locale, c("European Black–Scholes reference with synthetic hedge residuals. Surface dynamics and liquidity are simplified.", "Referencia Black–Scholes europea con residuos sintéticos. Dinámica de superficie y liquidez están simplificadas."))} controls={<><Control label="Spot" value={spot} min={60} max={140} step={1} format={(value) => value.toFixed(0)} onChange={setSpot} /><Control label={pick(locale, c("Volatility", "Volatilidad"))} value={vol} min={0.05} max={0.65} step={0.01} format={pct} onChange={setVol} /><Control label={pick(locale, c("Time to expiry", "Tiempo a vencimiento"))} value={time} min={0.03} max={3} step={0.03} format={(value) => `${value.toFixed(2)}Y`} onChange={setTime} />{isHedge && <Control label={pick(locale, c("Transaction cost", "Coste de transacción"))} value={cost} min={0} max={0.005} step={0.0001} format={(value) => `${(value * 10_000).toFixed(1)} bp`} onChange={setCost} />}</>}>
    <Readouts values={isHedge ? [[pick(locale, c("Option value", "Valor de opción")), analytics.price.toFixed(4), "Black–Scholes"], [pick(locale, c("Hedge residual", "Residuo de cobertura")), hedgePnl.at(-1)!.toFixed(4), pick(locale, c("after transaction costs", "tras costes"))], [pick(locale, c("Turnover charge", "Cargo de rotación")), (cost * 40 * spot * 0.16).toFixed(4), `${(cost * 10_000).toFixed(1)} bp`]] : [["Delta", analytics.delta.toFixed(5), pick(locale, c("per 1 spot unit", "por 1 unidad spot"))], [id === "higher-order-greeks" ? "Gamma" : "Vega", (id === "higher-order-greeks" ? analytics.gamma : analytics.vega).toFixed(5), id === "higher-order-greeks" ? "∂²V/∂S²" : pick(locale, c("per 1 vol point", "por 1 punto vol"))], [id === "higher-order-greeks" ? "Vanna / Volga" : "Theta / Rho", id === "higher-order-greeks" ? `${vanna.toFixed(4)} / ${volga.toFixed(4)}` : `${analytics.theta.toFixed(4)} / ${analytics.rho.toFixed(4)}`, pick(locale, c("declared desk units", "unidades de mesa declaradas"))]]} />
    <div className="advanced-chart"><LineChart x={isHedge ? hedgeSteps : x} series={series} xLabel={isHedge ? pick(locale, c("hedge progress", "progreso de cobertura")) : "Spot"} yLabel={isHedge ? pick(locale, c("P&L (currency units)", "P&L (unidades monetarias)")) : series[0].name} description={isHedge ? pick(locale, c("Synthetic cumulative hedge P&L after transaction costs.", "P&L sintético acumulado de cobertura tras costes de transacción.")) : pick(locale, c("Local option sensitivity across spot, in declared desk units.", "Sensibilidad local de la opción frente al spot, en unidades de mesa declaradas."))} xFormatter={isHedge ? formatPercent : (value) => value.toFixed(0)} yFormatter={(value) => value.toFixed(isHedge ? 4 : 5)} height={330} /></div>
  </LabShell>;
}

function RiskLab({ lesson }: { lesson: AcademyLesson }) {
  const { locale } = useI18n();
  const id = lesson.interactiveLabs[0].id;
  const [notional, setNotional] = useState(10);
  const [vol, setVol] = useState(0.18);
  const [threshold, setThreshold] = useState(0.35);
  const [confidence, setConfidence] = useState(0.95);
  const profile = buildExposureProfile(5, notional, vol, confidence, threshold);
  const epe = expectedPositiveExposure(profile);
  const cva = unilateralCva(epe, 0.035, 0.4, Math.exp(-0.03 * 2.5));
  const losses = Array.from({ length: 240 }, (_, index) => Math.max(0, 0.55 + 0.32 * Math.sin(index * 1.71) + 0.14 * Math.cos(index * 0.37) + (index % 53 === 0 ? 1.1 * vol / 0.18 : 0)) * notional / 10);
  const tail = historicalVarEs(losses, confidence);
  const isVar = id === "var-es";
  const isModel = id === "model-risk";
  const x = isVar || isModel ? losses.map((_, index) => index) : profile.map((point) => point.time);
  const series: Series[] = isVar || isModel ? [{ name: pick(locale, c("scenario loss", "pérdida por escenario")), values: losses, color: "--chart-series-4" }, { name: "VaR", values: losses.map(() => tail.var), color: "--chart-series-2" }] : [{ name: "EE", values: profile.map((point) => point.ee), color: "--chart-series-1" }, { name: "PFE", values: profile.map((point) => point.pfe), color: "--chart-series-2" }, { name: pick(locale, c("collateralized EE", "EE con colateral")), values: profile.map((point) => point.collateralizedEe), color: "--chart-series-3" }];
  return <LabShell eyebrow={pick(locale, c("PORTFOLIO RISK LAB", "LABORATORIO DE RIESGO DE CARTERA"))} title={lesson.title} description={pick(locale, c("Change scale, volatility, collateral and confidence. Exposure, tail and adjustment metrics respond from one synthetic portfolio.", "Cambia escala, volatilidad, colateral y confianza. Exposición, cola y ajustes responden desde una cartera sintética."))} footnote={pick(locale, c("Synthetic pedagogical profile. It omits legal CSA detail, calibrated wrong-way risk and production backtesting.", "Perfil pedagógico sintético. Omite detalle legal CSA, wrong-way calibrado y backtesting productivo."))} controls={<><Control label={pick(locale, c("Notional (mm)", "Nocional (mm)"))} value={notional} min={1} max={50} step={1} format={(value) => `${value.toFixed(0)}m`} onChange={setNotional} /><Control label={pick(locale, c("Risk-factor volatility", "Volatilidad del factor"))} value={vol} min={0.05} max={0.60} step={0.01} format={pct} onChange={setVol} /><Control label={pick(locale, c("CSA threshold (mm)", "Umbral CSA (mm)"))} value={threshold} min={0} max={2} step={0.05} format={(value) => `${value.toFixed(2)}m`} onChange={setThreshold} /><Control label={pick(locale, c("Confidence", "Confianza"))} value={confidence} min={0.90} max={0.99} step={0.005} format={pct} onChange={setConfidence} /></>}>
    <Readouts values={isVar || isModel ? [["VaR", `${tail.var.toFixed(3)}m`, pct(confidence)], ["Expected Shortfall", `${tail.expectedShortfall.toFixed(3)}m`, pick(locale, c("average tail loss", "pérdida media de cola"))], [pick(locale, c("Control status", "Estado del control")), isModel && tail.expectedShortfall > 1.2 ? pick(locale, c("ESCALATE", "ESCALAR")) : pick(locale, c("MONITOR", "VIGILAR")), isModel ? pick(locale, c("threshold-linked action", "acción ligada a umbral")) : pick(locale, c("synthetic sample", "muestra sintética"))]] : [["EPE", `${epe.toFixed(3)}m`, pick(locale, c("time-average EE", "EE media temporal"))], ["CVA", `${cva.toFixed(4)}m`, "LGD 60% · PD 3.5%"], [pick(locale, c("Peak PFE", "PFE máximo")), `${Math.max(...profile.map((point) => point.pfe)).toFixed(3)}m`, pct(confidence)]]} />
    <div className="advanced-chart"><LineChart x={x} series={series} xLabel={isVar || isModel ? pick(locale, c("scenario index", "índice de escenario")) : pick(locale, c("future year", "año futuro"))} yLabel={isVar || isModel ? pick(locale, c("loss (mm)", "pérdida (mm)")) : pick(locale, c("exposure (mm)", "exposición (mm)"))} description={isVar || isModel ? pick(locale, c("Synthetic scenario losses with the selected historical VaR threshold.", "Pérdidas de escenario sintéticas con el umbral VaR histórico seleccionado.")) : pick(locale, c("Expected and potential future exposure, before and after collateral.", "Exposición futura esperada y potencial, antes y después del colateral."))} xFormatter={isVar || isModel ? (value) => value.toFixed(0) : formatYear} yFormatter={(value) => `${value.toFixed(3)}m`} showTable={!isVar && !isModel} height={330} /></div>
    <QuantFlow eyebrow={pick(locale, c("RISK AGGREGATION", "AGREGACIÓN DE RIESGO"))} title={pick(locale, c("Scenario → distribution → decision", "Escenario → distribución → decisión"))} thesis={pick(locale, c("Legal terms and model state enter before the summary metric and its governance action.", "Términos legales y estado del modelo entran antes de la métrica resumen y su acción de gobernanza."))} nodes={[{ id: "risk-state", label: pick(locale, c("State", "Estado")), value: `${pct(vol)} vol`, detail: pick(locale, c("Synthetic market scenarios", "Escenarios sintéticos")), kind: "market" }, { id: "risk-net", label: pick(locale, c("Netting / CSA", "Netting / CSA")), value: `${threshold.toFixed(2)}m`, detail: pick(locale, c("Unsecured exposure boundary", "Frontera de exposición no garantizada")), kind: "model" }, { id: "risk-output", label: isVar ? "ES" : id === "xva-adjustments" ? "CVA" : "PFE", value: isVar ? `${tail.expectedShortfall.toFixed(2)}m` : id === "xva-adjustments" ? `${cva.toFixed(3)}m` : `${Math.max(...profile.map((point) => point.pfe)).toFixed(2)}m`, detail: pick(locale, c("Decision metric with explicit convention", "Métrica de decisión con convención explícita")), kind: "risk" }]} />
  </LabShell>;
}

const filtrationLabs = new Set<AcademyLabId>(["filtration-explorer", "conditional-expectation"]);
const measureLabs = new Set<AcademyLabId>(["measure-change", "girsanov", "forward-measures"]);
const numericalLabs = new Set<AcademyLabId>(["monte-carlo", "simulation-schemes", "variance-reduction", "fourier-cos"]);
const greekLabs = new Set<AcademyLabId>(["first-order-greeks", "higher-order-greeks", "hedging-pnl"]);

export function AdvancedConceptLab({ lesson }: { lesson: AcademyLesson }) {
  const id = lesson.interactiveLabs[0].id;
  if (filtrationLabs.has(id)) return <FiltrationLab lesson={lesson} />;
  if (measureLabs.has(id)) return <MeasureLab lesson={lesson} />;
  if (numericalLabs.has(id)) return <NumericalLab lesson={lesson} />;
  if (greekLabs.has(id)) return <GreeksLab lesson={lesson} />;
  return <RiskLab lesson={lesson} />;
}
