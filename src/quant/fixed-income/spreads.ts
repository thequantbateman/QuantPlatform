import { linearInterpolate } from "../curves/interpolation";
import { logLinearDiscount, parSwapRate, swapAnnuity, type DiscountCurvePoint, zeroRate } from "../curves/rates";
import { solveBracketedRoot } from "../numerics/rootFinding";
import { dirtyPrice, generateBondCashFlows, priceBondFromCurve, solveBondYield } from "./bonds";
import type { FixedRateBond } from "./types";

export function curveZeroRate(curve: readonly DiscountCurvePoint[], time: number): number {
  if (!Number.isFinite(time) || time <= 0) throw new RangeError("Benchmark maturity must be positive and finite.");
  return zeroRate(logLinearDiscount(curve, time), time);
}

export function benchmarkYieldSpread(bond: FixedRateBond, benchmarkCurve: readonly DiscountCurvePoint[]) {
  const solved = solveBondYield(bond);
  if (!solved.converged) throw new Error("Yield solver did not converge.");
  const remainingMaturity = bond.maturityTime - bond.settlementTime;
  const benchmarkYield = curveZeroRate(benchmarkCurve, remainingMaturity);
  return { bondYield: solved.yield, benchmarkYield, spread: solved.yield - benchmarkYield };
}

export interface ZSpreadResult {
  spread: number;
  iterations: number;
  residual: number;
  converged: boolean;
}

export function solveZSpread(bond: FixedRateBond, benchmarkCurve: readonly DiscountCurvePoint[]): ZSpreadResult {
  const target = dirtyPrice(bond);
  const result = solveBracketedRoot((spread) => priceBondFromCurve(bond, benchmarkCurve, spread) - target, {
    lower: -0.5,
    upper: 5,
    functionTolerance: 1e-11,
    intervalTolerance: 1e-12,
  });
  return { spread: result.root, iterations: result.iterations, residual: result.residual, converged: result.converged };
}

export interface AssetSwapAnalytics {
  marketDirtyPrice: number;
  benchmarkPrice: number;
  annuity: number;
  parSwapRate: number;
  spread: number;
}

export function assetSwapAnalytics(bond: FixedRateBond, swapCurve: readonly DiscountCurvePoint[]): AssetSwapAnalytics {
  const periods = generateBondCashFlows(bond).map((cashFlow) => ({
    discount: logLinearDiscount(swapCurve, cashFlow.timeFromSettlement),
    accrualFactor: cashFlow.accrualFactor,
  }));
  const annuity = swapAnnuity(periods);
  const marketDirtyPrice = dirtyPrice(bond);
  const benchmarkPrice = priceBondFromCurve(bond, swapCurve);
  return {
    marketDirtyPrice,
    benchmarkPrice,
    annuity,
    parSwapRate: parSwapRate(periods),
    spread: (benchmarkPrice - marketDirtyPrice) / (bond.faceValue * annuity),
  };
}

export function swapSpreadAtTenor(
  swapCurve: readonly DiscountCurvePoint[],
  governmentCurve: readonly DiscountCurvePoint[],
  tenor: number,
): number {
  return curveZeroRate(swapCurve, tenor) - curveZeroRate(governmentCurve, tenor);
}

export function interpolatedSpread(points: readonly { time: number; spread: number }[], time: number): number {
  if (points.length === 0) throw new RangeError("Spread curve cannot be empty.");
  if (points.some((point) => !Number.isFinite(point.time) || point.time <= 0 || !Number.isFinite(point.spread))) throw new RangeError("Spread curve points must be finite with positive times.");
  return linearInterpolate(points.map((point) => ({ x: point.time, y: point.spread })), time);
}
