"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext does not provide next/link to Node SSR tests. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n, pick } from "@/src/i18n";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";
import { LineChart } from "@/src/components/charts/LineChart";
import { MarketStateControls } from "./MarketStateControls";
import { PositionEditor, type PositionPatch } from "./PositionEditor";
import { RiskVector } from "./RiskVector";
import type { PortfolioMarketState, PortfolioPosition } from "@/src/quant/portfolio/types";
import { positionWeight, valuePortfolio } from "@/src/quant/portfolio/valuation";
import {
  analyzeTerminalStrategy,
  terminalLegPayoff,
  terminalLegProfit,
  type StrategyAnalysis,
  type StrategyBound,
} from "@/src/quant/strategies/payoff";
import {
  buildStrategyPreset,
  strategyPresets,
  type StrategyPresetId,
  type StrategyPurpose,
} from "@/src/quant/strategies/presets";
import {
  serializeStrategyTransfer,
  STRATEGY_TRANSFER_KEY,
  STRATEGY_TRANSFER_VERSION,
} from "@/src/quant/strategies/transfer";

type StrategyView = "profit" | "payoff" | "mtm";

const INITIAL_MARKET: PortfolioMarketState = { spot: 100, volatility: 0.22, rate: 0.03, dividend: 0.01, valuationTime: 0 };
const PURPOSES: StrategyPurpose[] = ["directional", "income", "protection", "vertical", "volatility", "bounded", "skew"];
const PURPOSE_LABELS: Record<StrategyPurpose, { en: string; es: string }> = {
  directional: { en: "Directional", es: "Direccional" }, income: { en: "Income", es: "Renta" }, protection: { en: "Protection", es: "Protección" }, vertical: { en: "Vertical spreads", es: "Spreads verticales" }, volatility: { en: "Volatility", es: "Volatilidad" }, bounded: { en: "Bounded", es: "Acotadas" }, skew: { en: "Skew", es: "Skew" },
};
const PRESET_LABELS: Record<StrategyPresetId, { en: string; es: string }> = {
  "long-call": { en: "Long call", es: "Call comprada" }, "short-call": { en: "Short call", es: "Call vendida" }, "long-put": { en: "Long put", es: "Put comprada" }, "short-put": { en: "Short put", es: "Put vendida" }, "synthetic-long": { en: "Synthetic long", es: "Largo sintético" }, "synthetic-short": { en: "Synthetic short", es: "Corto sintético" }, "covered-call": { en: "Covered call", es: "Call cubierta" }, "cash-secured-put": { en: "Cash-secured put", es: "Put garantizada con efectivo" }, "protective-put": { en: "Protective put", es: "Put protectora" }, collar: { en: "Collar", es: "Collar" }, "bull-call": { en: "Bull call spread", es: "Spread alcista con calls" }, "bear-put": { en: "Bear put spread", es: "Spread bajista con puts" }, "bear-call": { en: "Bear call spread", es: "Spread bajista con calls" }, "bull-put": { en: "Bull put spread", es: "Spread alcista con puts" }, "long-straddle": { en: "Long straddle", es: "Straddle comprado" }, "short-straddle": { en: "Short straddle", es: "Straddle vendido" }, "long-strangle": { en: "Long strangle", es: "Strangle comprado" }, "short-strangle": { en: "Short strangle", es: "Strangle vendido" }, "call-butterfly": { en: "Call butterfly", es: "Mariposa de calls" }, "iron-condor": { en: "Iron condor", es: "Cóndor de hierro" }, "long-risk-reversal": { en: "Long risk reversal", es: "Risk reversal largo" }, "short-risk-reversal": { en: "Short risk reversal", es: "Risk reversal corto" },
};

function safeMarket(next: PortfolioMarketState, current: PortfolioMarketState): PortfolioMarketState {
  const number = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
  return { spot: Math.max(0.01, number(next.spot, current.spot)), volatility: Math.max(0, number(next.volatility, current.volatility)), rate: number(next.rate, current.rate), dividend: number(next.dividend, current.dividend), valuationTime: Math.max(0, number(next.valuationTime, current.valuationTime)) };
}

