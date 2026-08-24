"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- vinext does not provide next/link to direct Node component tests. */

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { pick, useI18n } from "@/src/i18n";
import { marketMakingMissionFromScenario } from "@/src/analytics/guidance/adapters";
import { findAnalyticsScenario } from "@/src/analytics/guidance/scenarios";
import type { AnalyticsPrimitive, AnalyticsScenario } from "@/src/analytics/guidance/types";
import { AnalyticsGuide } from "@/src/components/analytics/AnalyticsGuide";
import { useAnalyticsGuidance } from "@/src/components/analytics/useAnalyticsGuidance";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";
import { createClientOptionTrade, valueMarketMakingBook } from "@/src/quant/market-making/book";
import { calculateMarketMakingDiagnostics } from "@/src/quant/market-making/diagnostics";
import {
  applyMarketMakingHedge,
  proposeMarketMakingDeltaHedge,
  proposeMarketMakingOptionHedge,
  type MarketMakingHedgeProposal,
} from "@/src/quant/market-making/hedging";
import { evaluateMarketMakingMission, type MarketMakingMissionId } from "@/src/quant/market-making/missions";
import { createMarketMakingSeed, MARKET_MAKING_REPLAY_EVENTS } from "@/src/quant/market-making/presets";
import {
  advanceMarketMakingReplay,
  executeMarketMakingReplayHedge,
  runMarketMakingDeltaBenchmark,
  startMarketMakingReplay,
  type MarketMakingReplayEvent,
} from "@/src/quant/market-making/replay";
import { createMarketMakingSnapshot, explainMarketMakingScenario } from "@/src/quant/market-making/scenarios";
import type {
  ClientSide,
  MarketMakingHedgeTarget,
  MarketMakingMarketState,
  MarketMakingShock,
  MarketMakingSnapshot,
  MarketMakingTrade,
} from "@/src/quant/market-making/types";
import { MarketMakingBlotter } from "./MarketMakingBlotter";
import { MarketMakingReplay } from "./MarketMakingReplay";
import { MarketMakingRisk } from "./MarketMakingRisk";

type MarketMakingStage = "market" | "flow" | "risk" | "hedge" | "scenario" | "replay";

const STAGE_IDS: MarketMakingStage[] = ["market", "flow", "risk", "hedge", "scenario", "replay"];
const MISSION_IDS: MarketMakingMissionId[] = [
  "client-flow",
  "delta-discipline",
  "short-vega-repair",
  "volatility-shock",
  "theta-passage",
  "rate-shock",
  "convexity",
  "cross-effects",
];

function cloneMarket(market: MarketMakingMarketState): MarketMakingMarketState {
  return {
    valuationTime: market.valuationTime,
    underlyings: market.underlyings.map((underlying) => ({ ...underlying, surface: { ...underlying.surface } })),
  };
}

function cloneTrades(trades: readonly MarketMakingTrade[]): MarketMakingTrade[] {
  return trades.map((trade) => ({ ...trade }));
}

function MMControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const bounded = (raw: number) => Number.isFinite(raw) ? Math.max(min, Math.min(max, raw)) : value;
  return <label className="mm-control"><span>{label}<output>{display}</output></span><div><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(bounded(Number(event.currentTarget.value)))} /><input aria-label={`${label} exact value`} type="number" min={min} max={max} step={step} value={Number(value.toFixed(6))} onChange={(event) => onChange(bounded(Number(event.currentTarget.value)))} /></div></label>;
}

function signedTicket(trade: MarketMakingTrade): string {
  const sign = trade.dealerDirection === "long" ? "+" : "−";
  if (trade.instrument === "underlying") return `${sign}${trade.quantity.toFixed(2)} ${trade.underlyingId.toUpperCase()}`;
  return `${sign}${trade.quantity.toFixed(2)} × ${trade.optionType.toUpperCase()} K ${trade.strike.toFixed(2)} · T ${trade.maturity.toFixed(2)}`;
}

