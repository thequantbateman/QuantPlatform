export type PredictionStatus = "LIVE" | "STALE" | "CLOSED" | "UNAVAILABLE";
export type PredictionSide = "BUY" | "SELL";

export interface PredictionOutcome {
  index: number;
  label: string;
  tokenId: string;
  price: number | null;
}

export interface PredictionMarket {
  id: string;
  eventId: string;
  conditionId: string;
  slug: string;
  question: string;
  description: string;
  category: string;
  endDate: string | null;
  outcomes: PredictionOutcome[];
  primaryOutcomeIndex: number;
  probability: number | null;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  spread: number | null;
  lastTradePrice: number | null;
  change1d: number | null;
  change1w: number | null;
  volume: number;
  volume24h: number;
  liquidity: number;
  openInterest: number | null;
  active: boolean;
  closed: boolean;
  acceptingOrders: boolean;
  negativeRisk: boolean;
  minTickSize: number | null;
  minOrderSize: number | null;
  updatedAt: string;
  sourceUrl: string;
}

export interface PredictionEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  seriesId: string | null;
  resolutionSource: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  closed: boolean;
  negativeRisk: boolean;
  volume: number;
  liquidity: number;
  openInterest: number | null;
  updatedAt: string;
  sourceUrl: string;
  markets: PredictionMarket[];
  marketCount: number;
}

export interface PredictionHistoryPoint {
  timestamp: number;
  probability: number;
}

export interface PredictionBookLevel { price: number; size: number }

export interface PredictionBook {
  marketId: string;
  tokenId: string;
  bids: PredictionBookLevel[];
  asks: PredictionBookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
  mid: number | null;
  spread: number | null;
  bidDepth: number;
  askDepth: number;
  imbalance: number | null;
  observedAt: number;
  hash: string | null;
}

export interface PredictionTrade {
  identity: string;
  marketId: string;
  tokenId: string;
  timestamp: number;
  price: number;
  size: number;
  side: PredictionSide;
  transactionHash: string | null;
}

export interface PredictionStats {
  marketId: string;
  observedAt: number;
  volume: number;
  volume24h: number;
  liquidity: number;
  openInterest: number | null;
  holders: number | null;
}

export type PredictionLivePatch =
  | { type: "status"; status: "CONNECTING" | "LIVE" | "RECONNECTING" | "CLOSED"; observedAt: number; attempt?: number }
  | { type: "book"; book: PredictionBook }
  | { type: "quote"; marketId: string; tokenId: string; bid: number | null; ask: number | null; mid: number | null; spread: number | null; last: number | null; observedAt: number; sourceEvent: string }
  | { type: "trade"; trade: PredictionTrade }
  | { type: "lifecycle"; marketId: string; event: "new_market" | "market_resolved" | "tick_size_change"; observedAt: number };

export interface PredictionCoverage {
  persistent: boolean;
  events: number;
  markets: number;
  outcomes: number;
  quotes: number;
  trades: number;
  bars: number;
  latestDataAt: number | null;
  lagMs: number | null;
}
