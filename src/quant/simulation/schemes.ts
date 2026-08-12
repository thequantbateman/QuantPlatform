export interface SchemeComparisonInput { spot: number; rate: number; volatility: number; horizon: number; steps: number; seed: number; }
export interface SchemePath { time: number[]; exact: number[]; euler: number[]; milstein: number[]; }

function normalStream(seed: number): () => number {
  let state = Math.trunc(seed) >>> 0;
  const uniform = () => { state = (1664525 * state + 1013904223) >>> 0; return (state + 0.5) / 4294967296; };
  let spare: number | undefined;
  return () => { if (spare !== undefined) { const value = spare; spare = undefined; return value; } const radius = Math.sqrt(-2 * Math.log(uniform())); const angle = 2 * Math.PI * uniform(); spare = radius * Math.sin(angle); return radius * Math.cos(angle); };
}

export function compareGbmSchemes(input: SchemeComparisonInput): SchemePath {
  const { spot, rate, volatility, horizon, steps, seed } = input;
  if (![spot, rate, volatility, horizon, steps, seed].every(Number.isFinite) || spot <= 0 || volatility < 0 || horizon <= 0 || !Number.isInteger(steps) || steps < 1 || steps > 4096) throw new Error("Invalid simulation input.");
  const dt = horizon / steps; const rootDt = Math.sqrt(dt); const normal = normalStream(seed); const time = [0]; const exact = [spot]; const euler = [spot]; const milstein = [spot];
  for (let index = 1; index <= steps; index += 1) { const z = normal(); time.push(index * dt); exact.push(exact.at(-1)! * Math.exp((rate - 0.5 * volatility ** 2) * dt + volatility * rootDt * z)); euler.push(euler.at(-1)! * (1 + rate * dt + volatility * rootDt * z)); milstein.push(milstein.at(-1)! * (1 + rate * dt + volatility * rootDt * z + 0.5 * volatility ** 2 * dt * (z ** 2 - 1))); }
  return { time, exact, euler, milstein };
}

export function monteCarloStandardError(sampleVariance: number, paths: number): number {
  if (!Number.isFinite(sampleVariance) || sampleVariance < 0 || !Number.isInteger(paths) || paths < 2) throw new Error("Invalid Monte Carlo error input.");
  return Math.sqrt(sampleVariance / paths);
}

export function antitheticVarianceReduction(correlation: number): number {
  if (!Number.isFinite(correlation) || correlation < -1 || correlation > 1) throw new Error("Correlation must lie in [-1, 1].");
  return Math.max(0, (1 + correlation) / 2);
}
