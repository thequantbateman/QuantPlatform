import test from "node:test";
import assert from "node:assert/strict";
import { discountFactor } from "../src/quant/curves/rates";
import { applyCurveScenario } from "../src/quant/curves/scenarios";
import {
  accruedInterest,
  bondPriceAnatomy,
  generateBondCashFlows,
  priceBondFromCurve,
  priceBondFromYield,
  solveBondYield,
} from "../src/quant/fixed-income/bonds";
import {
  assetSwapAnalytics,
  benchmarkYieldSpread,
  solveZSpread,
  swapSpreadAtTenor,
} from "../src/quant/fixed-income/spreads";
import {
  buildRateSpreadPnlGrid,
  calculateBondRisk,
  explainRateSpreadPnl,
} from "../src/quant/fixed-income/risk";
import { carryRolldownAnalysis } from "../src/quant/fixed-income/carry";
import type { FixedRateBond, SpreadCurvePoint } from "../src/quant/fixed-income/types";
import { solveBracketedRoot } from "../src/quant/numerics/rootFinding";

const closeTo = (actual: number, expected: number, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};

const bond: FixedRateBond = {
  id: "ACME-2Y",
  faceValue: 100,
  annualCouponRate: 0.05,
  couponFrequency: 1,
  settlementTime: 0,
  maturityTime: 2,
  cleanPrice: 100,
  currency: "USD",
};

const flatCurve = (rate: number) => [1, 2, 5, 10].map((time) => ({ time, discount: discountFactor(rate, time) }));

test("bounded root solver converges and rejects an interval that does not bracket a root", () => {
  const result = solveBracketedRoot((value) => value * value - 2, { lower: 0, upper: 2 });
  closeTo(result.root, Math.SQRT2, 1e-10);
  assert.equal(result.converged, true);
  assert.ok(Math.abs(result.residual) < 1e-10);
  assert.throws(() => solveBracketedRoot((value) => value * value + 1, { lower: -1, upper: 1 }), /bracket/i);
});

test("regular bond schedule, accrued interest and dirty price preserve cash-flow economics", () => {
  assert.deepEqual(generateBondCashFlows(bond).map(({ paymentTime, amount }) => ({ paymentTime, amount })), [
    { paymentTime: 1, amount: 5 },
    { paymentTime: 2, amount: 105 },
  ]);
  const seasoned = { ...bond, settlementTime: 0.25, cleanPrice: 100 };
  closeTo(accruedInterest(seasoned), 1.25, 1e-12);
  closeTo(bondPriceAnatomy(seasoned).dirtyPrice, 101.25, 1e-12);
  assert.throws(() => generateBondCashFlows({ ...bond, maturityTime: 0 }), /maturity/i);
});

test("periodic yield prices a bond and the YTM solver inverts the market dirty price", () => {
  const price = priceBondFromYield(bond, 0.04);
  closeTo(price, 101.8860946745562, 1e-12);
  const solved = solveBondYield({ ...bond, cleanPrice: price });
  closeTo(solved.yield, 0.04, 1e-10);
  assert.equal(solved.converged, true);
});

test("zero-curve pricing discounts each dated cash flow rather than one summary yield", () => {
  const price = priceBondFromCurve(bond, flatCurve(0.04));
  closeTo(price, 101.73116356635836, 1e-12);
  assert.notEqual(price, priceBondFromYield(bond, 0.04));
});

test("G and I spreads depend on the selected maturity benchmark even when the bond is unchanged", () => {
  const marketBond = { ...bond, cleanPrice: 100 };
  const gSpread = benchmarkYieldSpread(marketBond, flatCurve(0.04));
  const iSpread = benchmarkYieldSpread(marketBond, flatCurve(0.035));
  closeTo(gSpread.spread, 0.01, 1e-9);
  closeTo(iSpread.spread, 0.015, 1e-9);
  closeTo(gSpread.bondYield, iSpread.bondYield, 1e-12);
});

test("Z-spread reprices the complete cash-flow schedule and inverts the market price", () => {
  const benchmarkPrice = priceBondFromCurve(bond, flatCurve(0.04));
  closeTo(solveZSpread({ ...bond, cleanPrice: benchmarkPrice }, flatCurve(0.04)).spread, 0, 1e-10);
  const marketPrice = 99.2783464768369;
  const solved = solveZSpread({ ...bond, cleanPrice: marketPrice }, flatCurve(0.04));
  closeTo(solved.spread, 0.0125, 1e-10);
  closeTo(priceBondFromCurve(bond, flatCurve(0.04), solved.spread), marketPrice, 1e-9);
  assert.ok(priceBondFromCurve(bond, flatCurve(0.04), solved.spread + 0.005) < marketPrice);
});

