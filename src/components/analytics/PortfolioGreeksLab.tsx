"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext does not provide next/link to Node SSR tests. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n, pick } from "@/src/i18n";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";
import { LineChart } from "@/src/components/charts/LineChart";
import {
  applyHedgeProposal,
  proposeDeltaHedge,
  proposeOptionHedge,
  type HedgeProposal,
} from "@/src/quant/portfolio/hedging";
import {
  buildSpotVolPnlGrid,
  buildTimeDecayProfile,
  explainPortfolioPnl,
  type PortfolioScenario,
} from "@/src/quant/portfolio/scenarios";
import type {
  OptionPosition,
  PortfolioMarketState,
  PortfolioPosition,
} from "@/src/quant/portfolio/types";
import { valuePortfolio } from "@/src/quant/portfolio/valuation";
import {
  parseStrategyTransfer,
  STRATEGY_TRANSFER_KEY,
} from "@/src/quant/strategies/transfer";
import { MarketStateControls } from "./MarketStateControls";
import { PnlHeatmap } from "./PnlHeatmap";
import { PositionEditor, type PositionPatch } from "./PositionEditor";
import { RiskVector } from "./RiskVector";

type HedgeTarget = "delta" | "gamma" | "vega";

const INITIAL_MARKET: PortfolioMarketState = {
  spot: 100,
  volatility: 0.22,
  rate: 0.03,
  dividend: 0.01,
  valuationTime: 0,
};

const INITIAL_POSITIONS: PortfolioPosition[] = [
  { id: "long-call", instrument: "option", optionType: "call", direction: "long", quantity: 2, multiplier: 100, strike: 105, maturity: 1, premium: 7.4 },
  { id: "short-put", instrument: "option", optionType: "put", direction: "short", quantity: 1, multiplier: 100, strike: 92, maturity: 1, premium: 4.2 },
  { id: "stock", instrument: "underlying", direction: "long", quantity: 40, multiplier: 1, entryPrice: 98 },
];

const DEFAULT_HEDGE_OPTION: OptionPosition = {
  id: "hedge-candidate",
  instrument: "option",
  optionType: "call",
  direction: "long",
  quantity: 1,
  multiplier: 100,
  strike: 100,
  maturity: 1,
  premium: 8,
};

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function safeMarket(next: PortfolioMarketState, current: PortfolioMarketState): PortfolioMarketState {
  return {
    spot: Math.max(0.01, finite(next.spot, current.spot)),
    volatility: Math.max(0, finite(next.volatility, current.volatility)),
    rate: finite(next.rate, current.rate),
    dividend: finite(next.dividend, current.dividend),
    valuationTime: Math.max(0, finite(next.valuationTime, current.valuationTime)),
  };
}

function updatePosition(position: PortfolioPosition, patch: PositionPatch): PortfolioPosition {
  const next = { ...position, ...patch } as PortfolioPosition;
  next.quantity = Math.max(0, finite(next.quantity, position.quantity));
  next.multiplier = Math.max(0.01, finite(next.multiplier, position.multiplier));
  if (next.instrument === "option") {
    next.strike = Math.max(0.01, finite(next.strike, position.instrument === "option" ? position.strike : 100));
    next.maturity = Math.max(0, finite(next.maturity, position.instrument === "option" ? position.maturity : 1));
    next.premium = Math.max(0, finite(next.premium, position.instrument === "option" ? position.premium : 0));
  } else {
    next.entryPrice = Math.max(0, finite(next.entryPrice, position.instrument === "underlying" ? position.entryPrice : 0));
  }
  return next;
}

function formatTicket(ticket: PortfolioPosition): string {
  const sign = ticket.direction === "long" ? "+" : "−";
  if (ticket.instrument === "underlying") return `${sign}${ticket.quantity.toFixed(3)} underlying`;
  return `${sign}${ticket.quantity.toFixed(3)} × ${ticket.optionType.toUpperCase()} K ${ticket.strike.toFixed(2)} · T ${ticket.maturity.toFixed(2)}`;
}

