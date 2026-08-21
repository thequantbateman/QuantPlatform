import type {
  PortfolioMarketState,
  PortfolioPosition,
} from "./types";
import { valuePortfolio } from "./valuation";

export interface PortfolioScenario {
  spotMove: number;
  volatilityMove: number;
  elapsedDays: number;
  rateMove: number;
}

export interface PortfolioPnlExplain {
  actual: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
  approximate: number;
  residual: number;
}

export interface SpotVolPnlPoint {
  spot: number;
  volatility: number;
  modelValue: number;
  pnl: number;
}

export interface SpotVolPnlGrid {
  spots: number[];
  volatilities: number[];
  points: SpotVolPnlPoint[][];
  baseCell: { row: number; column: number };
}

export interface TimeDecayPoint {
  elapsedDays: number;
  modelValue: number;
  pnl: number;
}

function cleanZero(value: number): number {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

function validateScenario(scenario: PortfolioScenario): void {
  if (!Number.isFinite(scenario.spotMove)) throw new RangeError("Spot move must be finite.");
  if (!Number.isFinite(scenario.volatilityMove)) {
    throw new RangeError("Volatility move must be finite.");
  }
  if (!Number.isFinite(scenario.elapsedDays) || scenario.elapsedDays < 0) {
    throw new RangeError("Elapsed days must be finite and non-negative.");
  }
  if (!Number.isFinite(scenario.rateMove)) throw new RangeError("Rate move must be finite.");
}

export function explainPortfolioPnl(
  positions: readonly PortfolioPosition[],
  market: PortfolioMarketState,
  scenario: PortfolioScenario,
): PortfolioPnlExplain {
  validateScenario(scenario);
  const shockedSpot = market.spot + scenario.spotMove;
  const shockedVolatility = market.volatility + scenario.volatilityMove;
  if (shockedSpot <= 0) throw new RangeError("Shocked spot must remain positive.");
  if (shockedVolatility < 0) {
    throw new RangeError("Shocked volatility cannot be negative.");
  }
  const base = valuePortfolio(positions, market);
  const shocked = valuePortfolio(positions, {
    ...market,
    spot: shockedSpot,
    volatility: shockedVolatility,
    rate: market.rate + scenario.rateMove,
    valuationTime: market.valuationTime + scenario.elapsedDays / 365,
  });
  const delta = cleanZero(base.greeks.delta * scenario.spotMove);
  const gamma = cleanZero(0.5 * base.greeks.gamma * scenario.spotMove ** 2);
  const vega = cleanZero(base.greeks.vega * (scenario.volatilityMove / 0.01));
  const theta = cleanZero(base.greeks.theta * scenario.elapsedDays);
  const rho = cleanZero(base.greeks.rho * (scenario.rateMove / 0.01));
  const approximate = cleanZero(delta + gamma + vega + theta + rho);
  const actual = cleanZero(shocked.modelValue - base.modelValue);

  return {
    actual,
    delta,
    gamma,
    vega,
    theta,
    rho,
    approximate,
    residual: cleanZero(actual - approximate),
  };
}

function validateAxis(
  values: readonly number[],
  label: "spot" | "volatility",
): void {
  if (values.length === 0) throw new RangeError(`${label} axis cannot be empty.`);
  for (const value of values) {
    if (!Number.isFinite(value)) throw new RangeError(`${label} axis values must be finite.`);
    if (label === "spot" ? value <= 0 : value < 0) {
      throw new RangeError(
        label === "spot" ? "Spot axis values must be positive." : "Volatility axis values cannot be negative.",
      );
    }
  }
}

function nearestIndex(values: readonly number[], target: number): number {
  let selected = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (Math.abs(values[index] - target) < Math.abs(values[selected] - target)) selected = index;
  }
  return selected;
}

export function buildSpotVolPnlGrid(
  positions: readonly PortfolioPosition[],
  market: PortfolioMarketState,
  spots: readonly number[],
  volatilities: readonly number[],
): SpotVolPnlGrid {
  validateAxis(spots, "spot");
  validateAxis(volatilities, "volatility");
  const base = valuePortfolio(positions, market);
  const points = volatilities.map((volatility) =>
    spots.map((spot) => {
      const modelValue = valuePortfolio(positions, { ...market, spot, volatility }).modelValue;
      return { spot, volatility, modelValue, pnl: cleanZero(modelValue - base.modelValue) };
    }),
  );

  return {
    spots: [...spots],
    volatilities: [...volatilities],
    points,
    baseCell: {
      row: nearestIndex(volatilities, market.volatility),
      column: nearestIndex(spots, market.spot),
    },
  };
}

export function buildTimeDecayProfile(
  positions: readonly PortfolioPosition[],
  market: PortfolioMarketState,
  elapsedDays: readonly number[],
): TimeDecayPoint[] {
  if (elapsedDays.length === 0) throw new RangeError("Elapsed-day axis cannot be empty.");
  for (const days of elapsedDays) {
    if (!Number.isFinite(days) || days < 0) {
      throw new RangeError("Elapsed days must be finite and non-negative.");
    }
  }
  const base = valuePortfolio(positions, market);
  return elapsedDays.map((days) => {
    const modelValue = valuePortfolio(positions, {
      ...market,
      valuationTime: market.valuationTime + days / 365,
    }).modelValue;
    return { elapsedDays: days, modelValue, pnl: cleanZero(modelValue - base.modelValue) };
  });
}
