import type { MarketMakingSurface } from "./types";

export interface MarketMakingVolatilityPoint {
  spot: number;
  strike: number;
  remainingTime: number;
}
function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

export function validateMarketMakingSurface(surface: MarketMakingSurface): void {
  requireFinite(surface.atmVolatility, "ATM volatility");
  requireFinite(surface.skew, "Skew");
  requireFinite(surface.curvature, "Curvature");
  requireFinite(surface.termSlope, "Term slope");
  requireFinite(surface.referenceMaturity, "Reference maturity");
  requireFinite(surface.minimumVolatility, "Minimum volatility");
  if (surface.atmVolatility < 0) throw new RangeError("ATM volatility cannot be negative.");
  if (surface.curvature < 0) throw new RangeError("Curvature cannot be negative.");
  if (surface.referenceMaturity < 0) throw new RangeError("Reference maturity cannot be negative.");
  if (surface.minimumVolatility <= 0) throw new RangeError("Minimum volatility must be positive.");
}

export function marketMakingVolatility(
  surface: MarketMakingSurface,
  point: MarketMakingVolatilityPoint,
): number {
  validateMarketMakingSurface(surface);
  requireFinite(point.spot, "Spot");
  requireFinite(point.strike, "Strike");
  requireFinite(point.remainingTime, "Remaining time");
  if (point.spot <= 0 || point.strike <= 0) {
    throw new RangeError("Spot and strike must be positive.");
  }
  if (point.remainingTime < 0) throw new RangeError("Remaining time cannot be negative.");

  const logMoneyness = Math.log(point.strike / point.spot);
  const volatility =
    surface.atmVolatility +
    surface.skew * logMoneyness +
    surface.curvature * logMoneyness ** 2 +
    surface.termSlope * (point.remainingTime - surface.referenceMaturity);
  return Math.max(surface.minimumVolatility, volatility);
}
