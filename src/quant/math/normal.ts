const INV_SQRT_TWO_PI = 1 / Math.sqrt(2 * Math.PI);

/** Standard normal probability density function. */
export function normalPdf(x: number): number {
  return INV_SQRT_TWO_PI * Math.exp(-0.5 * x * x);
}

/**
 * Standard normal cumulative distribution function.
 * Abramowitz-Stegun 7.1.26; maximum absolute error is below 7.5e-8.
 */
export function normalCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * z);
  const erf =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
      0.284496736) *
      t +
      0.254829592) *
      t) *
      Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
}