function updatePosition(position: PortfolioPosition, patch: PositionPatch): PortfolioPosition {
  const next = { ...position, ...patch } as PortfolioPosition;
  const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
  next.quantity = Math.max(0, finite(next.quantity, position.quantity));
  next.multiplier = Math.max(0.01, finite(next.multiplier, position.multiplier));
  if (next.instrument === "option") {
    next.strike = Math.max(0.01, finite(next.strike, position.instrument === "option" ? position.strike : 100));
    next.maturity = Math.max(0, finite(next.maturity, position.instrument === "option" ? position.maturity : 1));
    next.premium = Math.max(0, finite(next.premium, position.instrument === "option" ? position.premium : 0));
  } else next.entryPrice = Math.max(0, finite(next.entryPrice, position.instrument === "underlying" ? position.entryPrice : 0));
  return next;
}

function strategyResult(positions: readonly PortfolioPosition[]): { analysis: StrategyAnalysis | null; error: string | null } {
  try { return { analysis: analyzeTerminalStrategy(positions), error: null }; }
  catch (error) { return { analysis: null, error: error instanceof Error ? error.message : "Invalid strategy." }; }
}

function boundLabel(bound: StrategyBound, money: (value: number) => string, unlimited: string): string {
  return bound.kind === "unlimited" ? unlimited : money(bound.value);
}

