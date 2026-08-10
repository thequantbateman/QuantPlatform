export interface Point {
  x: number;
  y: number;
}

export function linearInterpolate(points: readonly Point[], x: number): number {
  if (points.length === 0) throw new Error("At least one interpolation point is required.");
  const sorted = [...points].sort((a, b) => a.x - b.x);
  if (x <= sorted[0].x) return sorted[0].y;
  if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;
  const rightIndex = sorted.findIndex((point) => point.x >= x);
  const left = sorted[rightIndex - 1];
  const right = sorted[rightIndex];
  if (right.x === left.x) return left.y;
  const weight = (x - left.x) / (right.x - left.x);
  return left.y + weight * (right.y - left.y);
}
