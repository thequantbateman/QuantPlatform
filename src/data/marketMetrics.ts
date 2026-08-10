export interface IntelligenceMetrics {
  return1D: number;
  return5D: number;
  realizedVol20D: number | null;
  zScore20D: number | null;
  rangePosition: number | null;
  movingAverageDistance: number | null;
}

const pct = (value: number) => value * 100;
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function returnPercent(values: number[], periods = 1): number {
  if (values.length <= periods || values.at(-1) === undefined) return 0;
  return pct(values.at(-1)! / values[values.length - 1 - periods] - 1);
}

export function realizedVolatility(values: number[], periods = 20, annualization = 252): number | null {
  const sample = values.slice(-(periods + 1));
  if (sample.length < 3 || sample.some((value) => value <= 0)) return null;
  const returns = sample.slice(1).map((value, index) => Math.log(value / sample[index]));
  const average = mean(returns);
  const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, returns.length - 1);
  return pct(Math.sqrt(variance * annualization));
}

export function marketIntelligenceMetrics(values: number[]): IntelligenceMetrics {
  const sample = values.slice(-20);
  const latest = sample.at(-1);
  if (!latest || !sample.length) return { return1D: 0, return5D: 0, realizedVol20D: null, zScore20D: null, rangePosition: null, movingAverageDistance: null };
  const average = mean(sample);
  const variance = sample.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, sample.length - 1);
  const deviation = Math.sqrt(variance);
  const minimum = Math.min(...sample); const maximum = Math.max(...sample);
  return {
    return1D: returnPercent(values, 1),
    return5D: returnPercent(values, Math.min(5, values.length - 1)),
    realizedVol20D: realizedVolatility(values),
    zScore20D: deviation ? (latest - average) / deviation : 0,
    rangePosition: maximum === minimum ? 0.5 : (latest - minimum) / (maximum - minimum),
    movingAverageDistance: pct(latest / average - 1),
  };
}

export function quoteMoveLabel(assetClass: "FX" | "EQ" | "IR" | "COMM", change: number): string {
  if (assetClass === "FX") return `${change >= 0 ? "+" : ""}${(change * 10_000).toFixed(1)} pips`;
  if (assetClass === "IR") return `${change >= 0 ? "+" : ""}${(change * 100).toFixed(1)} bp`;
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
}
