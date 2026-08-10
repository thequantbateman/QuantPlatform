export interface SurfaceParameters {
  atm: number;
  skew: number;
  convexity: number;
  termStructure: number;
}

export function syntheticVolatility(moneyness: number, maturity: number, params: SurfaceParameters): number {
  const x = moneyness - 1;
  return Math.max(0.01, params.atm + params.skew * x + params.convexity * x * x + params.termStructure * Math.log1p(maturity));
}
