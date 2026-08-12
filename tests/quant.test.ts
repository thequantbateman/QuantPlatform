import test from "node:test";
import assert from "node:assert/strict";
import { normalCdf, normalPdf } from "../src/quant/math/normal";
import { blackScholes } from "../src/quant/models/blackScholes";
import { black76, black76Price } from "../src/quant/models/black76";
import { garmanKohlhagen } from "../src/quant/models/garmanKohlhagen";
import { impliedVolatility } from "../src/quant/volatility/impliedVolatility";
import { priceVanilla, scenarioGrid } from "../src/quant/pricing/vanilla";
import { bootstrapCurve, discountFactor, forwardRate, logLinearDiscount, parSwapRate, receiverSwapPresentValue, simpleForwardRate, swapAnnuity, zeroRate } from "../src/quant/curves/rates";
import { linearInterpolate } from "../src/quant/curves/interpolation";
import { buildVolSurface, defaultVolSurfaceParameters, educationalVolatility, scenarioSpot } from "../src/quant/volatility/volSurface";
import { brownianMarketPriceOfRisk, conditionalBinomialExpectation, girsanovDensity, measureState } from "../src/quant/probability/measureChange";
import { buildExposureProfile, expectedPositiveExposure, historicalVarEs, unilateralCva } from "../src/quant/risk/exposure";
import { antitheticVarianceReduction, compareGbmSchemes, monteCarloStandardError } from "../src/quant/simulation/schemes";

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

test("simple forwards and par swaps are internally consistent", () => {
  const discounts = [1, 2, 3, 4, 5].map((time) => discountFactor(0.04, time));
  closeTo(simpleForwardRate(discounts[1], discounts[2], 1), Math.exp(0.04) - 1, 1e-12);
  const periods = discounts.map((discount) => ({ discount, accrualFactor: 1 }));
  const annuity = swapAnnuity(periods);
  const parRate = parSwapRate(periods);
  assert.ok(annuity > 0 && parRate > 0);
  closeTo(receiverSwapPresentValue(1_000_000, parRate, periods), 0, 1e-8);
  assert.ok(receiverSwapPresentValue(1_000_000, parRate + 0.0001, periods) > 0);
});

test("log-linear discount interpolation preserves nodes and segment forwards", () => {
  const points = [
    { time: 1, discount: discountFactor(0.02, 1) },
    { time: 3, discount: discountFactor(0.03, 3) },
    { time: 7, discount: discountFactor(0.04, 7) },
  ];
  closeTo(logLinearDiscount(points, 3), points[1].discount, 1e-12);
  const midpoint = logLinearDiscount(points, 2);
  closeTo(Math.log(points[0].discount / midpoint), Math.log(midpoint / points[1].discount), 1e-12);
  closeTo(logLinearDiscount(points, 0), 1, 1e-12);
});

test("educational curve bootstrap preserves zero quotes and rejects broken domains", () => {
  const nodes = bootstrapCurve([
    { tenor: "5Y", time: 5, quote: 0.035 },
    { tenor: "1Y", time: 1, quote: 0.02 },
    { tenor: "2Y", time: 2, quote: 0.028 },
  ]);
  assert.deepEqual(nodes.map((node) => node.tenor), ["1Y", "2Y", "5Y"]);
  nodes.forEach((node) => closeTo(zeroRate(node.discount, node.time), node.quote, 1e-12));
  assert.throws(() => discountFactor(Number.NaN, 1), /finite/);
  assert.throws(() => logLinearDiscount([{ time: 1, discount: 0 }], 0.5), /positive/);
  assert.throws(() => bootstrapCurve([{ tenor: "1Y", time: 1, quote: 0.02 }, { tenor: "1Y duplicate", time: 1, quote: 0.03 }]), /unique/);
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

test("dense 3D volatility mesh preserves domains and selected-node consistency", () => {
  const maturities = Array.from({ length: 19 }, (_, index) => 7 / 365 + index * ((2 - 7 / 365) / 18));
  const moneyness = Array.from({ length: 31 }, (_, index) => 0.7 + index * 0.02);
  const dense = buildVolSurface(defaultVolSurfaceParameters, maturities, moneyness);
  assert.equal(dense.length, 19);
  assert.equal(dense[0].length, 31);
  assert.ok(dense.flat().every((point) => point.maturity > 0 && point.moneyness >= 0.7 && point.moneyness <= 1.3));
  assert.ok(dense.flat().every((point) => Number.isFinite(point.volatility) && point.volatility > 0));
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

test("measure-change primitives preserve reference identities", () => {
  closeTo(brownianMarketPriceOfRisk(0.08, 0.03, 0.2), 0.25, 1e-12);
  closeTo(girsanovDensity(0.25, 0, 2), Math.exp(-0.0625), 1e-12);
  closeTo(conditionalBinomialExpectation(10, -4, 0.6), 4.4, 1e-12);
  assert.equal(measureState("Q", 0.08, 0.03, 0.035).drift, 0.03);
  assert.equal(measureState("QT", 0.08, 0.03, 0.035).numeraire, "Zero-coupon bond P(t,T)");
  assert.throws(() => brownianMarketPriceOfRisk(0.08, 0.03, 0), /positive/);
});

test("GBM schemes share shocks and expose discretization error", () => {
  const path = compareGbmSchemes({ spot: 100, rate: 0.03, volatility: 0.2, horizon: 1, steps: 32, seed: 7 });
  assert.equal(path.time.length, 33);
  assert.ok(path.exact.every((value) => Number.isFinite(value) && value > 0));
  assert.ok(path.euler.some((value, index) => Math.abs(value - path.exact[index]) > 1e-8));
  closeTo(monteCarloStandardError(4, 100), 0.2, 1e-12);
  closeTo(antitheticVarianceReduction(-0.8), 0.1, 1e-12);
});

test("exposure, CVA and tail metrics respect financial boundaries", () => {
  const unsecured = buildExposureProfile(5, 10, 0.2, 0.95, 2);
  const tighter = buildExposureProfile(5, 10, 0.2, 0.95, 0.5);
  assert.equal(unsecured.length, 41);
  assert.ok(tighter.every((point, index) => point.collateralizedEe <= unsecured[index].collateralizedEe));
  const epe = expectedPositiveExposure(unsecured);
  assert.ok(epe > 0);
  closeTo(unilateralCva(epe, 0, 0.4), 0, 1e-12);
  const tail = historicalVarEs([1, 2, 3, 4, 5, 8, 13, 21], 0.75);
  assert.ok(tail.expectedShortfall >= tail.var);
  assert.throws(() => historicalVarEs([1], 0.99), /Invalid/);
});
