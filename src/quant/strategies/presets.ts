import type {
  OptionPosition,
  PortfolioPosition,
  UnderlyingPosition,
} from "../portfolio/types";

export type StrategyPurpose =
  | "directional"
  | "income"
  | "protection"
  | "vertical"
  | "volatility"
  | "bounded"
  | "skew";

export type StrategyPresetId =
  | "long-call"
  | "short-call"
  | "long-put"
  | "short-put"
  | "synthetic-long"
  | "synthetic-short"
  | "covered-call"
  | "cash-secured-put"
  | "protective-put"
  | "collar"
  | "bull-call"
  | "bear-put"
  | "bear-call"
  | "bull-put"
  | "long-straddle"
  | "short-straddle"
  | "long-strangle"
  | "short-strangle"
  | "call-butterfly"
  | "iron-condor"
  | "long-risk-reversal"
  | "short-risk-reversal";

export interface PresetContext {
  spot: number;
  expiry: number;
  multiplier: number;
}

export interface StrategyPreset {
  id: StrategyPresetId;
  purpose: StrategyPurpose;
  legCount: number;
}

export const strategyPresets: readonly StrategyPreset[] = [
  { id: "long-call", purpose: "directional", legCount: 1 },
  { id: "short-call", purpose: "directional", legCount: 1 },
  { id: "long-put", purpose: "directional", legCount: 1 },
  { id: "short-put", purpose: "directional", legCount: 1 },
  { id: "synthetic-long", purpose: "directional", legCount: 2 },
  { id: "synthetic-short", purpose: "directional", legCount: 2 },
  { id: "covered-call", purpose: "income", legCount: 2 },
  { id: "cash-secured-put", purpose: "income", legCount: 1 },
  { id: "protective-put", purpose: "protection", legCount: 2 },
  { id: "collar", purpose: "protection", legCount: 3 },
  { id: "bull-call", purpose: "vertical", legCount: 2 },
  { id: "bear-put", purpose: "vertical", legCount: 2 },
  { id: "bear-call", purpose: "vertical", legCount: 2 },
  { id: "bull-put", purpose: "vertical", legCount: 2 },
  { id: "long-straddle", purpose: "volatility", legCount: 2 },
  { id: "short-straddle", purpose: "volatility", legCount: 2 },
  { id: "long-strangle", purpose: "volatility", legCount: 2 },
  { id: "short-strangle", purpose: "volatility", legCount: 2 },
  { id: "call-butterfly", purpose: "bounded", legCount: 3 },
  { id: "iron-condor", purpose: "bounded", legCount: 4 },
  { id: "long-risk-reversal", purpose: "skew", legCount: 2 },
  { id: "short-risk-reversal", purpose: "skew", legCount: 2 },
];

function validateContext(context: PresetContext): void {
  if (!Number.isFinite(context.spot) || context.spot <= 0) {
    throw new RangeError("Preset spot must be a finite positive number.");
  }
  if (!Number.isFinite(context.expiry) || context.expiry < 0) {
    throw new RangeError("Preset expiry must be a finite non-negative number.");
  }
  if (!Number.isFinite(context.multiplier) || context.multiplier <= 0) {
    throw new RangeError("Preset multiplier must be a finite positive number.");
  }
}

function syntheticPremium(
  optionType: "call" | "put",
  strikeFactor: number,
  spot: number,
): number {
  const intrinsicRate =
    optionType === "call"
      ? Math.max(1 - strikeFactor, 0)
      : Math.max(strikeFactor - 1, 0);
  const timeValueRate = 0.04 * Math.exp(-8 * Math.abs(strikeFactor - 1));
  return spot * (intrinsicRate + timeValueRate);
}

function option(
  presetId: StrategyPresetId,
  leg: number,
  context: PresetContext,
  optionType: "call" | "put",
  direction: "long" | "short",
  strikeFactor: number,
  quantity = 1,
): OptionPosition {
  const strike = Math.round(context.spot * strikeFactor * 1e8) / 1e8;
  return {
    id: `${presetId}-${leg}`,
    instrument: "option",
    optionType,
    direction,
    quantity,
    multiplier: context.multiplier,
    strike,
    maturity: context.expiry,
    premium: syntheticPremium(optionType, strikeFactor, context.spot),
  };
}