export function MarketMakingLab() {
  const { locale, formatNumber } = useI18n();
  const { setPageContext } = useQuantBateman();
  const [seed] = useState(() => createMarketMakingSeed());
  const [activeStage, setActiveStage] = useState<MarketMakingStage>("market");
  const [market, setMarket] = useState(() => cloneMarket(seed.market));
  const [trades, setTrades] = useState(() => cloneTrades(seed.trades));
  const [selectedUnderlyingId, setSelectedUnderlyingId] = useState("retail");
  const [clientSide, setClientSide] = useState<ClientSide>("buy");
  const [clientOptionType, setClientOptionType] = useState<"call" | "put">("call");
  const [clientQuantity, setClientQuantity] = useState(10);
  const [clientStrike, setClientStrike] = useState(52);
  const [clientMaturity, setClientMaturity] = useState(0.5);
  const [clientHalfSpread, setClientHalfSpread] = useState(0.05);
  const [clientDirectionConfirmed, setClientDirectionConfirmed] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [hedgeTarget, setHedgeTarget] = useState<"delta" | MarketMakingHedgeTarget>("delta");
  const [hedgeStrike, setHedgeStrike] = useState(50);
  const [hedgeMaturity, setHedgeMaturity] = useState(1);
  const [hedgeLotSize, setHedgeLotSize] = useState(1);
  const [hedgeHalfSpread, setHedgeHalfSpread] = useState(0.05);
  const [stockCostBps, setStockCostBps] = useState(2);
  const [bookHistory, setBookHistory] = useState<MarketMakingTrade[][]>([]);
  const [snapshot, setSnapshot] = useState<MarketMakingSnapshot>(() => createMarketMakingSnapshot(seed.trades, seed.market));
  const [scenario, setScenario] = useState<MarketMakingShock>({
    spotMovePercent: 0.05,
    volatilityLevelMove: 0.03,
    skewMove: -0.015,
    rateMove: 0.01,
    elapsedDays: 10,
  });
  const [activeMission, setActiveMission] = useState<MarketMakingMissionId>("client-flow");
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [beforeMetrics, setBeforeMetrics] = useState<Record<string, AnalyticsPrimitive> | null>(null);
  const [replay, setReplay] = useState(() => startMarketMakingReplay(seed.trades, seed.market, 0.03));
  const idCounter = useRef(seed.trades.length);

  const copy = useCallback(<T,>(values: { en: T; es: T }): T => pick(locale, values), [locale]);
  const money = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const stages = [
    { id: "market" as const, label: copy({ en: "Morning market", es: "Mercado de apertura" }), short: copy({ en: "State", es: "Estado" }) },
    { id: "flow" as const, label: copy({ en: "Client flow", es: "Flujo de clientes" }), short: copy({ en: "Flow", es: "Flujo" }) },
    { id: "risk" as const, label: copy({ en: "Book risk", es: "Riesgo del libro" }), short: copy({ en: "Risk", es: "Riesgo" }) },
    { id: "hedge" as const, label: copy({ en: "Hedge decision", es: "Decisión de cobertura" }), short: copy({ en: "Hedge", es: "Cobertura" }) },
    { id: "scenario" as const, label: copy({ en: "Snapshot & shock", es: "Foto y escenario" }), short: copy({ en: "Shock", es: "Shock" }) },
    { id: "replay" as const, label: copy({ en: "Hedge replay", es: "Repetición de coberturas" }), short: copy({ en: "Replay", es: "Repetición" }) },
  ];
  const selectedUnderlying = market.underlyings.find((underlying) => underlying.id === selectedUnderlyingId) ?? market.underlyings[0];
  const valuation = useMemo(() => valueMarketMakingBook(trades, market), [trades, market]);
  const selectedRisk = valuation.byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId);
  const diagnostics = useMemo(
    () => calculateMarketMakingDiagnostics(trades, market, selectedUnderlyingId),
    [trades, market, selectedUnderlyingId],
  );

  const orderPreview = useMemo(() => {
    try {
      return createClientOptionTrade({
        id: "client-preview",
        underlyingId: selectedUnderlyingId,
        clientSide,
        optionType: clientOptionType,
        quantity: Math.max(clientQuantity, 0.0001),
        multiplier: 100,
        strike: clientStrike,
        maturity: Math.max(clientMaturity, market.valuationTime + 1 / 365),
        halfSpread: clientHalfSpread,
      }, market);
    } catch {
      return null;
    }
  }, [clientHalfSpread, clientMaturity, clientOptionType, clientQuantity, clientSide, clientStrike, market, selectedUnderlyingId]);

  const proposal = useMemo<MarketMakingHedgeProposal>(() => hedgeTarget === "delta"
    ? proposeMarketMakingDeltaHedge(trades, market, selectedUnderlyingId, stockCostBps)
    : proposeMarketMakingOptionHedge(trades, market, {
        underlyingId: selectedUnderlyingId,
        optionType: "call",
        strike: hedgeStrike,
        maturity: Math.max(hedgeMaturity, market.valuationTime + 1 / 365),
        multiplier: 100,
        lotSize: hedgeLotSize,
        halfSpread: hedgeHalfSpread,
      }, hedgeTarget, stockCostBps),
  [hedgeHalfSpread, hedgeLotSize, hedgeMaturity, hedgeStrike, hedgeTarget, market, selectedUnderlyingId, stockCostBps, trades]);

  const scenarioExplain = useMemo(
    () => explainMarketMakingScenario(snapshot, selectedUnderlyingId, scenario),
    [scenario, selectedUnderlyingId, snapshot],
  );
  const currentScenario = useMemo(
    () => explainMarketMakingScenario(createMarketMakingSnapshot(trades, market), selectedUnderlyingId, scenario),
    [market, scenario, selectedUnderlyingId, trades],
  );
  const baselineRisk = scenarioExplain.base.byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId);
  const hasHedge = trades.some((trade) => trade.source === "hedge");
  const mission = evaluateMarketMakingMission(activeMission, {
    dealerDirectionCorrect: clientDirectionConfirmed,
    delta: selectedRisk?.greeks.delta ?? 0,
    deltaTolerance: 1,
    baselineVega: baselineRisk?.greeks.vega ?? 0,
    currentVega: selectedRisk?.greeks.vega ?? 0,
    vegaTarget: 100,
    shock: scenario,
    comparedHedged: hasHedge,
    diagnostics,
  });
  const { askAboutThis, publish, updateContext } = useAnalyticsGuidance({ labId: "market-making", model: "European option inventory · exact repricing + local Greeks" });
  const guidanceInputs = useMemo<Record<string, AnalyticsPrimitive>>(() => ({
    underlying: selectedUnderlyingId,
    spot: selectedUnderlying.spot,
    atmVolatility: selectedUnderlying.surface.atmVolatility,
    workflowStage: activeStage,
    mission: activeMission,
    trades: trades.length,
    hedgeTarget,
    spotMove: scenario.spotMovePercent,
    volatilityMove: scenario.volatilityLevelMove,
    rateMove: scenario.rateMove,
    elapsedDays: scenario.elapsedDays,
  }), [activeMission, activeStage, hedgeTarget, scenario, selectedUnderlying, selectedUnderlyingId, trades.length]);
  const guidanceMetrics = useMemo<Record<string, AnalyticsPrimitive>>(() => ({
    modelValue: valuation.modelValue,
    unrealizedPnl: valuation.unrealizedPnl,
    spreadCapture: valuation.clientSpreadCapture,
    hedgeFriction: valuation.hedgeFriction,
    delta: selectedRisk?.greeks.delta ?? 0,
    gamma: selectedRisk?.greeks.gamma ?? 0,
    vega: selectedRisk?.greeks.vega ?? 0,
    exactScenarioPnl: currentScenario.actual,
    localScenarioPnl: currentScenario.approximate,
    attributionResidual: currentScenario.residual,
  }), [currentScenario, selectedRisk, valuation]);

  useEffect(() => {
    updateContext({ scenarioId: activeScenarioId ?? undefined, inputs: guidanceInputs, metrics: guidanceMetrics });
    setPageContext({ section: "market-making lab", instrument: "European options", action: activeStage });
  }, [activeScenarioId, activeStage, guidanceInputs, guidanceMetrics, setPageContext, updateContext]);

  const replayEvents = useMemo<MarketMakingReplayEvent[]>(() => MARKET_MAKING_REPLAY_EVENTS.map((event) => {
    const sourceShock = event.shocks.retail;
    const label = ({
      open: copy({ en: "Opening move", es: "Movimiento de apertura" }),
      "client-pressure": copy({ en: "Volatility bid", es: "Demanda de volatilidad" }),
      carry: copy({ en: "Five-day carry", es: "Carry de cinco días" }),
      macro: copy({ en: "Rates repricing", es: "Reprecio de tipos" }),
    } as Record<string, string>)[event.id] ?? event.label;
    return { ...event, label, shocks: { [selectedUnderlyingId]: { ...sourceShock } } };
  }), [copy, selectedUnderlyingId]);
  const benchmarkReplay = useMemo(
    () => runMarketMakingDeltaBenchmark(
      trades,
      market,
      0.03,
      replayEvents,
      selectedUnderlyingId,
      stockCostBps,
      1,
    ),
    [market, replayEvents, selectedUnderlyingId, stockCostBps, trades],
  );

  const missionLabels: Record<MarketMakingMissionId, string> = {
    "client-flow": copy({ en: "Read dealer direction", es: "Leer la dirección del dealer" }),
    "delta-discipline": copy({ en: "Control delta", es: "Controlar delta" }),
    "short-vega-repair": copy({ en: "Repair short vega", es: "Reparar vega corta" }),
    "volatility-shock": copy({ en: "Compare volatility shock", es: "Comparar shock de volatilidad" }),
    "theta-passage": copy({ en: "Advance ten days", es: "Avanzar diez días" }),
    "rate-shock": copy({ en: "Apply +100bp", es: "Aplicar +100 pb" }),
    convexity: copy({ en: "Read convexity", es: "Leer convexidad" }),
    "cross-effects": copy({ en: "Diagnose cross-effects", es: "Diagnosticar efectos cruzados" }),
  };
  const reasonCopy = ({
    "dealer-direction-confirmed": copy({ en: "Dealer direction is explicit: client buy becomes dealer short; client sell becomes dealer long.", es: "La dirección del dealer es explícita: compra cliente implica dealer corto; venta cliente implica dealer largo." }),
    "dealer-direction-unconfirmed": copy({ en: "Execute one client ticket and verify the resulting dealer side.", es: "Ejecuta un ticket de cliente y verifica el lado resultante del dealer." }),
    "delta-controlled": copy({ en: "Selected-underlying delta is inside the ±1 unit tolerance.", es: "La delta del subyacente seleccionado está dentro de la tolerancia de ±1 unidad." }),
    "delta-outside-tolerance": copy({ en: "Residual delta remains outside ±1. Preview the stock ticket before executing it.", es: "La delta residual sigue fuera de ±1. Previsualiza el ticket de acciones antes de ejecutarlo." }),
    "vega-and-delta-controlled": copy({ en: "Vega is inside the target and the rounded option hedge has been delta-repaired.", es: "La vega está dentro del objetivo y la cobertura redondeada se ha reajustado en delta." }),
    "vega-target-unmet": copy({ en: "Reduce absolute vega below 100 while keeping delta inside ±1.", es: "Reduce la vega absoluta por debajo de 100 manteniendo delta dentro de ±1." }),
    "hedged-volatility-comparison-complete": copy({ en: "The hedged and snapshot books now expose their exact volatility-shock P&L.", es: "Los libros cubierto y fotografiado muestran su P&L exacto bajo shock de volatilidad." }),
    "volatility-comparison-required": copy({ en: "Execute a hedge and keep a non-zero volatility shock to compare both books.", es: "Ejecuta una cobertura y mantén un shock de volatilidad distinto de cero para comparar ambos libros." }),
    "theta-passage-complete": copy({ en: "Ten or more calendar days are included in the full repricing.", es: "La revaloración completa incluye diez o más días naturales." }),
    "ten-day-passage-required": copy({ en: "Set elapsed time to at least ten days.", es: "Fija el tiempo transcurrido en al menos diez días." }),
    "rate-shock-complete": copy({ en: "The rate shock reaches 100bp and rho is expressed in the matching desk unit.", es: "El shock alcanza 100 pb y rho se expresa en la unidad de mesa correspondiente." }),
    "100bp-rate-shock-required": copy({ en: "Set an absolute rate move of at least 0.01.", es: "Fija un movimiento absoluto de tipos de al menos 0,01." }),
    "convexity-complete": copy({ en: "The spot jump is large enough to expose the gamma contribution and residual.", es: "El salto de spot es suficiente para mostrar la contribución gamma y el residual." }),
    "spot-jump-required": copy({ en: "Use at least a 2% spot move to inspect convexity.", es: "Usa un movimiento de spot de al menos 2% para inspeccionar convexidad." }),
    "cross-effects-complete": copy({ en: "Joint spot/volatility movement and finite cross-Greeks are visible together.", es: "El movimiento conjunto de spot/volatilidad y las griegas cruzadas finitas están visibles." }),
    "joint-shock-diagnostics-required": copy({ en: "Use non-zero spot and volatility moves, then inspect vanna and volga.", es: "Usa movimientos no nulos de spot y volatilidad y después inspecciona vanna y volga." }),
  } as Record<typeof mission.reason, string>)[mission.reason];

  const selectStage = (stage: MarketMakingStage, focus = false) => {
    setActiveStage(stage);
    if (focus) window.setTimeout(() => document.getElementById(`mm-tab-${stage}`)?.focus(), 0);
  };
  const onStageKeyDown = (event: KeyboardEvent<HTMLButtonElement>, stage: MarketMakingStage) => {
    const index = STAGE_IDS.indexOf(stage);
    const keyIndex = event.key === "Home" ? 0 : event.key === "End" ? STAGE_IDS.length - 1 : event.key === "ArrowRight" ? (index + 1) % STAGE_IDS.length : event.key === "ArrowLeft" ? (index - 1 + STAGE_IDS.length) % STAGE_IDS.length : -1;
    if (keyIndex < 0) return;
    event.preventDefault();
    selectStage(STAGE_IDS[keyIndex], true);
  };

  const resetReplay = (nextTrades = trades, nextMarket = market) => {
    setReplay(startMarketMakingReplay(nextTrades, nextMarket, 0.03));
  };
  const selectUnderlying = (underlyingId: string) => {
    const underlying = market.underlyings.find((candidate) => candidate.id === underlyingId);
    if (!underlying) return;
    setSelectedUnderlyingId(underlyingId);
    setClientStrike(underlying.spot);
    setHedgeStrike(underlying.spot);
    resetReplay(trades, market);
  };
  const addClientTrade = () => {
    try {
      idCounter.current += 1;
      const trade = createClientOptionTrade({
        id: `client-flow-${idCounter.current}`,
        underlyingId: selectedUnderlyingId,
        clientSide,
        optionType: clientOptionType,
        quantity: clientQuantity,
        multiplier: 100,
        strike: clientStrike,
        maturity: clientMaturity,
        halfSpread: clientHalfSpread,
      }, market);
      const next = [...trades, trade];
      setBookHistory((history) => [...history, cloneTrades(trades)]);
      setTrades(next);
      setClientDirectionConfirmed(true);
      setOrderError("");
      resetReplay(next, market);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : copy({ en: "Invalid client order.", es: "Orden de cliente no válida." }));
    }
  };
  const applyHedge = () => {
    if (proposal.status !== "ok") return;
    const next = applyMarketMakingHedge(proposal);
    const nextRisk = valueMarketMakingBook(next, market).byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId);
    setBookHistory((history) => [...history, cloneTrades(trades)]);
    setTrades(next);
    resetReplay(next, market);
    publish({
      kind: "hedge-applied",
      scenarioId: activeScenarioId ?? undefined,
      inputs: guidanceInputs,
      metrics: {
        beforeDelta: selectedRisk?.greeks.delta ?? 0,
        afterDelta: nextRisk?.greeks.delta ?? 0,
        beforeVega: selectedRisk?.greeks.vega ?? 0,
        afterVega: nextRisk?.greeks.vega ?? 0,
        hedgeFriction: proposal.estimatedHedgeFriction,
      },
    });
  };
  const undoLast = () => {
    const previous = bookHistory.at(-1);
    if (!previous) return;
    setTrades(cloneTrades(previous));
    setBookHistory((history) => history.slice(0, -1));
    resetReplay(previous, market);
  };
  const updateUnderlying = (field: "spot" | "rate" | "dividend" | "atmVolatility" | "skew" | "curvature" | "termSlope", value: number) => {
    const next = cloneMarket(market);
    const underlying = next.underlyings.find((candidate) => candidate.id === selectedUnderlyingId)!;
    if (field === "spot" || field === "rate" || field === "dividend") underlying[field] = value;
    else underlying.surface[field] = value;
    setMarket(next);
    resetReplay(trades, next);
  };

  const scenarioRows = [
    ["delta", scenarioExplain.delta],
    ["gamma", scenarioExplain.gamma],
    ["vega", scenarioExplain.vega],
    ["theta", scenarioExplain.theta],
    ["rho", scenarioExplain.rho],
    [copy({ en: "residual", es: "residual" }), scenarioExplain.residual],
  ] as const;

  const applyGuidedScenario = (guidedScenario: AnalyticsScenario) => {
    const nextMission = marketMakingMissionFromScenario(guidedScenario);
    setBeforeMetrics(guidanceMetrics);
    setActiveScenarioId(guidedScenario.id);
    setActiveMission(nextMission);
    if (nextMission === "client-flow") {
      setActiveStage("flow");
      setClientDirectionConfirmed(false);
    } else if (nextMission === "delta-discipline") {
      setActiveStage("hedge");
      setHedgeTarget("delta");
    } else {
      setActiveStage("scenario");
      setScenario((current) => ({
        ...current,
        spotMovePercent: Math.abs(current.spotMovePercent) < 0.02 ? 0.05 : current.spotMovePercent,
        volatilityLevelMove: Math.abs(current.volatilityLevelMove) < 0.01 ? 0.03 : current.volatilityLevelMove,
      }));
    }
    publish({ kind: "scenario-loaded", scenarioId: guidedScenario.id, inputs: guidanceInputs, metrics: guidanceMetrics });
  };
  const resetGuidedScenario = () => {
    const selected = activeScenarioId ? findAnalyticsScenario(activeScenarioId) : undefined;
    if (selected) applyGuidedScenario(selected);
  };

  return <div className="market-making-lab">
    <header className="mm-header">
      <div><h2>{copy({ en: "MARKET-MAKING DESK", es: "Mesa de market making" })}</h2><p>{copy({ en: "Take client flow, inherit dealer risk, choose a hedge and reconcile what actually happened.", es: "Recibe flujo de clientes, asume riesgo de dealer, elige una cobertura y concilia lo que ocurrió realmente." })}</p></div>
      <div className="mm-provenance"><strong>{copy({ en: "SYNTHETIC / EDUCATIONAL", es: "Datos sintéticos / educativos" })}</strong><span>Black–Scholes · ACT/365-like · {copy({ en: "continuous rates", es: "tipos continuos" })}</span></div>
    </header>

    <AnalyticsGuide
      labId="market-making"
      activeScenarioId={activeScenarioId}
      snapshots={beforeMetrics ? { before: beforeMetrics, after: guidanceMetrics } : null}
      onApply={applyGuidedScenario}
      onReset={resetGuidedScenario}
      onManual={() => { setActiveScenarioId(null); setBeforeMetrics(null); }}
      onAsk={askAboutThis}
    />

    <div className="mm-mission-bar">
      <label><span>{copy({ en: "Guided mission", es: "Misión guiada" })}</span><select value={activeMission} onChange={(event) => setActiveMission(event.currentTarget.value as MarketMakingMissionId)}>{MISSION_IDS.map((id) => <option value={id} key={id}>{missionLabels[id]}</option>)}</select></label>
      <div className={mission.complete ? "complete" : "incomplete"} role="status" aria-live="polite"><strong>{mission.complete ? copy({ en: "MISSION COMPLETE", es: "MISIÓN COMPLETA" }) : copy({ en: "NEXT DECISION", es: "SIGUIENTE DECISIÓN" })}</strong><p>{reasonCopy}</p></div>
    </div>

    <div className="mm-stage-tabs" role="tablist" aria-label={copy({ en: "Market-making workflow", es: "Flujo de market making" })}>
      {stages.map((stage, index) => <button type="button" role="tab" data-mm-stage={stage.id} id={`mm-tab-${stage.id}`} aria-controls={`mm-panel-${stage.id}`} aria-selected={activeStage === stage.id} tabIndex={activeStage === stage.id ? 0 : -1} className={activeStage === stage.id ? "active" : ""} onClick={() => selectStage(stage.id)} onKeyDown={(event) => onStageKeyDown(event, stage.id)} key={stage.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong><small>{stage.short}</small></button>)}
    </div>

    <div className="mm-stage-panels">
      <section role="tabpanel" id="mm-panel-market" aria-labelledby="mm-tab-market" hidden={activeStage !== "market"} className="mm-stage-panel mm-market-panel">
        <header className="mm-panel-heading"><div><h3>{copy({ en: "Morning market", es: "Mercado de apertura" })}</h3><p>{copy({ en: "Set the observable state before accepting flow. Surface parameters are educational controls, not calibrated quotes.", es: "Fija el estado observable antes de aceptar flujo. Los parámetros de superficie son controles educativos, no cotizaciones calibradas." })}</p></div><button type="button" onClick={() => { const fresh = createMarketMakingSeed(); setMarket(fresh.market); setTrades(fresh.trades); setSelectedUnderlyingId("retail"); setClientStrike(52); setHedgeStrike(50); setClientDirectionConfirmed(false); setOrderError(""); setBookHistory([]); idCounter.current = fresh.trades.length; setSnapshot(createMarketMakingSnapshot(fresh.trades, fresh.market)); resetReplay(fresh.trades, fresh.market); }}>{copy({ en: "Reset desk", es: "Restablecer mesa" })}</button></header>
        <div className="mm-market-layout"><aside className="mm-underlying-list"><span>{copy({ en: "Synthetic underlyings", es: "Subyacentes sintéticos" })}</span>{market.underlyings.map((underlying) => <button type="button" className={underlying.id === selectedUnderlyingId ? "active" : ""} onClick={() => selectUnderlying(underlying.id)} key={underlying.id}><strong>{underlying.label}</strong><span>{underlying.spot.toFixed(2)}</span><small>ATM {(underlying.surface.atmVolatility * 100).toFixed(1)}%</small></button>)}</aside><div className="mm-market-controls"><MMControl label={copy({ en: "Spot", es: "Spot" })} value={selectedUnderlying.spot} min={Math.max(0.5, selectedUnderlying.spot * 0.5)} max={selectedUnderlying.spot * 1.5} step={selectedUnderlying.spot < 20 ? 0.01 : 0.1} display={selectedUnderlying.spot.toFixed(2)} onChange={(value) => updateUnderlying("spot", value)} /><MMControl label={copy({ en: "Rate", es: "Tipo" })} value={selectedUnderlying.rate} min={-0.02} max={0.12} step={0.001} display={`${(selectedUnderlying.rate * 100).toFixed(2)}%`} onChange={(value) => updateUnderlying("rate", value)} /><MMControl label={copy({ en: "Dividend yield", es: "Rentabilidad por dividendo" })} value={selectedUnderlying.dividend} min={-0.02} max={0.12} step={0.001} display={`${(selectedUnderlying.dividend * 100).toFixed(2)}%`} onChange={(value) => updateUnderlying("dividend", value)} /><MMControl label={copy({ en: "ATM volatility", es: "Volatilidad ATM" })} value={selectedUnderlying.surface.atmVolatility} min={0.05} max={0.8} step={0.005} display={`${(selectedUnderlying.surface.atmVolatility * 100).toFixed(1)}%`} onChange={(value) => updateUnderlying("atmVolatility", value)} /><MMControl label={copy({ en: "Skew", es: "Skew" })} value={selectedUnderlying.surface.skew} min={-0.5} max={0.25} step={0.005} display={selectedUnderlying.surface.skew.toFixed(3)} onChange={(value) => updateUnderlying("skew", value)} /><MMControl label={copy({ en: "Curvature", es: "Curvatura" })} value={selectedUnderlying.surface.curvature} min={0} max={0.8} step={0.01} display={selectedUnderlying.surface.curvature.toFixed(2)} onChange={(value) => updateUnderlying("curvature", value)} /><MMControl label={copy({ en: "Term slope", es: "Pendiente temporal" })} value={selectedUnderlying.surface.termSlope} min={-0.15} max={0.15} step={0.005} display={selectedUnderlying.surface.termSlope.toFixed(3)} onChange={(value) => updateUnderlying("termSlope", value)} /></div></div>
      </section>

      <section role="tabpanel" id="mm-panel-flow" aria-labelledby="mm-tab-flow" hidden={activeStage !== "flow"} className="mm-stage-panel mm-flow-panel">
        <header className="mm-panel-heading"><div><h3>{copy({ en: "Client flow", es: "Flujo de clientes" })}</h3><p>{copy({ en: "The client chooses buy or sell. The book records the opposite dealer exposure once—never through a negative quantity.", es: "El cliente elige compra o venta. El libro registra una sola vez la exposición opuesta del dealer, nunca mediante cantidad negativa." })}</p></div></header>
        <div className="mm-flow-layout"><form className="mm-client-ticket" onSubmit={(event) => { event.preventDefault(); addClientTrade(); }}><h4>{copy({ en: "Client option ticket", es: "Ticket de opción del cliente" })}</h4><label><span>{copy({ en: "Underlying", es: "Subyacente" })}</span><select value={selectedUnderlyingId} onChange={(event) => selectUnderlying(event.currentTarget.value)}>{market.underlyings.map((underlying) => <option value={underlying.id} key={underlying.id}>{underlying.label}</option>)}</select></label><div className="mm-segmented" role="group" aria-label={copy({ en: "Client side", es: "Lado cliente" })}><button type="button" className={clientSide === "buy" ? "active" : ""} onClick={() => setClientSide("buy")}>{copy({ en: "Client buys", es: "Cliente compra" })}</button><button type="button" className={clientSide === "sell" ? "active" : ""} onClick={() => setClientSide("sell")}>{copy({ en: "Client sells", es: "Cliente vende" })}</button></div><div className="mm-segmented" role="group" aria-label={copy({ en: "Option type", es: "Tipo de opción" })}><button type="button" className={clientOptionType === "call" ? "active" : ""} onClick={() => setClientOptionType("call")}>Call</button><button type="button" className={clientOptionType === "put" ? "active" : ""} onClick={() => setClientOptionType("put")}>Put</button></div>{[[copy({ en: "Quantity", es: "Cantidad" }), clientQuantity, setClientQuantity, 1], ["Strike", clientStrike, setClientStrike, 0.1], [copy({ en: "Maturity (years)", es: "Vencimiento (años)" }), clientMaturity, setClientMaturity, 0.01], [copy({ en: "Half-spread", es: "Semispread" }), clientHalfSpread, setClientHalfSpread, 0.01]].map(([label, value, setter, step]) => <label key={String(label)}><span>{String(label)}</span><input type="number" aria-label={String(label)} min={0} step={Number(step)} value={Number(value)} onChange={(event) => (setter as (next: number) => void)(Number(event.currentTarget.value))} /></label>)}<div className="mm-quote-preview"><span>{copy({ en: "Dealer side", es: "Lado dealer" })}<strong>{clientSide === "buy" ? copy({ en: "SHORT", es: "CORTO" }) : copy({ en: "LONG", es: "LARGO" })}</strong></span><span>{copy({ en: "Model mid", es: "Mid de modelo" })}<strong>{orderPreview ? money(orderPreview.referencePrice) : "—"}</strong></span><span>{copy({ en: "Client execution", es: "Ejecución cliente" })}<strong>{orderPreview ? money(orderPreview.executionPrice) : "—"}</strong></span></div><button className="mm-primary-action" type="submit">{copy({ en: "Execute client flow", es: "Ejecutar flujo cliente" })}</button>{orderError && <p className="mm-error" role="alert">{orderError}</p>}</form><aside className="mm-flow-explainer"><h4>{copy({ en: "Where does the edge come from?", es: "¿De dónde sale el margen?" })}</h4><p>{copy({ en: "A client buy makes the dealer short at ask. A client sell makes the dealer long at bid. In both cases, the initial spread edge is positive; later market risk belongs to the dealer until hedged.", es: "Una compra del cliente deja al dealer corto en ask. Una venta deja al dealer largo en bid. En ambos casos, el margen inicial es positivo; el riesgo posterior pertenece al dealer hasta cubrirlo." })}</p><code>L = w · (Pmid − Pexec)</code><dl><div><dt>{copy({ en: "Client spread capture", es: "Captura de spread cliente" })}</dt><dd>{money(valuation.clientSpreadCapture)}</dd></div><div><dt>{copy({ en: "Hedge friction", es: "Fricción de cobertura" })}</dt><dd>{money(valuation.hedgeFriction)}</dd></div></dl></aside></div><MarketMakingBlotter trades={trades} valuation={valuation} />
      </section>

      <section role="tabpanel" id="mm-panel-risk" aria-labelledby="mm-tab-risk" hidden={activeStage !== "risk"} className="mm-stage-panel"><MarketMakingRisk valuation={valuation} trades={trades} selectedUnderlyingId={selectedUnderlyingId} diagnostics={diagnostics} /></section>

      <section role="tabpanel" id="mm-panel-hedge" aria-labelledby="mm-tab-hedge" hidden={activeStage !== "hedge"} className="mm-stage-panel mm-hedge-panel">
        <header className="mm-panel-heading"><div><h3>{copy({ en: "Hedge decision", es: "Decisión de cobertura" })}</h3><p>{copy({ en: "Preview the risk transfer and cost before adding any hedge to the dealer book.", es: "Previsualiza la transferencia de riesgo y el coste antes de añadir una cobertura al libro." })}</p></div><button type="button" onClick={undoLast} disabled={bookHistory.length === 0}>{copy({ en: "Undo last book change", es: "Deshacer último cambio" })}</button></header>
        <div className="mm-hedge-layout"><aside className="mm-hedge-controls"><label><span>{copy({ en: "Hedge target", es: "Objetivo de cobertura" })}</span><select aria-label={copy({ en: "Hedge target", es: "Objetivo de cobertura" })} value={hedgeTarget} onChange={(event) => setHedgeTarget(event.currentTarget.value as typeof hedgeTarget)}><option value="delta">Delta</option><option value="gamma">Gamma + Delta</option><option value="vega">Vega + Delta</option></select></label>{hedgeTarget !== "delta" && <>{[["Strike", hedgeStrike, setHedgeStrike, 0.1], [copy({ en: "Hedge maturity", es: "Vencimiento de cobertura" }), hedgeMaturity, setHedgeMaturity, 0.01], [copy({ en: "Lot size", es: "Tamaño de lote" }), hedgeLotSize, setHedgeLotSize, 1], [copy({ en: "Option half-spread", es: "Semispread de opción" }), hedgeHalfSpread, setHedgeHalfSpread, 0.01]].map(([label, value, setter, step]) => <label key={String(label)}><span>{String(label)}</span><input type="number" min={0} step={Number(step)} value={Number(value)} onChange={(event) => (setter as (next: number) => void)(Number(event.currentTarget.value))} /></label>)}</>}<label><span>{copy({ en: "Stock cost (bp)", es: "Coste de acciones (pb)" })}</span><input type="number" min={0} step={0.5} value={stockCostBps} onChange={(event) => setStockCostBps(Number(event.currentTarget.value))} /></label></aside><div className="mm-hedge-preview">{proposal.status === "ok" ? <><div className="mm-before-after"><section><span>{copy({ en: "Before", es: "Antes" })}</span><strong>Δ {money(proposal.before.byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId)?.greeks.delta ?? 0)}</strong><small>ν {money(proposal.before.byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId)?.greeks.vega ?? 0)}</small></section><section><span>{copy({ en: "After", es: "Después" })}</span><strong>Δ {money(proposal.after.byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId)?.greeks.delta ?? 0)}</strong><small>ν {money(proposal.after.byUnderlying.find((item) => item.underlyingId === selectedUnderlyingId)?.greeks.vega ?? 0)}</small></section></div><div className="mm-ticket-list"><span>{copy({ en: "Proposed dealer tickets", es: "Tickets propuestos del dealer" })}</span>{proposal.tickets.map((ticket) => <code key={ticket.id}>{signedTicket(ticket)}</code>)}</div>{proposal.roundedOptionQuantity !== undefined && <p>{copy({ en: "Theoretical option quantity", es: "Cantidad teórica de opciones" })}: {proposal.theoreticalOptionQuantity?.toFixed(3)} → {copy({ en: "rounded", es: "redondeada" })}: {proposal.roundedOptionQuantity.toFixed(3)}</p>}<div className="mm-hedge-cost"><span>{copy({ en: "Estimated hedge friction", es: "Fricción estimada de cobertura" })}</span><strong>{money(proposal.estimatedHedgeFriction)}</strong></div><button type="button" className="mm-primary-action" onClick={applyHedge}>{copy({ en: "Execute hedge", es: "Ejecutar cobertura" })}</button></> : <p className="mm-error" role="status">{copy({ en: `Hedge unavailable: ${proposal.reason}.`, es: `Cobertura no disponible: ${proposal.reason}.` })}</p>}</div></div>
      </section>

      <section role="tabpanel" id="mm-panel-scenario" aria-labelledby="mm-tab-scenario" hidden={activeStage !== "scenario"} className="mm-stage-panel mm-scenario-panel">
        <header className="mm-panel-heading"><div><h3>{copy({ en: "Snapshot & shock", es: "Foto y escenario" })}</h3><p>{copy({ en: "Save the dealer book, move the market, then compare exact repricing with a local Greek explanation.", es: "Guarda el libro, mueve el mercado y compara la revaloración exacta con la explicación local por griegas." })}</p></div><button type="button" onClick={() => setSnapshot(createMarketMakingSnapshot(trades, market))}>{copy({ en: "Save snapshot", es: "Guardar foto" })}</button></header>
        <div className="mm-scenario-controls">{[
          [copy({ en: "Spot move", es: "Movimiento de spot" }), "spotMovePercent", scenario.spotMovePercent, -0.3, 0.3, 0.005, `${(scenario.spotMovePercent * 100).toFixed(1)}%`],
          [copy({ en: "Volatility level", es: "Nivel de volatilidad" }), "volatilityLevelMove", scenario.volatilityLevelMove, -0.15, 0.2, 0.005, `${(scenario.volatilityLevelMove * 100).toFixed(1)} pts`],
          ["Skew", "skewMove", scenario.skewMove, -0.2, 0.2, 0.005, scenario.skewMove.toFixed(3)],
          [copy({ en: "Rate move", es: "Movimiento de tipos" }), "rateMove", scenario.rateMove, -0.03, 0.03, 0.001, `${(scenario.rateMove * 10000).toFixed(0)} bp`],
          [copy({ en: "Elapsed days", es: "Días transcurridos" }), "elapsedDays", scenario.elapsedDays, 0, 30, 1, `${scenario.elapsedDays.toFixed(0)}d`],
        ].map(([label, key, value, min, max, step, display]) => <MMControl key={String(key)} label={String(label)} value={Number(value)} min={Number(min)} max={Number(max)} step={Number(step)} display={String(display)} onChange={(next) => setScenario((current) => ({ ...current, [String(key)]: next }))} />)}</div>
        <div className="mm-pnl-authority"><section><span>{copy({ en: "Exact repricing", es: "Revaloración exacta" })}</span><strong>{money(scenarioExplain.actual)}</strong><small>{copy({ en: "Snapshot book · full model", es: "Libro fotografiado · modelo completo" })}</small></section><section><span>{copy({ en: "Local Greek approximation", es: "Aproximación local por griegas" })}</span><strong>{money(scenarioExplain.approximate)}</strong><small>{copy({ en: "Delta + gamma + vega + theta + rho", es: "Delta + gamma + vega + theta + rho" })}</small></section><section><span>{copy({ en: "Current hedged-book repricing", es: "Revaloración del libro cubierto actual" })}</span><strong>{money(currentScenario.actual)}</strong><small>{hasHedge ? copy({ en: "Includes executed hedges", es: "Incluye coberturas ejecutadas" }) : copy({ en: "No hedge executed yet", es: "Aún no hay cobertura ejecutada" })}</small></section></div>
        <div className="mm-table-scroll"><table aria-label={copy({ en: "Scenario P&L attribution", es: "Atribución de P&L del escenario" })}><thead><tr><th scope="col">{copy({ en: "Bucket", es: "Componente" })}</th><th scope="col">P&amp;L</th><th scope="col">{copy({ en: "Desk move", es: "Movimiento de mesa" })}</th></tr></thead><tbody>{scenarioRows.map(([label, value]) => <tr key={String(label)}><th scope="row">{String(label).toUpperCase()}</th><td>{money(Number(value))}</td><td>{String(label) === "vega" ? `${(scenario.volatilityLevelMove / 0.01).toFixed(1)} vol pts` : String(label) === "rho" ? `${(scenario.rateMove / 0.01).toFixed(2)} × 100bp` : String(label) === "theta" ? `${scenario.elapsedDays.toFixed(0)}d` : String(label) === "delta" || String(label) === "gamma" ? `${(scenario.spotMovePercent * selectedUnderlying.spot).toFixed(2)} spot` : copy({ en: "finite-shock remainder", es: "resto de shock finito" })}</td></tr>)}</tbody></table></div>
      </section>

      <section role="tabpanel" id="mm-panel-replay" aria-labelledby="mm-tab-replay" hidden={activeStage !== "replay"} className="mm-stage-panel"><MarketMakingReplay state={replay} benchmark={benchmarkReplay} events={replayEvents} onNext={() => { const event = replayEvents[replay.stepIndex]; if (event) setReplay((state) => advanceMarketMakingReplay(state, event)); }} onRebalance={() => { const next = proposeMarketMakingDeltaHedge(replay.trades, replay.market, selectedUnderlyingId, stockCostBps); if (next.status === "ok") setReplay((state) => executeMarketMakingReplayHedge(state, next.tickets, copy({ en: "Manual delta hedge", es: "Cobertura delta manual" }))); }} onReset={() => resetReplay(trades, market)} /></section>
    </div>

    <footer className="mm-method-boundary"><div><span>{copy({ en: "MODEL BOUNDARY", es: "LÍMITE DEL MODELO" })}</span><p>{copy({ en: "European options, educational parametric volatility surfaces, deterministic events and Black–Scholes repricing. No American exercise, calibrated smile dynamics, order-book queue, market impact, margin or production execution. Exact repricing and marked-wealth reconciliation are authoritative; Greeks are local explanations.", es: "Opciones europeas, superficies paramétricas educativas, eventos deterministas y revaloración Black–Scholes. Sin ejercicio americano, dinámica calibrada de sonrisa, cola de órdenes, impacto de mercado, margen ni ejecución productiva. La revaloración exacta y la conciliación de riqueza son la autoridad; las griegas son explicaciones locales." })}</p></div><nav aria-label={copy({ en: "Related learning", es: "Aprendizaje relacionado" })}><a href="/learn/risk/hedging-pnl-attribution">{copy({ en: "Hedging & P&L lesson", es: "Lección de cobertura y P&L" })} →</a><a href="/analytics/portfolio">{copy({ en: "Open free-form portfolio analytics", es: "Abrir analítica libre de cartera" })} →</a></nav></footer>
  </div>;
}
