import { applyCurveScenario, bumpCurveNode } from "../curves/scenarios";
import type { DiscountCurvePoint } from "../curves/rates";
import { priceBondFromCurve } from "./bonds";
import type { FixedRateBond } from "./types";

const cleanZero = (value: number) => Math.abs(value) < 1e-12 ? 0 : value;

export interface KeyRateRiskPoint {
  tenor: number;
  dv01: number;
}

export interface BondRiskAnalytics {
  basePrice: number;
  benchmarkDv01: number;
  cs01: number;
  spreadDuration: number;
  dts: number;
  keyRateDv01: KeyRateRiskPoint[];
}

export function calculateBondRisk(
  bond: FixedRateBond,
  benchmarkCurve: readonly DiscountCurvePoint[],
  continuousSpread: number,
): BondRiskAnalytics {
  if (!Number.isFinite(continuousSpread)) throw new RangeError("Spread must be finite.");
  const basePrice = priceBondFromCurve(bond, benchmarkCurve, continuousSpread);
  const parallelPrice = priceBondFromCurve(bond, applyCurveScenario(benchmarkCurve, "parallel", 1), continuousSpread);
  const spreadPrice = priceBondFromCurve(bond, benchmarkCurve, continuousSpread + 0.0001);
  const benchmarkDv01 = cleanZero(basePrice - parallelPrice);
  const cs01 = cleanZero(basePrice - spreadPrice);
  const keyRateDv01 = [...benchmarkCurve]
    .sort((left, right) => left.time - right.time)
    .map((point, index) => ({ tenor: point.time, dv01: cleanZero(basePrice - priceBondFromCurve(bond, bumpCurveNode(benchmarkCurve, index, 1), continuousSpread)) }));
  const spreadDuration = cs01 / (basePrice * 0.0001);
  return { basePrice, benchmarkDv01, cs01, spreadDuration, dts: spreadDuration * continuousSpread * 10_000, keyRateDv01 };
}

export interface RateSpreadPnlPoint {
  rateShiftBps: number;
  spreadShiftBps: number;
  newPrice: number;
  pnl: number;
}

export interface RateSpreadPnlGrid {
  rateShiftsBps: number[];
  spreadShiftsBps: number[];
  points: RateSpreadPnlPoint[][];
  baseCell: { row: number; column: number };
}

function axis(values: readonly number[], label: string): number[] {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) throw new RangeError(`${label} axis must contain finite values.`);
  return [...values];
}

function nearestZero(values: readonly number[]): number {
  return values.reduce((selected, value, index) => Math.abs(value) < Math.abs(values[selected]) ? index : selected, 0);
}

export function buildRateSpreadPnlGrid(
  bond: FixedRateBond,
  benchmarkCurve: readonly DiscountCurvePoint[],
  continuousSpread: number,
  rateShiftsBps: readonly number[],
  spreadShiftsBps: readonly number[],
): RateSpreadPnlGrid {
  const rateAxis = axis(rateShiftsBps, "Rate-shift");
  const spreadAxis = axis(spreadShiftsBps, "Spread-shift");
  const basePrice = priceBondFromCurve(bond, benchmarkCurve, continuousSpread);
  const points = spreadAxis.map((spreadShiftBps) => rateAxis.map((rateShiftBps) => {
    const newPrice = priceBondFromCurve(bond, applyCurveScenario(benchmarkCurve, "parallel", rateShiftBps), continuousSpread + spreadShiftBps / 10_000);
    return { rateShiftBps, spreadShiftBps, newPrice, pnl: cleanZero(newPrice - basePrice) };
  }));
  return { rateShiftsBps: rateAxis, spreadShiftsBps: spreadAxis, points, baseCell: { row: nearestZero(spreadAxis), column: nearestZero(rateAxis) } };
}

export function explainRateSpreadPnl(
  bond: FixedRateBond,
  benchmarkCurve: readonly DiscountCurvePoint[],
  continuousSpread: number,
  rateShiftBps: number,
  spreadShiftBps: number,
) {
  if (!Number.isFinite(rateShiftBps) || !Number.isFinite(spreadShiftBps)) throw new RangeError("Rate and spread shocks must be finite.");
  const basePrice = priceBondFromCurve(bond, benchmarkCurve, continuousSpread);
  const shockedCurve = applyCurveScenario(benchmarkCurve, "parallel", rateShiftBps);
  const rateOnly = priceBondFromCurve(bond, shockedCurve, continuousSpread);
  const spreadOnly = priceBondFromCurve(bond, benchmarkCurve, continuousSpread + spreadShiftBps / 10_000);
  const newPrice = priceBondFromCurve(bond, shockedCurve, continuousSpread + spreadShiftBps / 10_000);
  const ratePnl = cleanZero(rateOnly - basePrice);
  const spreadPnl = cleanZero(spreadOnly - basePrice);
  const totalPnl = cleanZero(newPrice - basePrice);
  return { basePrice, newPrice, ratePnl, spreadPnl, interactionPnl: cleanZero(totalPnl - ratePnl - spreadPnl), totalPnl };
}
