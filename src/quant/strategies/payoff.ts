import type { PortfolioPosition } from "../portfolio/types";
import {
  positionWeight,
  validatePosition,
} from "../portfolio/valuation";

const ROOT_TOLERANCE = 1e-9;

export interface PayoffInterval {
  lower: number;
  upper: number | null;
  slope: number;
  intercept: number;
  activeLegIds: string[];
}

export type StrategyBound =
  | { kind: "finite"; value: number }
  | { kind: "unlimited" };

export interface StrategyAnalysis {
  expiry: number;
  netEntryCashflow: number;
  breakevens: number[];
  maxGain: StrategyBound;
  maxLoss: StrategyBound;
  intervals: PayoffInterval[];
}

function validateTerminalSpot(terminalSpot: number): void {
  if (!Number.isFinite(terminalSpot) || terminalSpot < 0) {
    throw new RangeError("Terminal spot must be a finite non-negative number.");
  }
}

function entryPrice(position: PortfolioPosition): number {
  return position.instrument === "underlying" ? position.entryPrice : position.premium;
}

export function terminalLegPayoff(
  position: PortfolioPosition,
  terminalSpot: number,
): number {
  validatePosition(position);
  validateTerminalSpot(terminalSpot);
  const weight = positionWeight(position);
  if (position.instrument === "underlying") return weight * terminalSpot;
  const intrinsic =
    position.optionType === "call"
      ? Math.max(terminalSpot - position.strike, 0)
      : Math.max(position.strike - terminalSpot, 0);
  return weight * intrinsic;
}

export function terminalLegProfit(
  position: PortfolioPosition,
  terminalSpot: number,
): number {
  return (
    terminalLegPayoff(position, terminalSpot) -
    positionWeight(position) * entryPrice(position)
  );
}

function legEquation(
  position: PortfolioPosition,
  probe: number,
): { slope: number; intercept: number; active: boolean } {
  const weight = positionWeight(position);
  const entry = entryPrice(position);
  if (position.instrument === "underlying") {
    return {
      slope: weight,
      intercept: -weight * entry,
      active: weight !== 0,
    };
  }
  if (position.optionType === "call" && probe > position.strike) {
    return {
      slope: weight,
      intercept: -weight * (position.strike + entry),
      active: weight !== 0,
    };
  }
  if (position.optionType === "put" && probe < position.strike) {
    return {
      slope: -weight,
      intercept: weight * (position.strike - entry),
      active: weight !== 0,
    };
  }
  return { slope: 0, intercept: -weight * entry, active: false };
}

export function buildPayoffIntervals(
  positions: readonly PortfolioPosition[],
): PayoffInterval[] {
  if (positions.length === 0) {
    throw new RangeError("At least one position is required.");
  }
  positions.forEach(validatePosition);
  const strikes = Array.from(
    new Set(
      positions.flatMap((position) =>
        position.instrument === "option" ? [position.strike] : [],
      ),
    ),
  ).sort((left, right) => left - right);
  const boundaries = [0, ...strikes];

  return boundaries.map((lower, index) => {
    const upper = strikes[index] ?? null;
    const probe = upper === null ? lower + Math.max(1, Math.abs(lower) * 0.01) : (lower + upper) / 2;
    let slope = 0;
    let intercept = 0;
    const activeLegIds: string[] = [];
    for (const position of positions) {
      const equation = legEquation(position, probe);
      slope += equation.slope;
      intercept += equation.intercept;
      if (equation.active) activeLegIds.push(position.id);
    }
    return { lower, upper, slope, intercept, activeLegIds };
  });
}

function uniqueSorted(values: number[]): number[] {
  const sorted = values
    .filter((value) => Number.isFinite(value) && value >= -ROOT_TOLERANCE)
    .map((value) => (Math.abs(value) <= ROOT_TOLERANCE ? 0 : value))
    .sort((left, right) => left - right);
  return sorted.filter(
    (value, index) => index === 0 || Math.abs(value - sorted[index - 1]) > ROOT_TOLERANCE,
  );
}

function resolveExpiry(
  positions: readonly PortfolioPosition[],
  requestedExpiry?: number,
): number {
  if (requestedExpiry !== undefined && (!Number.isFinite(requestedExpiry) || requestedExpiry < 0)) {
    throw new RangeError("Strategy expiry must be a finite non-negative number.");
  }
  const optionExpiries = positions.flatMap((position) =>
    position.instrument === "option" ? [position.maturity] : [],
  );
  const expiry = requestedExpiry ?? optionExpiries[0];
  if (expiry === undefined) {
    throw new RangeError("An explicit strategy expiry is required for an underlying-only book.");
  }
  if (optionExpiries.some((maturity) => Math.abs(maturity - expiry) > ROOT_TOLERANCE)) {
    throw new RangeError("Terminal strategy analysis requires one common expiry.");
  }
  return expiry;
}

export function analyzeTerminalStrategy(
  positions: readonly PortfolioPosition[],
  requestedExpiry?: number,
): StrategyAnalysis {
  if (positions.length === 0) {
    throw new RangeError("At least one position is required.");
  }
  positions.forEach(validatePosition);
  const expiry = resolveExpiry(positions, requestedExpiry);
  const intervals = buildPayoffIntervals(positions);
  const roots = uniqueSorted(
    intervals.flatMap((interval) => {
      if (Math.abs(interval.slope) <= ROOT_TOLERANCE) return [];
      const root = -interval.intercept / interval.slope;
      const insideLower = root >= interval.lower - ROOT_TOLERANCE;
      const insideUpper = interval.upper === null || root <= interval.upper + ROOT_TOLERANCE;
      return insideLower && insideUpper ? [root] : [];
    }),
  );
  const endpoints = uniqueSorted(
    intervals.flatMap((interval) =>
      interval.upper === null ? [interval.lower] : [interval.lower, interval.upper],
    ),
  );
  const endpointProfits = endpoints.map((spot) =>
    positions.reduce((sum, position) => sum + terminalLegProfit(position, spot), 0),
  );
  const maximumProfit = Math.max(...endpointProfits);
  const minimumProfit = Math.min(...endpointProfits);
  const tailSlope = intervals.at(-1)?.slope ?? 0;
  const netEntryCashflow = -positions.reduce(
    (sum, position) => sum + positionWeight(position) * entryPrice(position),
    0,
  );

  return {
    expiry,
    netEntryCashflow,
    breakevens: roots,
    maxGain:
      tailSlope > ROOT_TOLERANCE
        ? { kind: "unlimited" }
        : { kind: "finite", value: Math.max(0, maximumProfit) },
    maxLoss:
      tailSlope < -ROOT_TOLERANCE
        ? { kind: "unlimited" }
        : { kind: "finite", value: Math.max(0, -minimumProfit) },
    intervals,
  };
}
