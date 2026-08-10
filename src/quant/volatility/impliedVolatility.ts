import { blackScholes, type BlackScholesInput } from "../models/blackScholes";
import { black76, type Black76Input } from "../models/black76";

export type ImpliedVolatilityInput =
  | ({ model: "bsm" | "gk"; marketPrice: number } & Omit<BlackScholesInput, "volatility">)
  | ({ model: "black76"; marketPrice: number } & Omit<Black76Input, "volatility">);

export interface ImpliedVolatilityResult { volatility: number; iterations: number; residual: number; converged: boolean; solver: "BRENT"; }

export function impliedVolatility(input: ImpliedVolatilityInput): ImpliedVolatilityResult {
  const price = (volatility: number) => input.model === "black76"
    ? black76({ forward: input.forward, strike: input.strike, time: input.time, rate: input.rate, type: input.type, volatility }).price
    : blackScholes({ spot: input.spot, strike: input.strike, time: input.time, rate: input.rate, dividend: input.dividend, type: input.type, volatility }).price;
  if (!Number.isFinite(input.marketPrice) || input.marketPrice < 0) throw new Error("Market option price must be finite and non-negative.");
  const lower = price(1e-8);
  const upper = price(5);
  if (input.marketPrice < lower - 1e-10 || input.marketPrice > upper + 1e-10) throw new Error(`Price violates model bounds [${lower.toFixed(6)}, ${upper.toFixed(6)}].`);
  let a = 1e-8; let b = 5; let fa = price(a) - input.marketPrice; let fb = price(b) - input.marketPrice;
  if (Math.abs(fa) < 1e-10) return { volatility: a, iterations: 0, residual: fa, converged: true, solver: "BRENT" };
  for (let iteration = 1; iteration <= 100; iteration += 1) {
    const secant = b - fb * (b - a) / (fb - fa);
    const midpoint = (a + b) / 2;
    const candidate = Number.isFinite(secant) && secant > a && secant < b ? secant : midpoint;
    const fc = price(candidate) - input.marketPrice;
    if (Math.abs(fc) < 1e-10 || Math.abs(b - a) < 1e-9) return { volatility: candidate, iterations: iteration, residual: fc, converged: true, solver: "BRENT" };
    if (fa * fc <= 0) { b = candidate; fb = fc; } else { a = candidate; fa = fc; }
  }
  const volatility = (a + b) / 2;
  return { volatility, iterations: 100, residual: price(volatility) - input.marketPrice, converged: false, solver: "BRENT" };
}
