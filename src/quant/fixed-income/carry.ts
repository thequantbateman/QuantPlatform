import { linearInterpolate } from "../curves/interpolation";
import { logLinearDiscount, type DiscountCurvePoint, zeroRate } from "../curves/rates";
import { generateBondCashFlows, priceBondFromCurve } from "./bonds";
import { interpolatedSpread } from "./spreads";
import type { FixedRateBond, SpreadCurvePoint } from "./types";

export interface CarryRolldownInput {
  bond: FixedRateBond;
  benchmarkCurve: readonly DiscountCurvePoint[];
  spreadCurve: readonly SpreadCurvePoint[];
  currentSpread: number;
  horizon: number;
  fundingRate: number;
}

export interface CarryRolldownResult {
  basePrice: number;
  futurePrice: number;
  carry: number;
  curveRolldown: number;
  spreadRolldown: number;
  funding: number;
  totalContribution: number;
  rolledBenchmarkRate: number;
  rolledSpread: number;
  assumption: "UNCHANGED_CURVES";
}

function validate(input: CarryRolldownInput): void {
  for (const [label, value] of [["current spread", input.currentSpread], ["horizon", input.horizon], ["funding rate", input.fundingRate]] as const) {
    if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
  }
  const remainingMaturity = input.bond.maturityTime - input.bond.settlementTime;
  if (input.horizon <= 0 || input.horizon >= remainingMaturity) throw new RangeError("Holding horizon must be positive and shorter than bond maturity.");
}

function zeroAt(curve: readonly DiscountCurvePoint[], time: number): number {
  return zeroRate(logLinearDiscount(curve, time), time);
}

function priceRemaining(
  input: CarryRolldownInput,
  benchmarkRate: (originalTime: number, remainingTime: number) => number,
  spread: number,
): number {
  return generateBondCashFlows(input.bond)
    .filter((cashFlow) => cashFlow.timeFromSettlement > input.horizon)
    .reduce((sum, cashFlow) => {
      const remainingTime = cashFlow.timeFromSettlement - input.horizon;
      return sum + cashFlow.amount * Math.exp(-(benchmarkRate(cashFlow.timeFromSettlement, remainingTime) + spread) * remainingTime);
    }, 0);
}

export function carryRolldownAnalysis(input: CarryRolldownInput): CarryRolldownResult {
  validate(input);
  const basePrice = priceBondFromCurve(input.bond, input.benchmarkCurve, input.currentSpread);
  const receivedCoupons = generateBondCashFlows(input.bond)
    .filter((cashFlow) => cashFlow.timeFromSettlement <= input.horizon)
    .reduce((sum, cashFlow) => sum + cashFlow.amount, 0);
  const currentNodeValue = priceRemaining(input, (originalTime) => zeroAt(input.benchmarkCurve, originalTime), input.currentSpread);
  const rolledCurveValue = priceRemaining(input, (_originalTime, remainingTime) => zeroAt(input.benchmarkCurve, remainingTime), input.currentSpread);
  const remainingMaturity = input.bond.maturityTime - input.bond.settlementTime - input.horizon;
  const rolledSpread = interpolatedSpread(input.spreadCurve, remainingMaturity);
  const rolledSpreadValue = priceRemaining(input, (_originalTime, remainingTime) => zeroAt(input.benchmarkCurve, remainingTime), rolledSpread);
  const carry = receivedCoupons + currentNodeValue - basePrice;
  const curveRolldown = rolledCurveValue - currentNodeValue;
  const spreadRolldown = rolledSpreadValue - rolledCurveValue;
  const funding = -basePrice * input.fundingRate * input.horizon;
  return {
    basePrice,
    futurePrice: rolledSpreadValue,
    carry,
    curveRolldown,
    spreadRolldown,
    funding,
    totalContribution: carry + curveRolldown + spreadRolldown + funding,
    rolledBenchmarkRate: linearInterpolate(input.benchmarkCurve.map((point) => ({ x: point.time, y: zeroRate(point.discount, point.time) })), remainingMaturity),
    rolledSpread,
    assumption: "UNCHANGED_CURVES",
  };
}