export function PortfolioGreeksLab() {
  const { locale, formatNumber } = useI18n();
  const { setPageContext } = useQuantBateman();
  const [market, setMarket] = useState(INITIAL_MARKET);
  const [positions, setPositions] = useState<PortfolioPosition[]>(INITIAL_POSITIONS);
  const [selectedId, setSelectedId] = useState(INITIAL_POSITIONS[0].id);
  const [hedgeTarget, setHedgeTarget] = useState<HedgeTarget>("delta");
  const [scenario, setScenario] = useState<PortfolioScenario>({ spotMove: -5, volatilityMove: 0.03, elapsedDays: 7, rateMove: 0.0025 });
  const [selectedCell, setSelectedCell] = useState({ row: 2, column: 2 });
  const [transferError, setTransferError] = useState(false);
  const idCounter = useRef(0);

  useEffect(() => {
    setPageContext({ section: "portfolio analytics", instrument: "European options", action: "risk and hedging" });
    try {
      localStorage.setItem("tqb-lab-context", JSON.stringify({ section: "portfolio", model: "Black-Scholes", outputs: ["Greeks", "scenario P&L", "hedges"] }));
      if (new URLSearchParams(window.location.search).get("from") !== "strategy") return;
      const serialized = localStorage.getItem(STRATEGY_TRANSFER_KEY);
      if (!serialized) return;
      const payload = parseStrategyTransfer(serialized);
      if (!payload) {
        window.setTimeout(() => setTransferError(true), 0);
        return;
      }
      localStorage.removeItem(STRATEGY_TRANSFER_KEY);
      window.setTimeout(() => {
        setMarket(payload.market);
        setPositions(payload.positions);
        setSelectedId(payload.positions[0].id);
      }, 0);
    } catch {
      window.setTimeout(() => setTransferError(true), 0);
    }
  }, [setPageContext]);

  const valuation = useMemo(() => valuePortfolio(positions, market), [positions, market]);
  const pnl = useMemo(() => explainPortfolioPnl(positions, market, scenario), [positions, market, scenario]);
  const spots = useMemo(() => [-0.15, -0.075, 0, 0.075, 0.15].map((move) => market.spot * (1 + move)), [market.spot]);
  const volatilities = useMemo(() => [-0.08, -0.04, 0, 0.04, 0.08].map((move) => Math.max(0, market.volatility + move)), [market.volatility]);
  const pnlGrid = useMemo(() => buildSpotVolPnlGrid(positions, market, spots, volatilities), [positions, market, spots, volatilities]);
  const elapsedDays = useMemo(() => [0, 7, 14, 30, 60, 90], []);
  const decay = useMemo(() => buildTimeDecayProfile(positions, market, elapsedDays), [positions, market, elapsedDays]);
  const selectedOption = positions.find((position): position is OptionPosition => position.id === selectedId && position.instrument === "option") ?? positions.find((position): position is OptionPosition => position.instrument === "option") ?? DEFAULT_HEDGE_OPTION;
  const proposal = useMemo<HedgeProposal>(() => hedgeTarget === "delta" ? proposeDeltaHedge(positions, market) : proposeOptionHedge(positions, market, { ...selectedOption, id: "hedge-candidate", direction: "long", quantity: 1 }, hedgeTarget), [hedgeTarget, market, positions, selectedOption]);

  const addPosition = (instrument: "call" | "put" | "underlying") => {
    idCounter.current += 1;
    const id = `${instrument}-${idCounter.current}`;
    const next: PortfolioPosition = instrument === "underlying"
      ? { id, instrument: "underlying", direction: "long", quantity: 10, multiplier: 1, entryPrice: market.spot }
      : { id, instrument: "option", optionType: instrument, direction: "long", quantity: 1, multiplier: 100, strike: market.spot, maturity: market.valuationTime + 1, premium: 5 };
    setPositions((current) => [...current, next]);
    setSelectedId(id);
  };

  const updateScenario = (key: keyof PortfolioScenario, value: number) => {
    const fallback = scenario[key];
    let next = finite(value, fallback);
    if (key === "elapsedDays") next = Math.max(0, next);
    if (key === "spotMove") next = Math.max(-market.spot + 0.01, next);
    if (key === "volatilityMove") next = Math.max(-market.volatility, next);
    setScenario((current) => ({ ...current, [key]: next }));
  };

  const money = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const copy = <T,>(values: { en: T; es: T }): T => pick(locale, values);
  const buckets = ["delta", "gamma", "vega", "theta", "rho", "residual"] as const;

  return <main className="portfolio-lab">
    <header className="portfolio-lab-hero section-shell">
      <div><span className="eyebrow">ANALYTICS · ONE LINKED STATE</span><h1>PORTFOLIO, GREEKS<br /><em>&amp; HEDGING.</em></h1></div>
      <div className="portfolio-lab-intro"><p>{copy({ en: "Build a European-option book, reprice it under joint shocks, separate exact P&L from its local Greek approximation and preview hedge tickets before applying them.", es: "Construye una cartera de opciones europeas, revalórala bajo shocks conjuntos, separa el P&L exacto de su aproximación local por griegas y previsualiza las coberturas antes de aplicarlas." })}</p><span>SYNTHETIC / EDUCATIONAL · BLACK–SCHOLES</span></div>
    </header>

    <div className="portfolio-lab-body section-shell">
      {transferError && <p className="analytics-inline-warning" role="status">{copy({ en: "The transferred strategy was invalid, so the default portfolio was preserved.", es: "La estrategia transferida no era válida; se mantuvo la cartera predeterminada." })}</p>}
      <section className="portfolio-panel portfolio-positions" aria-labelledby="portfolio-positions-title">
        <header><div><span>01 · {copy({ en: "BOOK", es: "CARTERA" })}</span><h2 id="portfolio-positions-title">{copy({ en: "Portfolio positions", es: "Posiciones de la cartera" })}</h2></div><div className="portfolio-actions"><button type="button" onClick={() => addPosition("call")}>+ Call</button><button type="button" onClick={() => addPosition("put")}>+ Put</button><button type="button" onClick={() => addPosition("underlying")}>+ {copy({ en: "Underlying", es: "Subyacente" })}</button><button type="button" onClick={() => { setPositions(INITIAL_POSITIONS); setMarket(INITIAL_MARKET); setSelectedId(INITIAL_POSITIONS[0].id); }}>{copy({ en: "Reset", es: "Restablecer" })}</button></div></header>
        <PositionEditor positions={positions} selectedId={selectedId} onSelect={setSelectedId} onChange={(id, patch) => setPositions((current) => current.map((position) => position.id === id ? updatePosition(position, patch) : position))} onRemove={(id) => setPositions((current) => current.length > 1 ? current.filter((position) => position.id !== id) : current)} />
      </section>

      <MarketStateControls value={market} onChange={(next) => setMarket((current) => safeMarket(next, current))} showValuationTime />

      <section className="portfolio-summary" aria-label={copy({ en: "Portfolio valuation", es: "Valoración de cartera" })}>
        <article><span>{copy({ en: "Model value", es: "Valor de modelo" })}</span><strong>{money(valuation.modelValue)}</strong></article>
        <article><span>{copy({ en: "Entry value", es: "Valor de entrada" })}</span><strong>{money(valuation.entryValue)}</strong></article>
        <article><span>{copy({ en: "Unrealized P&L", es: "P&L no realizado" })}</span><strong className={valuation.unrealizedPnl >= 0 ? "positive" : "negative"}>{money(valuation.unrealizedPnl)}</strong></article>
      </section>

      <RiskVector label={copy({ en: "Aggregate risk", es: "Riesgo agregado" })} greeks={valuation.greeks} />

      <section className="portfolio-panel portfolio-hedge" aria-labelledby="portfolio-hedge-title">
        <header><div><span>02 · {copy({ en: "HEDGE", es: "COBERTURA" })}</span><h2 id="portfolio-hedge-title">{copy({ en: "Hedge preview", es: "Previsualización de cobertura" })}</h2></div><label><span>{copy({ en: "Hedge target", es: "Objetivo de cobertura" })}</span><select aria-label="Hedge target" value={hedgeTarget} onChange={(event) => setHedgeTarget(event.currentTarget.value as HedgeTarget)}><option value="delta">Delta</option><option value="gamma">Gamma + Delta</option><option value="vega">Vega + Delta</option></select></label></header>
        {proposal.status === "ok" ? <><RiskVector label={copy({ en: "Risk after proposed hedge", es: "Riesgo tras la cobertura propuesta" })} greeks={proposal.after.greeks} comparison={proposal.before.greeks} /><div className="hedge-ticket"><div><span>{copy({ en: "Proposed tickets", es: "Operaciones propuestas" })}</span>{proposal.tickets.map((ticket) => <code key={ticket.id}>{formatTicket(ticket)}</code>)}</div><button type="button" onClick={() => { setPositions(applyHedgeProposal(proposal)); setSelectedId(proposal.tickets[0].id); }}>{copy({ en: "Apply hedge", es: "Aplicar cobertura" })}</button></div></> : <p className="analytics-inline-warning" role="status">{copy({ en: `Hedge unavailable: ${proposal.reason}. Select an option with material sensitivity.`, es: `Cobertura no disponible: ${proposal.reason}. Selecciona una opción con sensibilidad material.` })}</p>}
      </section>

      <section className="portfolio-panel portfolio-scenario" aria-labelledby="portfolio-scenario-title">
        <header><div><span>03 · {copy({ en: "SCENARIO", es: "ESCENARIO" })}</span><h2 id="portfolio-scenario-title">{copy({ en: "Actual repricing vs Taylor approximation", es: "Revaloración exacta frente a aproximación de Taylor" })}</h2></div></header>
        <div className="scenario-controls">{[
          ["spotMove", copy({ en: "Spot move", es: "Movimiento de spot" }), 0.5],
          ["volatilityMove", copy({ en: "Volatility move", es: "Movimiento de volatilidad" }), 0.01],
          ["elapsedDays", copy({ en: "Elapsed days", es: "Días transcurridos" }), 1],
          ["rateMove", copy({ en: "Rate move", es: "Movimiento de tipos" }), 0.001],
        ].map(([key, label, step]) => <label key={String(key)}><span>{String(label)}</span><input type="number" value={scenario[key as keyof PortfolioScenario]} step={Number(step)} onChange={(event) => updateScenario(key as keyof PortfolioScenario, Number(event.currentTarget.value))} /></label>)}</div>
        <div className="pnl-explain"><article><span>{copy({ en: "Actual repricing", es: "Revaloración exacta" })}</span><strong>{money(pnl.actual)}</strong></article><article><span>{copy({ en: "Taylor approximation", es: "Aproximación de Taylor" })}</span><strong>{money(pnl.approximate)}</strong></article>{buckets.map((key) => <article key={key}><span>{key}</span><strong>{money(pnl[key])}</strong></article>)}</div>
      </section>

      <section className="portfolio-panel portfolio-heatmap" aria-labelledby="portfolio-heatmap-title"><header><div><span>04 · {copy({ en: "NONLINEARITY", es: "NO LINEALIDAD" })}</span><h2 id="portfolio-heatmap-title">{copy({ en: "Spot × volatility P&L", es: "P&L spot × volatilidad" })}</h2></div><p>{copy({ en: "Every cell is a full portfolio revaluation relative to the current base state.", es: "Cada celda es una revaloración completa de la cartera respecto al estado base actual." })}</p></header><PnlHeatmap grid={pnlGrid} selected={selectedCell} onSelect={setSelectedCell} /></section>

      <section className="portfolio-panel portfolio-decay" aria-labelledby="portfolio-decay-title"><header><div><span>05 · THETA</span><h2 id="portfolio-decay-title">{copy({ en: "Time decay", es: "Decaimiento temporal" })}</h2></div><p>{copy({ en: "Full repricing along calendar time with spot, volatility and rates held constant.", es: "Revaloración completa al avanzar el calendario, manteniendo constantes spot, volatilidad y tipos." })}</p></header><LineChart x={decay.map((point) => point.elapsedDays)} series={[{ name: "Model value", values: decay.map((point) => point.modelValue) }, { name: "P&L", values: decay.map((point) => point.pnl) }]} xLabel={copy({ en: "Elapsed days", es: "Días transcurridos" })} yLabel={copy({ en: "Portfolio value / P&L", es: "Valor de cartera / P&L" })} xFormatter={(value) => `${value.toFixed(0)}d`} yFormatter={money} description={copy({ en: "Portfolio model value and P&L under pure calendar decay.", es: "Valor de modelo y P&L de la cartera bajo puro paso del calendario." })} showTable /></section>

      <footer className="portfolio-method"><div><span>{copy({ en: "MODEL BOUNDARY", es: "LÍMITE DEL MODELO" })}</span><p>{copy({ en: "European options, Black–Scholes valuation, constant rates/dividend yield/volatility per scenario, no transaction costs, liquidity, early exercise or volatility-surface dynamics. Greeks are local sensitivities; scenario P&L is the full repricing authority.", es: "Opciones europeas, valoración Black–Scholes, tipos/dividendos/volatilidad constantes por escenario, sin costes de transacción, liquidez, ejercicio anticipado ni dinámica de superficie. Las griegas son sensibilidades locales; el P&L de escenario por revaloración completa es la autoridad." })}</p></div><nav aria-label={copy({ en: "Related Academy lessons", es: "Lecciones relacionadas de la Academia" })}><a href="/learn/greeks-hedging/delta-gamma-vega-hedging">{copy({ en: "Delta–Gamma–Vega hedging", es: "Cobertura Delta–Gamma–Vega" })} →</a><a href="/learn/greeks-hedging/pnl-attribution">{copy({ en: "P&L attribution", es: "Atribución de P&L" })} →</a></nav></footer>
    </div>
  </main>;
}
