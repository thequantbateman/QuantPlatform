export type VolSurfaceScenario = "base" | "spot-crash" | "vol-spike" | "term-inversion" | "skew-steepening" | "normalization";

export interface VolSurfaceParameters {
  spot: number;
  atmVol: number;
  skew: number;
  curvature: number;
  termSlope: number;
  scenario: VolSurfaceScenario;
  phase: number;
}

export interface VolSurfacePoint {
  moneyness: number;
  strike: number;
  maturity: number;
  volatility: number;
}

export const VOL_SURFACE_MATURITIES = [7 / 365, 30 / 365, 0.25, 0.5, 1, 2] as const;
export const VOL_SURFACE_MONEYNESS = [0.7, 0.76, 0.82, 0.88, 0.94, 1, 1.06, 1.12, 1.18, 1.24, 1.3] as const;

export const defaultVolSurfaceParameters: VolSurfaceParameters = {
  spot: 100,
  atmVol: 0.2,
  skew: -0.18,
  curvature: 0.55,
  termSlope: 0.025,
  scenario: "base",
  phase: 0,
};

function finiteInRange(label: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${label} must be between ${minimum} and ${maximum}`);
}

export function validateVolSurfaceParameters(params: VolSurfaceParameters): void {
  finiteInRange("spot", params.spot, 1e-6, 1e9);
  finiteInRange("ATM volatility", params.atmVol, 0.01, 2);
  finiteInRange("skew", params.skew, -2, 2);
  finiteInRange("curvature", params.curvature, 0, 5);
  finiteInRange("term slope", params.termSlope, -0.5, 0.5);
  finiteInRange("phase", params.phase, 0, 1);
}

export function scenarioSpot(params: VolSurfaceParameters): number {
  validateVolSurfaceParameters(params);
  return params.scenario === "spot-crash" ? params.spot * (1 - 0.18 * params.phase) : params.spot;
}

export function educationalVolatility(moneyness: number, maturity: number, params: VolSurfaceParameters): number {
  validateVolSurfaceParameters(params);
  finiteInRange("moneyness", moneyness, 0.1, 5);
  finiteInRange("maturity", maturity, 1 / 3650, 50);

  const logMoneyness = Math.log(moneyness);
  const frontWeight = Math.exp(-1.35 * maturity);
  const phase = params.phase;
  let levelShock = 0;
  let skewShock = 0;
  let curvatureShock = 0;
  let termShock = 0;

  if (params.scenario === "spot-crash") {
    levelShock = 0.14 * phase * frontWeight;
    skewShock = -0.32 * phase;
    curvatureShock = 0.22 * phase;
  } else if (params.scenario === "vol-spike") {
    levelShock = 0.22 * phase * (0.55 + 0.45 * frontWeight);
    curvatureShock = 0.12 * phase;
  } else if (params.scenario === "term-inversion") {
    levelShock = 0.14 * phase * frontWeight;
    termShock = -0.09 * phase;
  } else if (params.scenario === "skew-steepening") {
    skewShock = -0.38 * phase;
    curvatureShock = 0.08 * phase;
  } else if (params.scenario === "normalization") {
    const remainingStress = 1 - phase;
    levelShock = 0.16 * remainingStress * frontWeight;
    skewShock = -0.28 * remainingStress;
    curvatureShock = 0.18 * remainingStress;
  }

  const volatility = params.atmVol
    + levelShock
    + (params.skew + skewShock) * logMoneyness
    + (params.curvature + curvatureShock) * logMoneyness * logMoneyness
    + (params.termSlope + termShock) * Math.log1p(maturity);
  return Math.min(2, Math.max(0.01, volatility));
}

export function buildVolSurface(params: VolSurfaceParameters, maturities: readonly number[] = VOL_SURFACE_MATURITIES, moneyness: readonly number[] = VOL_SURFACE_MONEYNESS): VolSurfacePoint[][] {
  const spot = scenarioSpot(params);
  return maturities.map((maturity) => moneyness.map((ratio) => ({
    moneyness: ratio,
    strike: spot * ratio,
    maturity,
    volatility: educationalVolatility(ratio, maturity, params),
  })));
}

export function nearestSurfacePoint(grid: VolSurfacePoint[][], moneyness: number, maturity: number): VolSurfacePoint {
  const points = grid.flat();
  if (!points.length) throw new RangeError("surface grid cannot be empty");
  return points.reduce((nearest, point) => {
    const distance = Math.hypot(point.moneyness - moneyness, (point.maturity - maturity) / 3);
    const current = Math.hypot(nearest.moneyness - moneyness, (nearest.maturity - maturity) / 3);
    return distance < current ? point : nearest;
  });
}