test("discounted asset-swap spread reconciles benchmark bond PV to the market dirty price", () => {
  const analysis = assetSwapAnalytics(bond, flatCurve(0.04));
  closeTo(analysis.benchmarkPrice, 101.73116356635836, 1e-12);
  closeTo(analysis.annuity, 1.883905785538959, 1e-12);
  closeTo(analysis.parSwapRate, 0.040810774192388245, 1e-12);
  closeTo(analysis.spread, 0.00918922580761171, 1e-12);
  closeTo(bond.faceValue * analysis.annuity * analysis.spread, analysis.benchmarkPrice - analysis.marketDirtyPrice, 1e-12);
  closeTo(swapSpreadAtTenor(flatCurve(0.045), flatCurve(0.04), 2), 0.005, 1e-12);
});

test("rate and spread risk are independently bumped and key-rate buckets recover a parallel DV01", () => {
  const zSpread = 0.0125;
  const risk = calculateBondRisk({ ...bond, cleanPrice: 99.2783464768369 }, flatCurve(0.04), zSpread);
  assert.ok(risk.benchmarkDv01 > 0);
  assert.ok(risk.cs01 > 0);
  assert.ok(risk.spreadDuration > 0);
  closeTo(risk.keyRateDv01.reduce((sum, point) => sum + point.dv01, 0), risk.benchmarkDv01, 2e-5);
  closeTo(risk.dts, risk.spreadDuration * 125, 1e-12);
});

test("rate by spread grid uses full repricing and decomposition reconciles total P&L", () => {
  const marketBond = { ...bond, cleanPrice: 99.2783464768369 };
  const grid = buildRateSpreadPnlGrid(marketBond, flatCurve(0.04), 0.0125, [-25, 0, 25], [-25, 0, 25]);
  closeTo(grid.points[1][1].pnl, 0, 1e-12);
  assert.ok(grid.points[2][2].pnl < 0);
  assert.ok(grid.points[0][0].pnl > 0);
  const pnl = explainRateSpreadPnl(marketBond, flatCurve(0.04), 0.0125, 25, 50);
  closeTo(pnl.totalPnl, pnl.ratePnl + pnl.spreadPnl + pnl.interactionPnl, 1e-12);
  assert.ok(pnl.ratePnl < 0 && pnl.spreadPnl < 0 && pnl.newPrice < pnl.basePrice);
});

test("shared curve scenarios distinguish level, slope and curvature with explicit signs", () => {
  const base = flatCurve(0.04);
  const parallel = applyCurveScenario(base, "parallel", 25);
  const steepener = applyCurveScenario(base, "steepener", 25);
  const flattener = applyCurveScenario(base, "flattener", 25);
  const butterfly = applyCurveScenario(base, "butterfly", 25);
  closeTo(-Math.log(parallel[0].discount) / parallel[0].time, 0.0425, 1e-12);
  assert.ok(-Math.log(steepener.at(-1)!.discount) / steepener.at(-1)!.time > -Math.log(steepener[0].discount) / steepener[0].time);
  assert.ok(-Math.log(flattener.at(-1)!.discount) / flattener.at(-1)!.time < -Math.log(flattener[0].discount) / flattener[0].time);
  const flyZeroes = butterfly.map((point) => -Math.log(point.discount) / point.time);
  assert.ok(flyZeroes[1] > flyZeroes[0] && flyZeroes[1] > flyZeroes.at(-1)!);
});

test("carry and rolldown is a reconciled conditional holding-period decomposition", () => {
  const spreadCurve: SpreadCurvePoint[] = [
    { time: 1, spread: 0.009 },
    { time: 2, spread: 0.0125 },
    { time: 5, spread: 0.018 },
  ];
  const result = carryRolldownAnalysis({ bond: { ...bond, cleanPrice: 99.2783464768369 }, benchmarkCurve: flatCurve(0.04), spreadCurve, currentSpread: 0.0125, horizon: 0.5, fundingRate: 0.03 });
  closeTo(result.totalContribution, result.carry + result.curveRolldown + result.spreadRolldown + result.funding, 1e-12);
  assert.equal(result.assumption, "UNCHANGED_CURVES");
  assert.ok(Number.isFinite(result.futurePrice));
  assert.throws(() => carryRolldownAnalysis({ bond, benchmarkCurve: flatCurve(0.04), spreadCurve, currentSpread: 0.0125, horizon: 2, fundingRate: 0.03 }), /horizon/i);
});
