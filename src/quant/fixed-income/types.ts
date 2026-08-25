import type { DiscountCurvePoint } from "../curves/rates";

export type CouponFrequency = 1 | 2 | 4;

export interface FixedRateBond {
  id: string;
  faceValue: number;
  annualCouponRate: number;
  couponFrequency: CouponFrequency;
  settlementTime: number;
  maturityTime: number;
  cleanPrice: number;
  currency: string;
}

export interface BondCashFlow {
  index: number;
  paymentTime: number;
  timeFromSettlement: number;
  accrualFactor: number;
  coupon: number;
  principal: number;
  amount: number;
}

export interface DiscountedBondCashFlow extends BondCashFlow {
  discountFactor: number;
  presentValue: number;
}

export interface YieldSolveResult {
  yield: number;
  iterations: number;
  residual: number;
  converged: boolean;
}

export interface SpreadCurvePoint {
  time: number;
  spread: number;
}

export type BondBenchmarkId = "government" | "swap" | "ois";

export interface BondBenchmark {
  id: BondBenchmarkId;
  label: string;
  curve: readonly DiscountCurvePoint[];
}
