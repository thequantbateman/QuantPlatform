import { logLinearDiscount, type DiscountCurvePoint } from "../curves/rates";
import { solveBracketedRoot } from "../numerics/rootFinding";
import type { BondCashFlow, DiscountedBondCashFlow, FixedRateBond, YieldSolveResult } from "./types";

const EPSILON = 1e-10;

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

export function validateFixedRateBond(bond: FixedRateBond): void {
  requireFinite(bond.faceValue, "Face value");
  requireFinite(bond.annualCouponRate, "Coupon rate");
  requireFinite(bond.settlementTime, "Settlement time");
  requireFinite(bond.maturityTime, "Maturity time");
  requireFinite(bond.cleanPrice, "Clean price");
  if (bond.faceValue <= 0) throw new RangeError("Face value must be positive.");
  if (bond.annualCouponRate < 0) throw new RangeError("Coupon rate cannot be negative.");
  if (![1, 2, 4].includes(bond.couponFrequency)) throw new RangeError("Coupon frequency must be annual, semiannual or quarterly.");
  if (bond.settlementTime < 0) throw new RangeError("Settlement time cannot be negative.");
  if (bond.maturityTime <= bond.settlementTime) throw new RangeError("Bond maturity must be after settlement.");
  if (bond.cleanPrice <= 0) throw new RangeError("Clean price must be positive.");
  if (!bond.id.trim() || !bond.currency.trim()) throw new RangeError("Bond identifier and currency are required.");
}

function scheduleTimes(bond: FixedRateBond): { paymentTimes: number[]; previousCouponTime: number } {
  validateFixedRateBond(bond);
  const period = 1 / bond.couponFrequency;
  const descending: number[] = [];
  let cursor = bond.maturityTime;
  let guard = 0;
  while (cursor > bond.settlementTime + EPSILON) {
    descending.push(cursor);
    cursor -= period;
    guard += 1;
    if (guard > 2_000) throw new RangeError("Bond schedule exceeds the supported horizon.");
  }
  if (descending.length === 0) throw new RangeError("Bond has no cash flows after settlement.");
  return { paymentTimes: descending.reverse(), previousCouponTime: cursor };
}

export function generateBondCashFlows(bond: FixedRateBond): BondCashFlow[] {
  const { paymentTimes } = scheduleTimes(bond);
  const accrualFactor = 1 / bond.couponFrequency;
  const coupon = bond.faceValue * bond.annualCouponRate * accrualFactor;
  return paymentTimes.map((paymentTime, index) => {
    const principal = index === paymentTimes.length - 1 ? bond.faceValue : 0;
    return {
      index,
      paymentTime,
      timeFromSettlement: paymentTime - bond.settlementTime,
      accrualFactor,
      coupon,
      principal,
      amount: coupon + principal,
    };
  });
}

export function accruedInterest(bond: FixedRateBond): number {
  const { previousCouponTime } = scheduleTimes(bond);
  const period = 1 / bond.couponFrequency;
  const elapsed = Math.max(0, Math.min(period, bond.settlementTime - previousCouponTime));
  if (elapsed < EPSILON || Math.abs(elapsed - period) < EPSILON) return 0;
  return bond.faceValue * bond.annualCouponRate * elapsed;
}

export function dirtyPrice(bond: FixedRateBond): number {
  return bond.cleanPrice + accruedInterest(bond);
}

export function priceBondFromYield(bond: FixedRateBond, yieldToMaturity: number): number {
  validateFixedRateBond(bond);
  requireFinite(yieldToMaturity, "Yield to maturity");
  const periodicBase = 1 + yieldToMaturity / bond.couponFrequency;
  if (periodicBase <= 0) throw new RangeError("Yield is outside the periodic-compounding domain.");
  return generateBondCashFlows(bond).reduce((sum, cashFlow) => sum + cashFlow.amount * periodicBase ** (-bond.couponFrequency * cashFlow.timeFromSettlement), 0);
}

export function solveBondYield(bond: FixedRateBond): YieldSolveResult {
  const target = dirtyPrice(bond);
  const result = solveBracketedRoot((yieldToMaturity) => priceBondFromYield(bond, yieldToMaturity) - target, {
    lower: -0.95 * bond.couponFrequency,
    upper: 5,
    functionTolerance: 1e-11,
    intervalTolerance: 1e-12,
  });
  return { yield: result.root, iterations: result.iterations, residual: result.residual, converged: result.converged };
}

export function discountedBondCashFlows(
  bond: FixedRateBond,
  curve: readonly DiscountCurvePoint[],
  continuousSpread = 0,
): DiscountedBondCashFlow[] {
  requireFinite(continuousSpread, "Continuous spread");
  return generateBondCashFlows(bond).map((cashFlow) => {
    const discountFactor = logLinearDiscount(curve, cashFlow.timeFromSettlement) * Math.exp(-continuousSpread * cashFlow.timeFromSettlement);
    return { ...cashFlow, discountFactor, presentValue: cashFlow.amount * discountFactor };
  });
}

export function priceBondFromCurve(
  bond: FixedRateBond,
  curve: readonly DiscountCurvePoint[],
  continuousSpread = 0,
): number {
  return discountedBondCashFlows(bond, curve, continuousSpread).reduce((sum, cashFlow) => sum + cashFlow.presentValue, 0);
}

export interface BondPriceAnatomy {
  cleanPrice: number;
  accruedInterest: number;
  dirtyPrice: number;
  yieldToMaturity: number;
  macaulayDuration: number;
  modifiedDuration: number;
  convexity: number;
  yieldDv01: number;
}

export function bondPriceAnatomy(bond: FixedRateBond): BondPriceAnatomy {
  const accrued = accruedInterest(bond);
  const marketDirty = bond.cleanPrice + accrued;
  const solved = solveBondYield(bond);
  if (!solved.converged) throw new Error("Yield solver did not converge.");
  const periodicBase = 1 + solved.yield / bond.couponFrequency;
  const weighted = generateBondCashFlows(bond).map((cashFlow) => ({
    ...cashFlow,
    presentValue: cashFlow.amount * periodicBase ** (-bond.couponFrequency * cashFlow.timeFromSettlement),
  }));
  const macaulayDuration = weighted.reduce((sum, cashFlow) => sum + cashFlow.timeFromSettlement * cashFlow.presentValue, 0) / marketDirty;
  const modifiedDuration = macaulayDuration / periodicBase;
  const convexity = weighted.reduce((sum, cashFlow) => sum + cashFlow.timeFromSettlement * (cashFlow.timeFromSettlement + 1 / bond.couponFrequency) * cashFlow.presentValue / periodicBase ** 2, 0) / marketDirty;
  return {
    cleanPrice: bond.cleanPrice,
    accruedInterest: accrued,
    dirtyPrice: marketDirty,
    yieldToMaturity: solved.yield,
    macaulayDuration,
    modifiedDuration,
    convexity,
    yieldDv01: marketDirty - priceBondFromYield(bond, solved.yield + 0.0001),
  };
}
