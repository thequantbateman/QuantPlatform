import type { MarketMakingHigherOrderDiagnostics } from "./diagnostics";
import type { MarketMakingShock } from "./types";

export type MarketMakingMissionId =
  | "client-flow"
  | "delta-discipline"
  | "short-vega-repair"
  | "volatility-shock"
  | "theta-passage"
  | "rate-shock"
  | "convexity"
  | "cross-effects";

export interface MarketMakingMissionContext {
  dealerDirectionCorrect: boolean;
  delta: number;
  deltaTolerance: number;
  baselineVega: number;
  currentVega: number;
  vegaTarget: number;
  shock?: MarketMakingShock;
  comparedHedged?: boolean;
  diagnostics?: MarketMakingHigherOrderDiagnostics;
}
export interface MarketMakingMissionResult {
  complete: boolean;
  reason:
    | "dealer-direction-confirmed"
    | "dealer-direction-unconfirmed"
    | "delta-controlled"
    | "delta-outside-tolerance"
    | "vega-and-delta-controlled"
    | "vega-target-unmet"
    | "hedged-volatility-comparison-complete"
    | "volatility-comparison-required"
    | "theta-passage-complete"
    | "ten-day-passage-required"
    | "rate-shock-complete"
    | "100bp-rate-shock-required"
    | "convexity-complete"
    | "spot-jump-required"
    | "cross-effects-complete"
    | "joint-shock-diagnostics-required";
}

function completed(reason: MarketMakingMissionResult["reason"]): MarketMakingMissionResult {
  return { complete: true, reason };
}

function incomplete(reason: MarketMakingMissionResult["reason"]): MarketMakingMissionResult {
  return { complete: false, reason };
}

export function evaluateMarketMakingMission(
  id: MarketMakingMissionId,
  context: MarketMakingMissionContext,
): MarketMakingMissionResult {
  if (![context.delta, context.deltaTolerance, context.baselineVega, context.currentVega, context.vegaTarget].every(Number.isFinite)) {
    throw new RangeError("Mission risk inputs must be finite.");
  }
  if (context.deltaTolerance < 0 || context.vegaTarget < 0) {
    throw new RangeError("Mission tolerances cannot be negative.");
  }
  switch (id) {
    case "client-flow":
      return context.dealerDirectionCorrect
        ? completed("dealer-direction-confirmed")
        : incomplete("dealer-direction-unconfirmed");
    case "delta-discipline":
      return Math.abs(context.delta) <= context.deltaTolerance
        ? completed("delta-controlled")
        : incomplete("delta-outside-tolerance");
    case "short-vega-repair":
      return Math.abs(context.currentVega) <= context.vegaTarget &&
        Math.abs(context.delta) <= context.deltaTolerance &&
        Math.abs(context.currentVega) < Math.abs(context.baselineVega)
        ? completed("vega-and-delta-controlled")
        : incomplete("vega-target-unmet");
    case "volatility-shock":
      return context.comparedHedged && Math.abs(context.shock?.volatilityLevelMove ?? 0) > 0
        ? completed("hedged-volatility-comparison-complete")
        : incomplete("volatility-comparison-required");
    case "theta-passage":
      return (context.shock?.elapsedDays ?? 0) >= 10
        ? completed("theta-passage-complete")
        : incomplete("ten-day-passage-required");
    case "rate-shock":
      return Math.abs(context.shock?.rateMove ?? 0) >= 0.01
        ? completed("rate-shock-complete")
        : incomplete("100bp-rate-shock-required");
    case "convexity":
      return Math.abs(context.shock?.spotMovePercent ?? 0) >= 0.02
        ? completed("convexity-complete")
        : incomplete("spot-jump-required");
    case "cross-effects": {
      const jointShock =
        Math.abs(context.shock?.spotMovePercent ?? 0) > 0 &&
        Math.abs(context.shock?.volatilityLevelMove ?? 0) > 0;
      const finiteDiagnostics =
        context.diagnostics !== undefined &&
        [context.diagnostics.vanna, context.diagnostics.volga, context.diagnostics.charm]
          .every(Number.isFinite);
      return jointShock && finiteDiagnostics
        ? completed("cross-effects-complete")
        : incomplete("joint-shock-diagnostics-required");
    }
  }
}
