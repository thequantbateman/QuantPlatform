import { normalCdf } from "../math/normal";
import type { OptionType } from "./blackScholes";

export interface Black76Input {
  forward: number;
  strike: number;
  time: number;
  rate: number;
  volatility: number;
  type: OptionType;
}

export function black76Price(input: Black76Input): number {
  const { forward, strike, time, rate, volatility, type } = input;
  if (forward <= 0 || strike <= 0 || time < 0 || volatility < 0) throw new Error("Invalid Black-76 input.");
  const sign = type === "call" ? 1 : -1;
  const discount = Math.exp(-rate * time);
  if (time === 0 || volatility === 0) return discount * Math.max(sign * (forward - strike), 0);
  const rootT = Math.sqrt(time);
  const d1 = (Math.log(forward / strike) + 0.5 * volatility ** 2 * time) / (volatility * rootT);
  const d2 = d1 - volatility * rootT;
  return discount * sign * (forward * normalCdf(sign * d1) - strike * normalCdf(sign * d2));
}
