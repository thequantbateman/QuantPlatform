import test from "node:test";
import assert from "node:assert/strict";
import { normalCdf, normalPdf } from "../src/quant/math/normal";
import { blackScholes } from "../src/quant/models/blackScholes";
import { black76Price } from "../src/quant/models/black76";
import { garmanKohlhagen } from "../src/quant/models/garmanKohlhagen";
import { discountFactor, forwardRate, zeroRate } from "../src/quant/curves/rates";
import { linearInterpolate } from "../src/quant/curves/interpolation";

const closeTo = (actual: number, expected: number, tolerance = 1e-5) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
const base = { spot: 100, strike: 100, time: 1, rate: 0.05, dividend: 0, volatility: 0.2 };

test("normal distribution reference values", () => {
  closeTo(normalPdf(0), 0.3989422804, 1e-10);
  closeTo(normalCdf(0), 0.5, 1e-8);
  closeTo(normalCdf(1.96), 0.9750021, 1e-6);
});

test("Black-Scholes prices an ATM European call", () => {
  const result = blackScholes({ ...base, type: "call" });
  closeTo(result.price, 10.4506, 2e-4);
  closeTo(result.delta, 0.63683, 2e-5);
  closeTo(result.gamma, 0.018762, 2e-6);
  closeTo(result.vega, 0.37524, 2e-5);
});

test("Black-Scholes satisfies put-call parity", () => {
  const call = blackScholes({ ...base, type: "call" }).price;
  const put = blackScholes({ ...base, type: "put" }).price;
  closeTo(call - put, base.spot - base.strike * Math.exp(-base.rate * base.time), 2e-5);
});

test("Black-Scholes handles low volatility, short maturity, ITM and OTM", () => {
  const itm = blackScholes({ ...base, spot: 140, volatility: 1e-12, type: "call" });
  const otm = blackScholes({ ...base, spot: 60, volatility: 1e-12, type: "call" });
  const expiry = blackScholes({ ...base, spot: 120, time: 0, type: "put" });
  assert.ok(itm.price > 40);
  closeTo(otm.price, 0, 1e-10);
  closeTo(expiry.price, 0, 1e-10);
});

test("zero rates and discount factors invert", () => {
  const discount = discountFactor(0.0375, 7.25);
  closeTo(zeroRate(discount, 7.25), 0.0375, 1e-12);
  closeTo(discountFactor(0, 10), 1, 1e-12);
});

test("continuous forward rate is consistent with discount factors", () => {
  const start = discountFactor(0.03, 2);
  const end = discountFactor(0.04, 5);
  closeTo(forwardRate(start, end, 3), (0.04 * 5 - 0.03 * 2) / 3, 1e-12);
});

test("linear interpolation supports interior values and flat extrapolation", () => {
  const points = [{ x: 1, y: 0.02 }, { x: 5, y: 0.04 }, { x: 10, y: 0.035 }];
  closeTo(linearInterpolate(points, 3), 0.03, 1e-12);
  closeTo(linearInterpolate(points, 0), 0.02, 1e-12);
  closeTo(linearInterpolate(points, 20), 0.035, 1e-12);
});

test("Black-76 and Garman-Kohlhagen return positive finite prices", () => {
  const black = black76Price({ forward: 100, strike: 100, time: 1, rate: 0.05, volatility: 0.2, type: "call" });
  const fx = garmanKohlhagen({ spot: 1.1, strike: 1.1, time: 1, domesticRate: 0.04, foreignRate: 0.02, volatility: 0.15, type: "call" });
  assert.ok(Number.isFinite(black) && black > 0);
  assert.ok(Number.isFinite(fx.price) && fx.price > 0);
});
