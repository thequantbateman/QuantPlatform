import { discountFactor, type DiscountCurvePoint, zeroRate } from "./rates";

export type CurveScenarioKind = "parallel" | "steepener" | "flattener" | "butterfly";

function validateCurve(points: readonly DiscountCurvePoint[]): DiscountCurvePoint[] {
  if (points.length < 2) throw new RangeError("A curve scenario requires at least two points.");
  const sorted = [...points].sort((left, right) => left.time - right.time);
  sorted.forEach((point, index) => {
    if (!Number.isFinite(point.time) || point.time <= 0 || !Number.isFinite(point.discount) || point.discount <= 0) throw new RangeError("Curve points require positive finite times and discounts.");
    if (index > 0 && point.time === sorted[index - 1].time) throw new RangeError("Curve times must be unique.");
  });
  return sorted;
}

function scenarioWeight(kind: CurveScenarioKind, unit: number): number {
  if (kind === "parallel") return 1;
  if (kind === "steepener") return 2 * unit - 1;
  if (kind === "flattener") return 1 - 2 * unit;
  return 1 - 2 * Math.abs(2 * unit - 1);
}

/** Apply an explicit zero-rate level/slope/curvature shock in basis points. */
export function applyCurveScenario(
  points: readonly DiscountCurvePoint[],
  kind: CurveScenarioKind,
  magnitudeBps: number,
): DiscountCurvePoint[] {
  if (!Number.isFinite(magnitudeBps)) throw new RangeError("Curve shock must be finite.");
  const sorted = validateCurve(points);
  const first = sorted[0].time;
  const width = sorted[sorted.length - 1].time - first;
  return sorted.map((point) => {
    const unit = width === 0 ? 0.5 : (point.time - first) / width;
    const shockedZero = zeroRate(point.discount, point.time) + magnitudeBps * scenarioWeight(kind, unit) / 10_000;
    return { time: point.time, discount: discountFactor(shockedZero, point.time) };
  });
}

export function bumpCurveNode(
  points: readonly DiscountCurvePoint[],
  nodeIndex: number,
  bumpBps: number,
): DiscountCurvePoint[] {
  if (!Number.isInteger(nodeIndex)) throw new RangeError("Curve node index must be an integer.");
  if (!Number.isFinite(bumpBps)) throw new RangeError("Curve node bump must be finite.");
  const sorted = validateCurve(points);
  if (nodeIndex < 0 || nodeIndex >= sorted.length) throw new RangeError("Curve node index is out of range.");
  return sorted.map((point, index) => index === nodeIndex
    ? { time: point.time, discount: discountFactor(zeroRate(point.discount, point.time) + bumpBps / 10_000, point.time) }
    : point);
}
