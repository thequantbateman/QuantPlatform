export interface MarketPulse {
  assetClass: "RATES" | "FX" | "EQUITY" | "COMMODITIES";
  instrument: string;
  level: string;
  move: string;
  direction: "up" | "down";
  happened: string;
  quantImpact: string[];
  history: number[];
}

export interface MarketDataProvider {
  getPulse(): Promise<MarketPulse[]>;
}

export const demoMarketPulse: MarketPulse[] = [
  { assetClass: "RATES", instrument: "EUR 10Y", level: "2.71%", move: "+5bp", direction: "up", happened: "The long end sold off as the curve bear-steepened in the demo scenario.", quantImpact: ["Swap PV", "DV01", "Forward curve", "Swaption forward"], history: [28, 32, 30, 35, 34, 42, 48, 45, 57, 62] },
  { assetClass: "FX", instrument: "EURUSD", level: "1.1642", move: "+0.38%", direction: "up", happened: "Spot moved higher while the front-end rate differential narrowed modestly.", quantImpact: ["Forward points", "FX delta", "25Δ RR", "Barrier proximity"], history: [38, 36, 42, 44, 41, 50, 54, 51, 58, 64] },
  { assetClass: "EQUITY", instrument: "SPX", level: "6,389.45", move: "−0.62%", direction: "down", happened: "The index softened and short-dated downside implied volatility firmed.", quantImpact: ["Index delta", "Put skew", "Gamma profile", "Vega buckets"], history: [70, 72, 68, 74, 78, 71, 66, 64, 61, 58] },
  { assetClass: "COMMODITIES", instrument: "Brent", level: "$71.84", move: "+1.14%", direction: "up", happened: "The prompt contract outperformed as near-term supply risk entered the demo tape.", quantImpact: ["Calendar spreads", "Convenience yield", "Asian exposure", "Crack optionality"], history: [32, 36, 34, 42, 47, 44, 53, 50, 59, 67] },
];

export class LocalMarketDataProvider implements MarketDataProvider {
  async getPulse(): Promise<MarketPulse[]> { return demoMarketPulse; }
}
