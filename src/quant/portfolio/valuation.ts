import {
  blackScholes,
  type OptionAnalytics,
} from "../models/blackScholes";
import type {
  DeskGreeks,
  PortfolioMarketState,
  PortfolioPosition,
  PortfolioValuation,
  PositionValuation,
} from "./types";

const ZERO_GREEKS: DeskGreeks = {
  delta: 0,
  gamma: 0,
  vega: 0,
  theta: 0,
  rho: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireFinite(record: Record<string, unknown>, field: string): number {
  const value = record[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${field} must be a finite number.`);
  }
  return value;
}

function requireNonNegative(record: Record<string, unknown>, field: string): number {
  const value = requireFinite(record, field);
  if (value < 0) throw new RangeError(`${field} cannot be negative.`);
  return value;
}

function requirePositive(record: Record<string, unknown>, field: string): number {
  const value = requireFinite(record, field);
  if (value <= 0) throw new RangeError(`${field} must be positive.`);
  return value;
}

export function validateMarketState(value: unknown): asserts value is PortfolioMarketState {
  if (!isRecord(value)) throw new TypeError("Market state must be an object.");
  requirePositive(value, "spot");
  requireNonNegative(value, "volatility");
  requireFinite(value, "rate");
  requireFinite(value, "dividend");
  requireNonNegative(value, "valuationTime");
}

export function validatePosition(value: unknown): asserts value is PortfolioPosition {
  if (!isRecord(value)) throw new TypeError("Position must be an object.");
  if (typeof value.id !== "string" || value.id.trim().length === 0) {
    throw new TypeError("Position id must be a non-empty string.");
  }
  if (value.direction !== "long" && value.direction !== "short") {
    throw new TypeError("Position direction must be long or short.");
  }
  requireNonNegative(value, "quantity");
  requirePositive(value, "multiplier");

  if (value.instrument === "underlying") {
    requireNonNegative(value, "entryPrice");
    return;
  }
  if (value.instrument === "option") {
    if (value.optionType !== "call" && value.optionType !== "put") {
      throw new TypeError("Option type must be call or put.");
    }
    requirePositive(value, "strike");
    requireNonNegative(value, "maturity");
    requireNonNegative(value, "premium");
    return;
  }
  throw new TypeError("Position instrument must be option or underlying.");
}

export function positionWeight(position: PortfolioPosition): number {
  return (position.direction === "long" ? 1 : -1) * position.quantity * position.multiplier;
}

function scaleGreeks(analytics: OptionAnalytics, weight: number): DeskGreeks {
  return {
    delta: weight * analytics.delta,
    gamma: weight * analytics.gamma,
    vega: weight * analytics.vega,
    theta: weight * analytics.theta,
    rho: weight * analytics.rho,
  };
}

export function valuePosition(
  position: PortfolioPosition,
  market: PortfolioMarketState,
): PositionValuation {
  validatePosition(position);
  validateMarketState(market);
  const weight = positionWeight(position);

  if (position.instrument === "underlying") {
    const modelValue = weight * market.spot;
    const entryValue = weight * position.entryPrice;
    return {
      positionId: position.id,
      modelValue,
      entryValue,
      unrealizedPnl: modelValue - entryValue,
      greeks: { ...ZERO_GREEKS, delta: weight },
      expired: false,
    };
  }

  const time = Math.max(position.maturity - market.valuationTime, 0);
  const analytics = blackScholes({
    spot: market.spot,
    strike: position.strike,
    time,
    rate: market.rate,
    dividend: market.dividend,
    volatility: market.volatility,
    type: position.optionType,
  });
  const modelValue = weight * analytics.price;
  const entryValue = weight * position.premium;

  return {
    positionId: position.id,
    modelValue,
    entryValue,
    unrealizedPnl: modelValue - entryValue,
    greeks: scaleGreeks(analytics, weight),
    expired: time === 0,
  };
}

export function valuePortfolio(
  positions: readonly PortfolioPosition[],
  market: PortfolioMarketState,
): PortfolioValuation {
  validateMarketState(market);
  const positionValues = positions.map((position) => valuePosition(position, market));

  return positionValues.reduce<PortfolioValuation>(
    (portfolio, position) => ({
      positions: [...portfolio.positions, position],
      modelValue: portfolio.modelValue + position.modelValue,
      entryValue: portfolio.entryValue + position.entryValue,
      unrealizedPnl: portfolio.unrealizedPnl + position.unrealizedPnl,
      greeks: {
        delta: portfolio.greeks.delta + position.greeks.delta,
        gamma: portfolio.greeks.gamma + position.greeks.gamma,
        vega: portfolio.greeks.vega + position.greeks.vega,
        theta: portfolio.greeks.theta + position.greeks.theta,
        rho: portfolio.greeks.rho + position.greeks.rho,
      },
    }),
    {
      positions: [],
      modelValue: 0,
      entryValue: 0,
      unrealizedPnl: 0,
      greeks: { ...ZERO_GREEKS },
    },
  );
}
