import { normalCdf, normalPdf } from "../math/normal";
import type { OptionAnalytics, OptionType } from "./blackScholes";

export interface Black76Input {
  forward: number;
  strike: number;
  time: number;
  rate: number;
  volatility: number;
  type: OptionType;
}

export function black76Price(input: Black76Input): number {
  return black76(input).price;
}

export function black76(input: Black76Input): OptionAnalytics {
  const { forward, strike, time, rate, volatility, type } = input;
  if (![forward, strike, time, rate, volatility].every(Number.isFinite) || forward <= 0 || strike <= 0 || time < 0 || volatility < 0) throw new Error("Invalid Black-76 input.");
  const sign = type === "call" ? 1 : -1;
  const discount = Math.exp(-rate * time);
  const intrinsic = discount * Math.max(sign * (forward - strike), 0);
  if (time <= 1e-10 || volatility <= 1e-10) return { price: intrinsic, delta: sign * (forward - strike) > 0 ? sign * discount : 0, gamma: 0, vega: 0, theta: 0, rho: -time * intrinsic * 0.01, d1: Number.POSITIVE_INFINITY, d2: Number.POSITIVE_INFINITY, forward, discountFactor: discount, intrinsicValue: intrinsic, timeValue: 0, moneyness: forward / strike };
  const rootT = Math.sqrt(time);
  const d1 = (Math.log(forward / strike) + 0.5 * volatility ** 2 * time) / (volatility * rootT);
  const d2 = d1 - volatility * rootT;
  const price = discount * sign * (forward * normalCdf(sign * d1) - strike * normalCdf(sign * d2));
  const delta = sign * discount * normalCdf(sign * d1);
  const gamma = discount * normalPdf(d1) / (forward * volatility * rootT);
  const vega = discount * forward * normalPdf(d1) * rootT * 0.01;
  const thetaAnnual = rate * price - discount * forward * normalPdf(d1) * volatility / (2 * rootT);
  return { price, delta, gamma, vega, theta: thetaAnnual / 365, rho: -time * price * 0.01, d1, d2, forward, discountFactor: discount, intrinsicValue: intrinsic, timeValue: Math.max(price - intrinsic, 0), moneyness: forward / strike };
}