export function StrategyPayoffLab() {
  const { locale, formatNumber } = useI18n();
  const { setPageContext } = useQuantBateman();
  const [market, setMarket] = useState(INITIAL_MARKET);
  const [purpose, setPurpose] = useState<StrategyPurpose>("bounded");
  const [presetId, setPresetId] = useState<StrategyPresetId | null>("iron-condor");
  const [positions, setPositions] = useState<PortfolioPosition[]>(() => buildStrategyPreset("iron-condor", { spot: 100, expiry: 1, multiplier: 100 }));
  const [selectedId, setSelectedId] = useState("iron-condor-1");
  const [view, setView] = useState<StrategyView>("profit");
  const [settlementSpot, setSettlementSpot] = useState(100);
  const [expectedFloor, setExpectedFloor] = useState(90);
  const [expectedCeiling, setExpectedCeiling] = useState(110);
  const [volShock, setVolShock] = useState(0.05);
  const [elapsedDays, setElapsedDays] = useState(30);
  const [comparison, setComparison] = useState<PortfolioPosition[] | null>(null);
  const [comparisonArmed, setComparisonArmed] = useState(false);
  const idCounter = useRef(0);
  const copy = <T,>(values: { en: T; es: T }): T => pick(locale, values);
  const money = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    setPageContext({ section: "strategy analytics", instrument: "European options", action: "payoff and transfer" });
    try { localStorage.setItem("tqb-lab-context", JSON.stringify({ section: "strategy", preset: presetId, legs: positions.length, view })); } catch { /* Context persistence is optional. */ }
  }, [positions.length, presetId, setPageContext, view]);

  const result = useMemo(() => strategyResult(positions), [positions]);
  const valuation = useMemo(() => valuePortfolio(positions, market), [positions, market]);
  const shockedMarket = useMemo(() => ({ ...market, volatility: Math.max(0, market.volatility + volShock), valuationTime: market.valuationTime + Math.max(0, elapsedDays) / 365 }), [elapsedDays, market, volShock]);
  const shockedValuation = useMemo(() => valuePortfolio(positions, shockedMarket), [positions, shockedMarket]);
  const strikes = positions.flatMap((position) => position.instrument === "option" ? [position.strike] : []);
  const chartMax = Math.max(market.spot * 1.7, expectedCeiling * 1.2, ...strikes.map((strike) => strike * 1.35), ...(result.analysis?.breakevens.map((root) => root * 1.2) ?? []));
  const terminalSpots = useMemo(() => Array.from({ length: 81 }, (_, index) => chartMax * index / 80), [chartMax]);
  const aggregateValues = useMemo(() => terminalSpots.map((spot) => view === "mtm"
    ? valuePortfolio(positions, { ...market, spot: Math.max(0.01, spot) }).modelValue
    : positions.reduce((sum, position) => sum + (view === "payoff" ? terminalLegPayoff(position, spot) : terminalLegProfit(position, spot)), 0)), [market, positions, terminalSpots, view]);
  const comparisonValues = useMemo(() => comparison ? terminalSpots.map((spot) => comparison.reduce((sum, position) => sum + terminalLegProfit(position, spot), 0)) : null, [comparison, terminalSpots]);
  const settlementRows = positions.map((position) => ({ position, payoff: terminalLegPayoff(position, settlementSpot), entryCashflow: -positionWeight(position) * (position.instrument === "option" ? position.premium : position.entryPrice), profit: terminalLegProfit(position, settlementSpot) }));

  const selectPreset = (id: StrategyPresetId) => {
    const next = buildStrategyPreset(id, { spot: market.spot, expiry: market.valuationTime + 1, multiplier: 100 });
    setPresetId(id);
    setPurpose(strategyPresets.find((preset) => preset.id === id)?.purpose ?? "directional");
    setPositions(next);
    setSelectedId(next[0].id);
    setComparison(null);
    setComparisonArmed(false);
  };

  const changePosition = (id: string, patch: PositionPatch) => {
    if (comparisonArmed) { setComparison(positions.map((position) => ({ ...position }))); setComparisonArmed(false); }
    setPositions((current) => current.map((position) => position.id === id ? updatePosition(position, patch) : position));
    setPresetId(null);
  };

  const addLeg = (kind: "call" | "put" | "underlying") => {
    idCounter.current += 1;
    const id = `custom-${kind}-${idCounter.current}`;
    const next: PortfolioPosition = kind === "underlying"
      ? { id, instrument: "underlying", direction: "long", quantity: 100, multiplier: 1, entryPrice: market.spot }
      : { id, instrument: "option", optionType: kind, direction: "long", quantity: 1, multiplier: 100, strike: market.spot, maturity: market.valuationTime + 1, premium: 5 };
    setPositions((current) => [...current, next]); setSelectedId(id); setComparison(null);
  };

  const transfer = () => {
    try {
      sessionStorage.setItem(STRATEGY_TRANSFER_KEY, serializeStrategyTransfer({ version: STRATEGY_TRANSFER_VERSION, market, positions }));
      window.location.assign("/analytics/portfolio?from=strategy");
    } catch { /* Valid editor state is enforced; navigation remains unchanged on storage failure. */ }
  };

  const viewLabels: Record<StrategyView, string> = {
    profit: copy({ en: "EXPIRY PROFIT", es: "BENEFICIO AL VENCIMIENTO" }),
    payoff: copy({ en: "EXPIRY PAYOFF", es: "PAYOFF AL VENCIMIENTO" }),
    mtm: copy({ en: "MARK-TO-MARKET", es: "VALOR DE MERCADO" }),
  };
  const candidate = expectedCeiling < market.spot ? "bear-put" : expectedFloor > market.spot ? "bull-call" : expectedCeiling - expectedFloor < market.spot * 0.12 ? "iron-condor" : "long-strangle";
  const expectedSpots = [expectedFloor, (expectedFloor + expectedCeiling) / 2, expectedCeiling];

  return <main className="strategy-lab">
    <header className="strategy-lab-hero section-shell"><div><span className="eyebrow">ANALYTICS · EXACT TERMINAL ALGEBRA</span><h1>OPTIONS STRATEGY<br /><em>&amp; PAYOFF.</em></h1></div><div><p>{copy({ en: "Compose European-option legs, inspect exact terminal economics, then separate expiry geometry from today’s mark-to-market risk.", es: "Combina opciones europeas, inspecciona la economía exacta al vencimiento y separa la geometría terminal del riesgo de valor de mercado actual." })}</p><span>SYNTHETIC / EDUCATIONAL · SINGLE EXPIRY</span></div></header>
    <div className="strategy-lab-body section-shell">
      <section className="strategy-taxonomy" aria-label={copy({ en: "Strategy taxonomy", es: "Taxonomía de estrategias" })}>
        <header><div><span>01 · {copy({ en: "PURPOSE", es: "OBJETIVO" })}</span><h2>{copy({ en: "Start with economic intent", es: "Empieza por la intención económica" })}</h2></div><p>{copy({ en: "Presets seed the editable book; they are examples, not recommendations.", es: "Los presets inicializan la cartera editable; son ejemplos, no recomendaciones." })}</p></header>
        <div className="strategy-purpose-tabs">{PURPOSES.map((item) => <button type="button" key={item} aria-pressed={purpose === item} onClick={() => setPurpose(item)}>{PURPOSE_LABELS[item][locale]}</button>)}</div>
        <div className="strategy-preset-grid">{strategyPresets.filter((preset) => preset.purpose === purpose).map((preset) => <button type="button" key={preset.id} aria-pressed={presetId === preset.id} onClick={() => selectPreset(preset.id)}><strong>{PRESET_LABELS[preset.id][locale]}</strong><span>{preset.legCount} {preset.legCount === 1 ? copy({ en: "leg", es: "pata" }) : copy({ en: "legs", es: "patas" })}</span></button>)}</div>
      </section>

      <section className="portfolio-panel strategy-legs" aria-labelledby="strategy-legs-title"><header><div><span>02 · {copy({ en: "EDITABLE BOOK", es: "CARTERA EDITABLE" })}</span><h2 id="strategy-legs-title">{copy({ en: "Strategy legs", es: "Patas de la estrategia" })}</h2></div><div className="portfolio-actions"><button type="button" onClick={() => addLeg("call")}>+ Call</button><button type="button" onClick={() => addLeg("put")}>+ Put</button><button type="button" onClick={() => addLeg("underlying")}>+ {copy({ en: "Underlying", es: "Subyacente" })}</button><button type="button" aria-pressed={comparisonArmed} onClick={() => setComparisonArmed(true)}>{copy({ en: "Compare one leg", es: "Comparar una pata" })}</button>{comparison && <button type="button" onClick={() => setComparison(null)}>{copy({ en: "Clear comparison", es: "Borrar comparación" })}</button>}</div></header><PositionEditor positions={positions} selectedId={selectedId} onSelect={setSelectedId} onChange={changePosition} onRemove={(id) => setPositions((current) => current.length > 1 ? current.filter((position) => position.id !== id) : current)} />{comparisonArmed && <p className="strategy-status" role="status">{copy({ en: "Comparison armed: the next leg edit becomes the before/after snapshot.", es: "Comparación preparada: la siguiente edición de una pata creará la instantánea antes/después." })}</p>}{result.error && <p className="analytics-inline-warning" role="status">{result.error} {copy({ en: "Terminal analysis requires a single expiry; the editor remains available.", es: "El análisis terminal requiere un único vencimiento; el editor sigue disponible." })}</p>}</section>

      <MarketStateControls value={market} onChange={(next) => setMarket((current) => safeMarket(next, current))} showValuationTime />

      <section className="portfolio-panel strategy-chart" aria-labelledby="strategy-chart-title"><header><div><span>03 · {copy({ en: "PROFILE", es: "PERFIL" })}</span><h2 id="strategy-chart-title">{viewLabels[view]}</h2></div><div className="strategy-view-tabs" role="tablist" aria-label={copy({ en: "Strategy chart view", es: "Vista del gráfico de estrategia" })}>{(["profit", "payoff", "mtm"] as StrategyView[]).map((item) => <button type="button" role="tab" id={`strategy-tab-${item}`} aria-controls={`strategy-panel-${item}`} aria-selected={view === item} tabIndex={view === item ? 0 : -1} key={item} onClick={() => setView(item)}>{viewLabels[item]}</button>)}</div></header><div role="tabpanel" id={`strategy-panel-${view}`} aria-labelledby={`strategy-tab-${view}`}><LineChart x={terminalSpots} series={[{ name: viewLabels[view], values: aggregateValues }, ...(comparisonValues && view === "profit" ? [{ name: copy({ en: "Before edit", es: "Antes de editar" }), values: comparisonValues }] : [])]} xLabel={copy({ en: "Terminal spot", es: "Spot terminal" })} yLabel={viewLabels[view]} xFormatter={(value) => money(value)} yFormatter={money} description={copy({ en: "Aggregate strategy profile. Exact metrics below are computed from piecewise algebra, not chart sampling.", es: "Perfil agregado de estrategia. Las métricas exactas se calculan con álgebra por tramos, no mediante muestreo del gráfico." })} showTable /></div></section>

      <section className="strategy-metrics" aria-label={copy({ en: "Exact strategy metrics", es: "Métricas exactas de estrategia" })}>{result.analysis ? <><article><span>{result.analysis.netEntryCashflow >= 0 ? copy({ en: "Net credit", es: "Crédito neto" }) : copy({ en: "Net debit", es: "Débito neto" })}</span><strong>{money(Math.abs(result.analysis.netEntryCashflow))}</strong></article><article><span>{copy({ en: "Breakeven", es: "Punto de equilibrio" })}</span><strong>{result.analysis.breakevens.length ? result.analysis.breakevens.map(money).join(" · ") : "—"}</strong></article><article><span>{copy({ en: "Maximum gain", es: "Ganancia máxima" })}</span><strong>{boundLabel(result.analysis.maxGain, money, copy({ en: "Unlimited", es: "Ilimitada" }))}</strong></article><article><span>{copy({ en: "Maximum loss", es: "Pérdida máxima" })}</span><strong>{boundLabel(result.analysis.maxLoss, money, copy({ en: "Unlimited", es: "Ilimitada" }))}</strong></article></> : <p>{copy({ en: "Resolve the expiry validation to restore exact metrics.", es: "Resuelve la validación de vencimiento para recuperar las métricas exactas." })}</p>}</section>

      <section className="strategy-dual">
        <article className="portfolio-panel settlement-panel"><header><div><span>04 · {copy({ en: "SETTLEMENT", es: "LIQUIDACIÓN" })}</span><h2>{copy({ en: "Settlement by leg", es: "Liquidación por pata" })}</h2></div><label><span>{copy({ en: "Terminal spot", es: "Spot terminal" })}</span><input type="range" min="0" max={chartMax} step="1" value={settlementSpot} onChange={(event) => setSettlementSpot(Number(event.currentTarget.value))} /><output>{money(settlementSpot)}</output></label></header><div className="strategy-table-wrap"><table><thead><tr><th>{copy({ en: "Leg", es: "Pata" })}</th><th>{copy({ en: "Payoff", es: "Payoff" })}</th><th>{copy({ en: "Entry cash flow", es: "Flujo de entrada" })}</th><th>{copy({ en: "Profit", es: "Beneficio" })}</th></tr></thead><tbody>{settlementRows.map((row) => <tr key={row.position.id}><th>{row.position.id}</th><td>{money(row.payoff)}</td><td>{money(row.entryCashflow)}</td><td>{money(row.profit)}</td></tr>)}</tbody></table></div></article>
        <article className="portfolio-panel algebra-panel"><header><div><span>05 · {copy({ en: "ALGEBRA", es: "ÁLGEBRA" })}</span><h2>{copy({ en: "Piecewise payoff", es: "Payoff por tramos" })}</h2></div></header><div>{result.analysis?.intervals.map((interval) => { const active = settlementSpot >= interval.lower && (interval.upper === null || settlementSpot <= interval.upper); return <article key={`${interval.lower}-${interval.upper}`} data-active={active || undefined}><span>{interval.upper === null ? `S ≥ ${money(interval.lower)}` : `${money(interval.lower)} ≤ S ≤ ${money(interval.upper)}`}</span><code>{money(interval.slope)}S {interval.intercept >= 0 ? "+" : "−"} {money(Math.abs(interval.intercept))}</code><small>{interval.activeLegIds.length ? interval.activeLegIds.join(" · ") : copy({ en: "premium only", es: "solo prima" })}</small></article>; }) ?? <p>—</p>}</div></article>
      </section>

      <section className="strategy-dual"><article className="portfolio-panel strategy-greeks"><header><div><span>06 · {copy({ en: "MARK-TO-MARKET", es: "VALOR DE MERCADO" })}</span><h2>{copy({ en: "Scenario Greeks", es: "Griegas de escenario" })}</h2></div></header><RiskVector label={copy({ en: "Current aggregate risk", es: "Riesgo agregado actual" })} greeks={valuation.greeks} /><div className="strategy-shock-controls"><label><span>{copy({ en: "Volatility shock", es: "Shock de volatilidad" })}</span><input type="number" step="0.01" value={volShock} onChange={(event) => setVolShock(Number(event.currentTarget.value))} /></label><label><span>{copy({ en: "Elapsed days", es: "Días transcurridos" })}</span><input type="number" min="0" step="1" value={elapsedDays} onChange={(event) => setElapsedDays(Math.max(0, Number(event.currentTarget.value)))} /></label></div><RiskVector label={copy({ en: "Shocked aggregate risk", es: "Riesgo agregado bajo shock" })} greeks={shockedValuation.greeks} comparison={valuation.greeks} /></article>
        <article className="portfolio-panel expected-zone"><header><div><span>07 · {copy({ en: "EXPECTED ZONE", es: "ZONA ESPERADA" })}</span><h2>{copy({ en: "Translate a view, not a recommendation", es: "Traduce una visión, no una recomendación" })}</h2></div></header><div className="strategy-shock-controls"><label><span>{copy({ en: "Floor", es: "Suelo" })}</span><input type="number" min="0" value={expectedFloor} onChange={(event) => setExpectedFloor(Math.max(0, Number(event.currentTarget.value)))} /></label><label><span>{copy({ en: "Ceiling", es: "Techo" })}</span><input type="number" min="0" value={expectedCeiling} onChange={(event) => setExpectedCeiling(Math.max(expectedFloor, Number(event.currentTarget.value)))} /></label></div><p>{copy({ en: "A comparable preset for this presentation-only zone is", es: "Un preset comparable para esta zona, solo a efectos expositivos, es" })} <strong>{PRESET_LABELS[candidate][locale]}</strong>. {copy({ en: "Inspect premium, tail caps and Greeks before drawing any conclusion.", es: "Inspecciona prima, límites de cola y griegas antes de extraer conclusiones." })}</p><dl>{expectedSpots.map((spot) => <div key={spot}><dt>S {money(spot)}</dt><dd>{money(positions.reduce((sum, position) => sum + terminalLegProfit(position, spot), 0))}</dd></div>)}</dl></article></section>

      <footer className="strategy-transfer"><div><span>{copy({ en: "NEXT WORKFLOW", es: "SIGUIENTE FLUJO" })}</span><h2>{copy({ en: "Move from terminal geometry to live risk", es: "Pasa de la geometría terminal al riesgo actual" })}</h2><p>{copy({ en: "Transfer the validated leg book and market state into Portfolio Analytics for scenarios and hedge construction.", es: "Transfiere la cartera validada y el estado de mercado a Analítica de Carteras para construir escenarios y coberturas." })}</p></div><button type="button" onClick={transfer}>{copy({ en: "Open in Portfolio Lab", es: "Abrir en Laboratorio de Carteras" })} →</button><nav><a href="/learn/derivatives/black-scholes-replication-pricing">{copy({ en: "Black–Scholes replication", es: "Réplica Black–Scholes" })}</a><a href="/learn/risk/higher-order-greeks">{copy({ en: "Higher-order Greeks", es: "Griegas de orden superior" })}</a></nav></footer>
    </div>
  </main>;
}
