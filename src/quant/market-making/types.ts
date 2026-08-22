import type { DeskGreeks, PositionDirection } from "../portfolio/types";

export type ClientSide = "buy" | "sell";
export type MarketMakingTradeSource = "client" | "hedge";

export interface MarketMakingSurface {
  atmVolatility: number;
  skew: number;
  curvature: number;
  termSlope: number;
  referenceMaturity: number;
  minimumVolatility: number;
}

export interface MarketMakingUnderlyingState {
  id: string;
  label: string;
  spot: number;
  rate: number;
  dividend: number;
  surface: MarketMakingSurface;
}

export interface MarketMakingMarketState {
  valuationTime: number;
  underlyings: MarketMakingUnderlyingState[];
}

interface MarketMakingBaseTrade {
  id: string;
  underlyingId: string;
  source: MarketMakingTradeSource;
  dealerDirection: PositionDirection;
  quantity: number;
  multiplier: number;
  referencePrice: number;
  executionPrice: number;
}

export interface MarketMakingOptionTrade extends MarketMakingBaseTrade {
  instrument: "option";
  optionType: "call" | "put";
  strike: number;
  maturity: number;
  executionHalfSpread: number;
}

export interface MarketMakingUnderlyingTrade extends MarketMakingBaseTrade {
  instrument: "underlying";
  source: "hedge";
  multiplier: 1;
  executionCostBps: number;
}

export type MarketMakingTrade = MarketMakingOptionTrade | MarketMakingUnderlyingTrade;

export interface ClientOptionOrder {
  id: string;
  underlyingId: string;
  clientSide: ClientSide;
  optionType: "call" | "put";
  quantity: number;
  multiplier: number;
  strike: number;
  maturity: number;
  halfSpread: number;
}

export type MarketMakingHedgeTarget = "gamma" | "vega";

export interface MarketMakingHedgeOption {
  underlyingId: string;
  optionType: "call" | "put";
  strike: number;
  maturity: number;
  multiplier: number;
  lotSize: number;
  halfSpread: number;
}

export interface MarketMakingShock {
  spotMovePercent: number;
  volatilityLevelMove: number;
  skewMove: number;
  rateMove: number;
  elapsedDays: number;
}

export interface MarketMakingSnapshot {
  trades: MarketMakingTrade[];
  market: MarketMakingMarketState;
}

export interface MarketMakingTradeValuation {
  tradeId: string;
  underlyingId: string;
  source: MarketMakingTradeSource;
  instrument: MarketMakingTrade["instrument"];
  modelPrice: number;
  volatility: number | null;
  modelValue: number;
  referenceValue: number;
  executionValue: number;
  unrealizedPnl: number;
  liquidityPnl: number;
  greeks: DeskGreeks;
  expired: boolean;
}

export interface MarketMakingUnderlyingValuation {
  underlyingId: string;
  label: string;
  modelValue: number;
  referenceValue: number;
  executionValue: number;
  unrealizedPnl: number;
  clientSpreadCapture: number;
  hedgeFriction: number;
  greeks: DeskGreeks;
}

export interface MarketMakingBookValuation {
  trades: MarketMakingTradeValuation[];
  byUnderlying: MarketMakingUnderlyingValuation[];
  modelValue: number;
  referenceValue: number;
  executionValue: number;
  unrealizedPnl: number;
  clientSpreadCapture: number;
  hedgeFriction: number;
  greeks: DeskGreeks;
}
