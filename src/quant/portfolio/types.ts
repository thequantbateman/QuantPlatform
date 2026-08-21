import type { OptionType } from "../models/blackScholes";

export type PositionDirection = "long" | "short";

export interface PortfolioMarketState {
  spot: number;
  volatility: number;
  rate: number;
  dividend: number;
  valuationTime: number;
}

export interface BasePosition {
  id: string;
  direction: PositionDirection;
  quantity: number;
  multiplier: number;
}

export interface UnderlyingPosition extends BasePosition {
  instrument: "underlying";
  entryPrice: number;
}

export interface OptionPosition extends BasePosition {
  instrument: "option";
  optionType: OptionType;
  strike: number;
  maturity: number;
  premium: number;
}

export type PortfolioPosition = UnderlyingPosition | OptionPosition;

export interface DeskGreeks {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface PositionValuation {
  positionId: string;
  modelValue: number;
  entryValue: number;
  unrealizedPnl: number;
  greeks: DeskGreeks;
  expired: boolean;
}

export interface PortfolioValuation {
  positions: PositionValuation[];
  modelValue: number;
  entryValue: number;
  unrealizedPnl: number;
  greeks: DeskGreeks;
}
