import { normalCdf, normalPdf } from "../math/normal";

export type OptionType = "call" | "put";

export interface BlackScholesInput {
  spot: number;
  strike: number;
  time: number;
  rate: number;
  dividend: number;
  volatility: number;
  type: OptionType;
}

export interface OptionAnalytics {
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
  d1: number;
  d2: number;
  forward: number;
  discountFactor: number;
  intrinsicValue: number;
  timeValue: number;
  moneyness: number;
}

const EPSILON = 1e-10;

function validate(input: BlackScholesInput) {
  if (![input.spot, input.strike, input.time, input.rate, input.dividend, input.volatility].every(Number.isFinite)) {
    throw new Error("All option inputs must be finite numbers.");
  }
  if (input.spot <= 0 || input.strike <= 0 || input.time < 0 || input.volatility < 0) {
    throw new Error("Spot and strike must be positive; time and volatility cannot be negative.");
  }
}

export function blackScholes(input: BlackScholesInput): OptionAnalytics {
  validate(input);
  const { spot: s, strike: k, time: t, rate: r, dividend: q, volatility: sigma, type } = input;
  const sign = type === "call" ? 1 : -1;

  if (t <= EPSILON) {
    const itm = sign * (s - k) > 0;
    return {
      price: Math.max(sign * (s - k), 0),
      delta: itm ? sign : 0,
      gamma: 0,
      vega: 0,
      theta: 0,
      rho: 0,
      d1: sign * (s - k) >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
      d2: sign * (s - k) >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
      forward: s,
      discountFactor: 1,
      intrinsicValue: Math.max(sign * (s - k), 0),
      timeValue: 0,
      moneyness: s / k,
    };
  }

  const discountR = Math.exp(-r * t);
  const discountQ = Math.exp(-q * t);
  const forward = s * Math.exp((r - q) * t);
  const intrinsicValue = Math.max(sign * (s - k), 0);
  if (sigma <= EPSILON) {
    const forwardPv = s * discountQ - k * discountR;
    const itm = sign * forwardPv > 0;
    return {
      price: Math.max(sign * forwardPv, 0),
      delta: itm ? sign * discountQ : 0,
      gamma: 0,
      vega: 0,
      theta: 0,
      rho: itm ? sign * k * t * discountR * 0.01 : 0,
      d1: forwardPv >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
      d2: forwardPv >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
      forward,
      discountFactor: discountR,
      intrinsicValue,
      timeValue: Math.max(Math.max(sign * forwardPv, 0) - intrinsicValue, 0),
      moneyness: s / k,
    };
  }

  const rootT = Math.sqrt(t);
  const d1 = (Math.log(s / k) + (r - q + 0.5 * sigma * sigma) * t) / (sigma * rootT);
  const d2 = d1 - sigma * rootT;
  const nd1 = normalCdf(sign * d1);
  const nd2 = normalCdf(sign * d2);
  const pdf = normalPdf(d1);
  const price = sign * (s * discountQ * nd1 - k * discountR * nd2);
  const delta = sign * discountQ * nd1;
  const gamma = (discountQ * pdf) / (s * sigma * rootT);
  const vega = s * discountQ * pdf * rootT * 0.01;
  const thetaAnnual =
    -(s * discountQ * pdf * sigma) / (2 * rootT) -
    sign * r * k * discountR * nd2 +
    sign * q * s * discountQ * nd1;
  const theta = thetaAnnual / 365;
  const rho = sign * k * t * discountR * nd2 * 0.01;

  return { price, delta, gamma, vega, theta, rho, d1, d2, forward, discountFactor: discountR, intrinsicValue, timeValue: Math.max(price - intrinsicValue, 0), moneyness: s / k };
}

export function optionPrice(input: BlackScholesInput): number {
  return blackScholes(input).price;
}
