export function discountFactor(rate: number, time: number): number {
  if (time < 0) throw new Error("Time cannot be negative.");
  return Math.exp(-rate * time);
}

export function zeroRate(discount: number, time: number): number {
  if (discount <= 0 || time <= 0) throw new Error("Discount factor and time must be positive.");
  return -Math.log(discount) / time;
}

/** Annualised continuously compounded forward rate. */
export function forwardRate(startDiscount: number, endDiscount: number, yearFraction: number): number {
  if (startDiscount <= 0 || endDiscount <= 0 || yearFraction <= 0) throw new Error("Invalid forward-rate inputs.");
  return Math.log(startDiscount / endDiscount) / yearFraction;
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
