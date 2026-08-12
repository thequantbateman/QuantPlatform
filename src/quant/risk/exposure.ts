export interface ExposurePoint { time: number; ee: number; pfe: number; collateralizedEe: number; }

export function buildExposureProfile(horizon: number, notional: number, volatility: number, percentile = 0.95, collateralThreshold = 0): ExposurePoint[] {
  if (![horizon, notional, volatility, percentile, collateralThreshold].every(Number.isFinite) || horizon <= 0 || notional < 0 || volatility < 0 || percentile <= 0.5 || percentile >= 1 || collateralThreshold < 0) throw new Error("Invalid exposure input.");
  const z = percentile >= 0.99 ? 2.32635 : percentile >= 0.975 ? 1.95996 : 1.64485;
  return Array.from({ length: 41 }, (_, index) => { const time = index * horizon / 40; const decay = Math.max(0, 1 - time / horizon); const scale = notional * volatility * Math.sqrt(Math.max(time, 1e-8)) * decay; const ee = scale / Math.sqrt(2 * Math.PI); return { time, ee, pfe: Math.max(0, z * scale), collateralizedEe: Math.min(ee, collateralThreshold) }; });
}

export function expectedPositiveExposure(profile: ExposurePoint[]): number {
  if (profile.length < 2 || profile.some((point) => !Number.isFinite(point.time) || !Number.isFinite(point.ee))) throw new Error("Exposure profile requires finite ordered points.");
  let area = 0; for (let index = 1; index < profile.length; index += 1) { const step = profile[index].time - profile[index - 1].time; if (step <= 0) throw new Error("Exposure times must be strictly increasing."); area += 0.5 * (profile[index].ee + profile[index - 1].ee) * step; }
  const horizon = profile.at(-1)!.time - profile[0].time; return horizon > 0 ? area / horizon : 0;
}

export function unilateralCva(epe: number, defaultProbability: number, recovery: number, discount = 1): number {
  if (![epe, defaultProbability, recovery, discount].every(Number.isFinite) || epe < 0 || defaultProbability < 0 || defaultProbability > 1 || recovery < 0 || recovery > 1 || discount < 0) throw new Error("Invalid CVA input.");
  return discount * (1 - recovery) * defaultProbability * epe;
}

export function historicalVarEs(losses: number[], confidence: number): { var: number; expectedShortfall: number } {
  if (losses.length < 2 || losses.some((loss) => !Number.isFinite(loss)) || confidence <= 0.5 || confidence >= 1) throw new Error("Invalid loss sample.");
  const ordered = [...losses].sort((a, b) => a - b); const index = Math.min(ordered.length - 1, Math.ceil(confidence * ordered.length) - 1); const valueAtRisk = ordered[index]; const tail = ordered.slice(index); return { var: valueAtRisk, expectedShortfall: tail.reduce((sum, loss) => sum + loss, 0) / tail.length };
}