function underlying(
  presetId: StrategyPresetId,
  leg: number,
  context: PresetContext,
): UnderlyingPosition {
  return {
    id: `${presetId}-${leg}`,
    instrument: "underlying",
    direction: "long",
    quantity: context.multiplier,
    multiplier: 1,
    entryPrice: context.spot,
  };
}

const presetBuilders: Record<
  StrategyPresetId,
  (context: PresetContext) => PortfolioPosition[]
> = {
  "long-call": (c) => [option("long-call", 1, c, "call", "long", 1)],
  "short-call": (c) => [option("short-call", 1, c, "call", "short", 1)],
  "long-put": (c) => [option("long-put", 1, c, "put", "long", 1)],
  "short-put": (c) => [option("short-put", 1, c, "put", "short", 1)],
  "synthetic-long": (c) => [
    option("synthetic-long", 1, c, "call", "long", 1),
    option("synthetic-long", 2, c, "put", "short", 1),
  ],
  "synthetic-short": (c) => [
    option("synthetic-short", 1, c, "call", "short", 1),
    option("synthetic-short", 2, c, "put", "long", 1),
  ],
  "covered-call": (c) => [
    underlying("covered-call", 1, c),
    option("covered-call", 2, c, "call", "short", 1.1),
  ],
  "cash-secured-put": (c) => [
    option("cash-secured-put", 1, c, "put", "short", 0.95),
  ],
  "protective-put": (c) => [
    underlying("protective-put", 1, c),
    option("protective-put", 2, c, "put", "long", 0.9),
  ],
  collar: (c) => [
    underlying("collar", 1, c),
    option("collar", 2, c, "put", "long", 0.9),
    option("collar", 3, c, "call", "short", 1.1),
  ],
  "bull-call": (c) => [
    option("bull-call", 1, c, "call", "long", 1),
    option("bull-call", 2, c, "call", "short", 1.1),
  ],
  "bear-put": (c) => [
    option("bear-put", 1, c, "put", "long", 1),
    option("bear-put", 2, c, "put", "short", 0.9),
  ],
  "bear-call": (c) => [
    option("bear-call", 1, c, "call", "short", 1),
    option("bear-call", 2, c, "call", "long", 1.1),
  ],
  "bull-put": (c) => [
    option("bull-put", 1, c, "put", "short", 1),
    option("bull-put", 2, c, "put", "long", 0.9),
  ],
  "long-straddle": (c) => [
    option("long-straddle", 1, c, "call", "long", 1),
    option("long-straddle", 2, c, "put", "long", 1),
  ],
  "short-straddle": (c) => [
    option("short-straddle", 1, c, "call", "short", 1),
    option("short-straddle", 2, c, "put", "short", 1),
  ],
  "long-strangle": (c) => [
    option("long-strangle", 1, c, "put", "long", 0.9),
    option("long-strangle", 2, c, "call", "long", 1.1),
  ],
  "short-strangle": (c) => [
    option("short-strangle", 1, c, "put", "short", 0.9),
    option("short-strangle", 2, c, "call", "short", 1.1),
  ],
  "call-butterfly": (c) => [
    option("call-butterfly", 1, c, "call", "long", 0.9),
    option("call-butterfly", 2, c, "call", "short", 1, 2),
    option("call-butterfly", 3, c, "call", "long", 1.1),
  ],
  "iron-condor": (c) => [
    option("iron-condor", 1, c, "put", "long", 0.9),
    option("iron-condor", 2, c, "put", "short", 0.95),
    option("iron-condor", 3, c, "call", "short", 1.05),
    option("iron-condor", 4, c, "call", "long", 1.1),
  ],
  "long-risk-reversal": (c) => [
    option("long-risk-reversal", 1, c, "put", "short", 0.9),
    option("long-risk-reversal", 2, c, "call", "long", 1.1),
  ],
  "short-risk-reversal": (c) => [
    option("short-risk-reversal", 1, c, "put", "long", 0.9),
    option("short-risk-reversal", 2, c, "call", "short", 1.1),
  ],
};

export function buildStrategyPreset(
  id: StrategyPresetId,
  context: PresetContext,
): PortfolioPosition[] {
  validateContext(context);
  const builder = presetBuilders[id];
  if (!builder) throw new RangeError(`Unknown strategy preset: ${String(id)}`);
  return builder(context);
}
