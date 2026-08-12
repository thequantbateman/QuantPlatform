import test from "node:test";
import assert from "node:assert/strict";
import { normalCdf, normalPdf } from "../src/quant/math/normal";
import { blackScholes } from "../src/quant/models/blackScholes";
import { black76, black76Price } from "../src/quant/models/black76";
import { garmanKohlhagen } from "../src/quant/models/garmanKohlhagen";
import { impliedVolatility } from "../src/quant/volatility/impliedVolatility";
import { priceVanilla, scenarioGrid } from "../src/quant/pricing/vanilla";
import { discountFactor, forwardRate, zeroRate } from "../src/quant/curves/rates";
import { linearInterpolate } from "../src/quant/curves/interpolation";
import { buildVolSurface, defaultVolSurfaceParameters, educationalVolatility, scenarioSpot } from "../src/quant/volatility/volSurface";

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

test("Black-76 analytics match a reference value", () => {
  const result = black76({ forward: 100, strike: 100, time: 1, rate: 0.05, volatility: 0.2, type: "call" });
  closeTo(result.price, 7.57708215, 2e-5);
  assert.ok(result.delta > 0 && result.gamma > 0 && result.vega > 0);
});

test("implied volatility inverts BSM and rejects impossible prices", () => {
  const target = blackScholes({ ...base, volatility: 0.31, strike: 110, type: "put" }).price;
  const result = impliedVolatility({ model: "bsm", marketPrice: target, spot: base.spot, strike: 110, time: base.time, rate: base.rate, dividend: base.dividend, type: "put" });
  closeTo(result.volatility, 0.31, 1e-8);
  assert.equal(result.converged, true);
  assert.throws(() => impliedVolatility({ model: "bsm", marketPrice: 120, spot: 100, strike: 100, time: 1, rate: 0, dividend: 0, type: "call" }), /bounds/);
});

test("scenario engine returns one coherent spot-volatility matrix", () => {
  const grid = scenarioGrid({ mode: "fx", underlying: "EURUSD", spot: 1.16, forward: 1.16, strike: 1.17, time: 1, rate: 0.03, foreignRate: 0.02, volatility: 0.1, type: "call", notional: 1 }, "gamma");
  assert.equal(grid.values.length, 5);
  assert.equal(grid.values[0].length, 5);
  assert.ok(grid.values.flat().every(Number.isFinite));
});

test("position notional scales PV and every reported Greek", () => {
  const unit = priceVanilla({ mode: "equity", underlying: "TEST", spot: 100, forward: 100, strike: 100, time: 1, rate: 0.04, foreignRate: 0.01, volatility: 0.2, type: "call", notional: 1 });
  const position = priceVanilla({ mode: "equity", underlying: "TEST", spot: 100, forward: 100, strike: 100, time: 1, rate: 0.04, foreignRate: 0.01, volatility: 0.2, type: "call", notional: 25 });
  for (const metric of ["price", "delta", "gamma", "vega", "theta", "rho"] as const) assert.ok(Math.abs(position[metric] - unit[metric] * 25) < 1e-10, metric);
});

test("educational volatility surface is finite, positive and deterministic", () => {
  const first = buildVolSurface(defaultVolSurfaceParameters);
  const second = buildVolSurface(defaultVolSurfaceParameters);
  assert.deepEqual(first, second);
  assert.equal(first.length, 6);
  assert.equal(first[0].length, 11);
  assert.ok(first.flat().every((point) => Number.isFinite(point.volatility) && point.volatility > 0));
});

test("surface scenarios deform the intended dimensions", () => {
  const base = educationalVolatility(0.8, 7 / 365, defaultVolSurfaceParameters);
  const crash = { ...defaultVolSurfaceParameters, scenario: "spot-crash" as const, phase: 1 };
  const stressed = educationalVolatility(0.8, 7 / 365, crash);
  assert.ok(stressed > base);
  assert.ok(scenarioSpot(crash) < crash.spot);

  const inversion = { ...defaultVolSurfaceParameters, scenario: "term-inversion" as const, phase: 1 };
  assert.ok(educationalVolatility(1, 7 / 365, inversion) > educationalVolatility(1, 2, inversion));
});

test("surface boundaries reject invalid inputs", () => {
  assert.throws(() => educationalVolatility(1, 0, defaultVolSurfaceParameters), /maturity/);
  assert.throws(() => buildVolSurface({ ...defaultVolSurfaceParameters, atmVol: Number.NaN }), /ATM volatility/);
});
