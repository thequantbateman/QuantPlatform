import { blackScholes, type OptionAnalytics, type OptionType } from "../models/blackScholes";
import { black76 } from "../models/black76";

export type VanillaMode = "equity" | "fx" | "forward";
export type GreekMetric = "price" | "delta" | "gamma" | "vega" | "theta" | "rho";
export interface VanillaInput { mode: VanillaMode; underlying: string; spot: number; forward: number; strike: number; time: number; rate: number; foreignRate: number; volatility: number; type: OptionType; notional: number; }
export interface ScenarioGrid { spots: number[]; volatilities: number[]; values: number[][]; metric: GreekMetric; }

export function priceVanilla(input: VanillaInput): OptionAnalytics {
  if (!Number.isFinite(input.notional) || input.notional <= 0) throw new Error("Notional must be positive.");
  const unit = input.mode === "forward"
    ? black76({ forward: input.forward, strike: input.strike, time: input.time, rate: input.rate, volatility: input.volatility, type: input.type })
    : blackScholes({ spot: input.spot, strike: input.strike, time: input.time, rate: input.rate, dividend: input.foreignRate, volatility: input.volatility, type: input.type });
  const positionRisk = new Set(["price", "delta", "gamma", "vega", "theta", "rho", "intrinsicValue", "timeValue"]);
  return Object.fromEntries(Object.entries(unit).map(([key, value]) => [key, positionRisk.has(key) ? value * input.notional : value])) as unknown as OptionAnalytics;
}

export function scenarioGrid(input: VanillaInput, metric: GreekMetric, spotShocks = [-0.2, -0.1, 0, 0.1, 0.2], volShocks = [-0.1, -0.05, 0, 0.05, 0.1]): ScenarioGrid {
  const baseSpot = input.mode === "forward" ? input.forward : input.spot;
  const spots = spotShocks.map((shock) => baseSpot * (1 + shock));
  const volatilities = volShocks.map((shock) => Math.max(0.0001, input.volatility + shock));
  const values = spots.map((spot) => volatilities.map((volatility) => priceVanilla({ ...input, spot, forward: spot, volatility })[metric]));
  return { spots, volatilities, values, metric };
}
