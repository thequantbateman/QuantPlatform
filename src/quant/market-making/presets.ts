import { createClientOptionTrade } from "./book";
import type { MarketMakingReplayEvent } from "./replay";
import type {
  MarketMakingMarketState,
  MarketMakingTrade,
} from "./types";

export interface MarketMakingSeed {
  market: MarketMakingMarketState;
  trades: MarketMakingTrade[];
}

export function createMarketMakingSeed(): MarketMakingSeed {
  const market: MarketMakingMarketState = {
    valuationTime: 0,
    underlyings: [
      {
        id: "retail",
        label: "Retail EQ",
        spot: 50.54,
        rate: 0.03,
        dividend: 0,
        surface: {
          atmVolatility: 0.28,
          skew: -0.12,
          curvature: 0.18,
          termSlope: -0.012,
          referenceMaturity: 0.5,
          minimumVolatility: 0.01,
        },
      },
      {
        id: "bank",
        label: "Bank EQ",
        spot: 10,
        rate: 0.03,
        dividend: 0,
        surface: {
          atmVolatility: 0.34,
          skew: -0.18,
          curvature: 0.24,
          termSlope: -0.018,
          referenceMaturity: 0.5,
          minimumVolatility: 0.01,
        },
      },
      {
        id: "airline",
        label: "Airline EQ",
        spot: 7.7,
        rate: 0.03,
        dividend: 0,
        surface: {
          atmVolatility: 0.42,
          skew: -0.14,
          curvature: 0.3,
          termSlope: -0.025,
          referenceMaturity: 0.5,
          minimumVolatility: 0.01,
        },
      },
    ],
  };

  const trades: MarketMakingTrade[] = [
    createClientOptionTrade({
      id: "flow-retail-call",
      underlyingId: "retail",
      clientSide: "buy",
      optionType: "call",
      quantity: 40,
      multiplier: 100,
      strike: 52,
      maturity: 0.25,
      halfSpread: 0.06,
    }, market),
    createClientOptionTrade({
      id: "flow-retail-call-long",
      underlyingId: "retail",
      clientSide: "sell",
      optionType: "call",
      quantity: 12,
      multiplier: 100,
      strike: 54,
      maturity: 1,
      halfSpread: 0.08,
    }, market),
    createClientOptionTrade({
      id: "flow-bank-put",
      underlyingId: "bank",
      clientSide: "sell",
      optionType: "put",
      quantity: 30,
      multiplier: 100,
      strike: 9.5,
      maturity: 0.5,
      halfSpread: 0.025,
    }, market),
    createClientOptionTrade({
      id: "flow-airline-call",
      underlyingId: "airline",
      clientSide: "buy",
      optionType: "call",
      quantity: 25,
      multiplier: 100,
      strike: 8,
      maturity: 0.25,
      halfSpread: 0.03,
    }, market),
  ];
  return { market, trades };
}

export const MARKET_MAKING_REPLAY_EVENTS: readonly MarketMakingReplayEvent[] = [
  {
    id: "open",
    label: "Opening move",
    elapsedDays: 1,
    shocks: {
      retail: { spotMovePercent: 0.018, volatilityLevelMove: 0.008, skewMove: -0.004, rateMove: 0 },
    },
  },
  {
    id: "client-pressure",
    label: "Volatility bid",
    elapsedDays: 2,
    shocks: {
      retail: { spotMovePercent: -0.025, volatilityLevelMove: 0.025, skewMove: -0.012, rateMove: 0 },
    },
  },
  {
    id: "carry",
    label: "Five-day carry",
    elapsedDays: 5,
    shocks: {
      retail: { spotMovePercent: 0.006, volatilityLevelMove: -0.006, skewMove: 0.003, rateMove: 0 },
    },
  },
  {
    id: "macro",
    label: "Rates repricing",
    elapsedDays: 2,
    shocks: {
      retail: { spotMovePercent: -0.012, volatilityLevelMove: 0.01, skewMove: -0.003, rateMove: 0.01 },
    },
  },
] as const;

