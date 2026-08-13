export interface ChartSeries {
  name: string;
  values: readonly number[];
  color?: string;
}

export interface ChartDomain {
  min: number;
  max: number;
}

export function validateChartData(x: readonly number[], series: readonly ChartSeries[]): void {
  if (x.length === 0) throw new Error("A chart requires at least one x value.");
  if (series.length === 0) throw new Error("A chart requires at least one series.");
  if (!x.every(Number.isFinite)) throw new Error("Chart x values must be finite numbers.");

  for (const item of series) {
    if (item.values.length !== x.length) {
      throw new Error(`Series "${item.name}" must have the same length as the x axis.`);
    }
    if (!item.values.every(Number.isFinite)) {
      throw new Error(`Series "${item.name}" values must be finite numbers.`);
    }
  }
}

export function createStableDomain(values: readonly number[]): ChartDomain {
  if (values.length === 0 || !values.every(Number.isFinite)) {
    throw new Error("A chart domain requires finite values.");
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min !== max) return { min, max };
  if (min === 0) return { min: -1, max: 1 };

  const padding = Math.abs(min) * 0.05;
  return { min: min - padding, max: max + padding };
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function formatRate(value: number, fractionDigits = 2): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function formatYear(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}Y`;
}

export function formatCurrency(value: number, currency = "USD", fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatTimestamp(value: number): string {
  const date = new Date(value);
  if (!Number.isFinite(value) || Number.isNaN(date.getTime())) throw new Error("Timestamp must be finite.");
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

export function moveChartIndex(current: number, length: number, delta: -1 | 1, wrap = false): number {
  if (!Number.isInteger(length) || length <= 0) throw new Error("Chart index movement requires a positive length.");
  const boundedCurrent = normalizeChartIndex(current, length);
  const next = boundedCurrent + delta;
  if (wrap) return (next + length) % length;
  return Math.min(length - 1, Math.max(0, next));
}

export function normalizeChartIndex(current: number, length: number): number {
  if (!Number.isInteger(length) || length <= 0) throw new Error("Chart index normalization requires a positive length.");
  if (!Number.isFinite(current)) return 0;
  return Math.min(length - 1, Math.max(0, Math.trunc(current)));
}

export function nearestChartIndex(x: readonly number[], target: number): number {
  if (x.length === 0 || !x.every(Number.isFinite) || !Number.isFinite(target)) {
    throw new Error("Nearest chart index requires finite x values and target.");
  }
  let nearest = 0;
  let distance = Math.abs(x[0] - target);
  for (let index = 1; index < x.length; index += 1) {
    const candidate = Math.abs(x[index] - target);
    if (candidate < distance) {
      nearest = index;
      distance = candidate;
    }
  }
  return nearest;
}

const seriesPatterns: readonly (readonly number[])[] = [[], [7, 4], [2, 3], [10, 3, 2, 3]];

export function chartSeriesPattern(index: number): number[] {
  const normalized = Math.max(0, Math.trunc(index)) % seriesPatterns.length;
  return [...seriesPatterns[normalized]];
}
