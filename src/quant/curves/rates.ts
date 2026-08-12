function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
}

export function discountFactor(rate: number, time: number): number {
  requireFinite(rate, "Rate");
  requireFinite(time, "Time");
  if (time < 0) throw new Error("Time cannot be negative.");
  return Math.exp(-rate * time);
}

export function zeroRate(discount: number, time: number): number {
  requireFinite(discount, "Discount factor");
  requireFinite(time, "Time");
  if (discount <= 0 || time <= 0) throw new Error("Discount factor and time must be positive.");
  return -Math.log(discount) / time;
}

/** Annualised continuously compounded forward rate. */
export function forwardRate(startDiscount: number, endDiscount: number, yearFraction: number): number {
  requireFinite(startDiscount, "Start discount factor");
  requireFinite(endDiscount, "End discount factor");
  requireFinite(yearFraction, "Year fraction");
  if (startDiscount <= 0 || endDiscount <= 0 || yearFraction <= 0) throw new Error("Invalid forward-rate inputs.");
  return Math.log(startDiscount / endDiscount) / yearFraction;
}

/** Simple-compounded forward rate for an accrual period. */
export function simpleForwardRate(startDiscount: number, endDiscount: number, accrualFactor: number): number {
  requireFinite(startDiscount, "Start discount factor");
  requireFinite(endDiscount, "End discount factor");
  requireFinite(accrualFactor, "Accrual factor");
  if (startDiscount <= 0 || endDiscount <= 0 || accrualFactor <= 0) throw new Error("Invalid simple-forward inputs.");
  return (startDiscount / endDiscount - 1) / accrualFactor;
}

export interface FixedLegPeriod {
  discount: number;
  accrualFactor: number;
}

/** Present value of one unit paid per annum on a fixed-leg schedule. */
export function swapAnnuity(periods: readonly FixedLegPeriod[]): number {
  if (periods.length === 0) throw new Error("At least one fixed-leg period is required.");
  return periods.reduce((sum, period) => {
    requireFinite(period.discount, "Discount factor");
    requireFinite(period.accrualFactor, "Accrual factor");
    if (period.discount <= 0 || period.accrualFactor <= 0) throw new Error("Fixed-leg inputs must be positive.");
    return sum + period.discount * period.accrualFactor;
  }, 0);
}

/** Single-curve par coupon for a spot-starting collateralised swap. */
export function parSwapRate(periods: readonly FixedLegPeriod[], startDiscount = 1): number {
  requireFinite(startDiscount, "Start discount factor");
  if (startDiscount <= 0) throw new Error("Start discount factor must be positive.");
  const annuity = swapAnnuity(periods);
  const endDiscount = periods[periods.length - 1].discount;
  return (startDiscount - endDiscount) / annuity;
}

/** Receiver-fixed PV in currency units under a single-curve educational setup. */
export function receiverSwapPresentValue(notional: number, fixedRate: number, periods: readonly FixedLegPeriod[], startDiscount = 1): number {
  requireFinite(notional, "Notional");
  requireFinite(fixedRate, "Fixed rate");
  if (notional < 0) throw new Error("Notional cannot be negative.");
  const annuity = swapAnnuity(periods);
  const floatingLeg = startDiscount - periods[periods.length - 1].discount;
  return notional * (fixedRate * annuity - floatingLeg);
}

export interface DiscountCurvePoint {
  time: number;
  discount: number;
}

/** Log-linear interpolation of discount factors with flat continuously compounded zero-rate extrapolation. */
export function logLinearDiscount(points: readonly DiscountCurvePoint[], time: number): number {
  requireFinite(time, "Time");
  if (time < 0) throw new Error("Time cannot be negative.");
  if (time === 0) return 1;
  if (points.length === 0) throw new Error("At least one curve point is required.");
  const sorted = [...points].sort((left, right) => left.time - right.time);
  sorted.forEach((point, index) => {
    requireFinite(point.time, `Curve time ${index}`);
    requireFinite(point.discount, `Curve discount ${index}`);
    if (point.time <= 0 || point.discount <= 0) throw new Error("Curve times and discount factors must be positive.");
    if (index > 0 && point.time === sorted[index - 1].time) throw new Error("Curve times must be unique.");
  });
  if (time <= sorted[0].time) return discountFactor(zeroRate(sorted[0].discount, sorted[0].time), time);
  const last = sorted[sorted.length - 1];
  if (time >= last.time) return discountFactor(zeroRate(last.discount, last.time), time);
  const rightIndex = sorted.findIndex((point) => point.time >= time);
  const left = sorted[rightIndex - 1];
  const right = sorted[rightIndex];
  const weight = (time - left.time) / (right.time - left.time);
  return Math.exp(Math.log(left.discount) + weight * (Math.log(right.discount) - Math.log(left.discount)));
}

export interface CurveNode {
  tenor: string;
  time: number;
  quote: number;
}

export interface BootstrappedNode extends CurveNode {
  zero: number;
  discount: number;
  forward: number;
}

/** Educational zero-quote bootstrap. Replace quote-to-instrument conversion for production curves. */
export function bootstrapCurve(nodes: readonly CurveNode[]): BootstrappedNode[] {
  const sorted = [...nodes].sort((a, b) => a.time - b.time);
  sorted.forEach((node, index) => {
    requireFinite(node.time, `Node time ${index}`);
    requireFinite(node.quote, `Node quote ${index}`);
    if (node.time <= 0) throw new Error("Curve node times must be positive.");
    if (index > 0 && node.time === sorted[index - 1].time) throw new Error("Curve node times must be unique.");
  });
  return sorted.map((node, index) => {
    const discount = discountFactor(node.quote, node.time);
    const previous = index === 0 ? { time: 0, discount: 1 } : {
      time: sorted[index - 1].time,
      discount: discountFactor(sorted[index - 1].quote, sorted[index - 1].time),
    };
    return {
      ...node,
      zero: zeroRate(discount, node.time),
      discount,
      forward: forwardRate(previous.discount, discount, node.time - previous.time),
    };
  });
}
