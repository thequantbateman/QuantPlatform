export type PricingMeasure = "P" | "Q" | "QT";

export interface MeasureState {
  measure: PricingMeasure;
  drift: number;
  numeraire: string;
  martingale: string;
  expectation: string;
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
}

export function brownianMarketPriceOfRisk(mu: number, rate: number, volatility: number): number {
  finite(mu, "Physical drift"); finite(rate, "Risk-free rate"); finite(volatility, "Volatility");
  if (volatility <= 0) throw new Error("Volatility must be positive.");
  return (mu - rate) / volatility;
}

export function girsanovDensity(lambda: number, brownian: number, time: number): number {
  finite(lambda, "Market price of risk"); finite(brownian, "Brownian state"); finite(time, "Time");
  if (time < 0) throw new Error("Time cannot be negative.");
  return Math.exp(-lambda * brownian - 0.5 * lambda * lambda * time);
}

export function measureState(measure: PricingMeasure, mu: number, rate: number, forwardRate: number): MeasureState {
  [mu, rate, forwardRate].forEach((value) => finite(value, "Rate"));
  if (measure === "P") return { measure, drift: mu, numeraire: "No pricing numeraire fixed", martingale: "No discounted-price martingale imposed", expectation: "Statistical forecasts and risk premia" };
  if (measure === "Q") return { measure, drift: rate, numeraire: "Money-market account Bₜ", martingale: "Sₜ / Bₜ", expectation: "B₀ Eᴼ[S payoff / Bₜ]" };
  return { measure, drift: forwardRate, numeraire: "Zero-coupon bond P(t,T)", martingale: "Tradable / P(t,T)", expectation: "P(0,T) Eᴼᵀ[payoff]" };
}

export function conditionalBinomialExpectation(upValue: number, downValue: number, upProbability: number): number {
  [upValue, downValue, upProbability].forEach((value) => finite(value, "Conditional-expectation input"));
  if (upProbability < 0 || upProbability > 1) throw new Error("Probability must lie in [0, 1].");
  return upProbability * upValue + (1 - upProbability) * downValue;
}
