# Portfolio and Strategy Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver two rigorous, accessible Analytics workspaces for vanilla portfolio risk/hedging and same-expiry option strategy payoff/mark-to-market analysis.

**Architecture:** Thin `/analytics/portfolio` and `/analytics/strategies` routes compose focused client workspaces. Both consume framework-free portfolio and strategy modules that reuse the existing Black–Scholes authority, exact piecewise payoff algebra, deterministic scenario repricing and typed cross-route transfer; small shared React components provide position editing, market controls, risk vectors and numeric heatmaps.

**Tech Stack:** React 19, TypeScript 5.9 strict mode, vinext/Vite, native Canvas through the existing `LineChart`, semantic HTML, CSS custom properties, Node test runner with `tsx`, Cloudflare Workers.

**Spec:** `docs/superpowers/specs/2026-08-21-portfolio-strategy-analytics-design.md`

## Global Constraints

- The existing `src/quant/models/blackScholes.ts` remains the vanilla pricing and analytical-Greek authority.
- Rates and volatilities are decimal inputs; time is ACT/365-like; rates are continuously compounded.
- Vega is per one volatility point, theta per calendar day and rho per 100bp.
- `src/quant` must not import React, browser APIs, localization or route types.
- Routes own composition and metadata only; formulas and educational copy do not live in route files.
- No new dependencies, second pricing engine, heavy chart library or global state layer.
- Release 1 supports European calls, puts and underlying positions; terminal strategy metrics require one common expiry.
- Dynamic path hedging, transaction costs, multi-expiry strategies, cross-Greeks and 3D P&L are excluded from Release 1.
- Manual and synthetic inputs are labelled and are never presented as live market data or recommendations.
- English and Spanish UI coverage, keyboard operation, numeric chart alternatives and reduced motion are release requirements.
- Work only on `codex/analytics-portfolio-strategies`; merge, push and production deployment require separate confirmation.

## File Structure

### Quantitative core

- `src/quant/portfolio/types.ts` — public market, position, valuation, scenario and error contracts.
- `src/quant/portfolio/valuation.ts` — validation, signed scaling, position valuation and portfolio aggregation.
- `src/quant/portfolio/scenarios.ts` — full repricing, unit-aware Taylor P&L, spot-volatility grids and time profiles.
- `src/quant/portfolio/hedging.ts` — delta, delta-gamma and delta-vega hedge proposals.
- `src/quant/strategies/payoff.ts` — terminal leg accounting, exact linear intervals, breakevens and finite/unlimited extrema.
- `src/quant/strategies/presets.ts` — typed preset builders and purpose taxonomy.
- `src/quant/strategies/transfer.ts` — versioned serialization and validation without browser storage.

### Presentation and routes

- `src/components/analytics/MarketStateControls.tsx` — shared labelled market controls.
- `src/components/analytics/PositionEditor.tsx` — accessible editable position table/mobile groups.
- `src/components/analytics/RiskVector.tsx` — aggregate and before/after desk-unit Greek display.
- `src/components/analytics/PnlHeatmap.tsx` — semantic spot-volatility matrix and exact readout.
- `src/components/analytics/PortfolioGreeksLab.tsx` — portfolio state, hedging and scenarios.
- `src/components/analytics/StrategyPayoffLab.tsx` — presets, leg editing, payoff, settlement, MTM and transfer.
- `app/analytics/portfolio/page.tsx` and `app/analytics/strategies/page.tsx` — metadata and composition.
- `app/globals.css` — route-scoped layout and analytical tokens using existing semantic variables.

### Tests and documentation

- `tests/portfolio.test.ts` — valuation, scenarios and hedge invariants.
- `tests/strategies.test.ts` — payoff algebra, presets, parity and transfer contracts.
- `tests/analytics-components.test.tsx` — server-markup accessibility contracts.
- `tests/rendered-html.test.mjs` — production route and bilingual integration.
- `docs/analytics/portfolio-greeks-lab.md`, `strategy-payoff-lab.md`, `strategy-definitions.md` — public engineering contracts.

---

### Task 1: Position contracts, validation and portfolio valuation

**Files:**
- Create: `src/quant/portfolio/types.ts`
- Create: `src/quant/portfolio/valuation.ts`
- Create: `tests/portfolio.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `blackScholes(input: BlackScholesInput): OptionAnalytics` and `OptionType` from `src/quant/models/blackScholes.ts`.
- Produces: `PortfolioMarketState`, `PortfolioPosition`, `DeskGreeks`, `PositionValuation`, `PortfolioValuation`, `validateMarketState`, `validatePosition`, `positionWeight`, `valuePosition` and `valuePortfolio`.

- [ ] **Step 1: Write failing contract and reference-value tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { valuePortfolio, valuePosition } from "../src/quant/portfolio/valuation";
import type { OptionPosition, PortfolioMarketState, UnderlyingPosition } from "../src/quant/portfolio/types";

const market: PortfolioMarketState = { spot: 100, volatility: 0.2, rate: 0.05, dividend: 0, valuationTime: 0 };
const call: OptionPosition = { id: "c1", instrument: "option", optionType: "call", direction: "long", quantity: 2, multiplier: 100, strike: 100, maturity: 1, premium: 9 };

test("portfolio valuation preserves Black-Scholes desk units and position scale", () => {
  const result = valuePosition(call, market);
  assert.ok(Math.abs(result.modelValue - 2090.1150831) < 1e-6);
  assert.ok(Math.abs(result.greeks.delta - 127.3661172) < 1e-5);
  assert.ok(Math.abs(result.greeks.vega - 75.04807) < 1e-4);
  assert.ok(Math.abs(result.greeks.theta - -3.51453) < 1e-4);
  assert.ok(Math.abs(result.greeks.rho - 106.4649664) < 1e-4);
});

test("short direction and underlying delta aggregate with one signed scale", () => {
  const stock: UnderlyingPosition = { id: "s1", instrument: "underlying", direction: "short", quantity: 50, multiplier: 1, entryPrice: 98 };
  const result = valuePortfolio([call, stock], market);
  assert.equal(result.positions.length, 2);
  assert.ok(Math.abs(result.greeks.delta - (127.3661172 - 50)) < 1e-5);
});

test("validation rejects financial-domain errors but accepts negative rates and zero quantity", () => {
  assert.doesNotThrow(() => valuePortfolio([{ ...call, quantity: 0 }], { ...market, rate: -0.01 }));
  assert.throws(() => valuePortfolio([{ ...call, multiplier: 0 }], market), /multiplier/i);
  assert.throws(() => valuePortfolio([{ ...call, strike: Number.NaN }], market), /finite/i);
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `node --import tsx --test tests/portfolio.test.ts`

Expected: FAIL with module-not-found for `src/quant/portfolio/valuation.ts`.

- [ ] **Step 3: Define the public contracts**

```ts
export type PositionDirection = "long" | "short";
export interface PortfolioMarketState { spot: number; volatility: number; rate: number; dividend: number; valuationTime: number; }
export interface BasePosition { id: string; direction: PositionDirection; quantity: number; multiplier: number; }
export interface UnderlyingPosition extends BasePosition { instrument: "underlying"; entryPrice: number; }
export interface OptionPosition extends BasePosition { instrument: "option"; optionType: "call" | "put"; strike: number; maturity: number; premium: number; }
export type PortfolioPosition = UnderlyingPosition | OptionPosition;
export interface DeskGreeks { delta: number; gamma: number; vega: number; theta: number; rho: number; }
export interface PositionValuation { positionId: string; modelValue: number; entryValue: number; unrealizedPnl: number; greeks: DeskGreeks; expired: boolean; }
export interface PortfolioValuation { positions: PositionValuation[]; modelValue: number; entryValue: number; unrealizedPnl: number; greeks: DeskGreeks; }
```

- [ ] **Step 4: Implement boundary validation and valuation**

```ts
export function positionWeight(position: PortfolioPosition): number {
  return (position.direction === "long" ? 1 : -1) * position.quantity * position.multiplier;
}

export function valuePosition(position: PortfolioPosition, market: PortfolioMarketState): PositionValuation {
  validatePosition(position);
  validateMarketState(market);
  const weight = positionWeight(position);
  if (position.instrument === "underlying") {
    const modelValue = weight * market.spot;
    const entryValue = weight * position.entryPrice;
    return { positionId: position.id, modelValue, entryValue, unrealizedPnl: modelValue - entryValue, greeks: { delta: weight, gamma: 0, vega: 0, theta: 0, rho: 0 }, expired: false };
  }
  const time = Math.max(position.maturity - market.valuationTime, 0);
  const analytics = blackScholes({ spot: market.spot, strike: position.strike, time, rate: market.rate, dividend: market.dividend, volatility: market.volatility, type: position.optionType });
  const modelValue = weight * analytics.price;
  const entryValue = weight * position.premium;
  return { positionId: position.id, modelValue, entryValue, unrealizedPnl: modelValue - entryValue, greeks: scaleGreeks(analytics, weight), expired: time === 0 };
}
```

Use this internal unit conversion without changing the existing engine:

```ts
function scaleGreeks(analytics: OptionAnalytics, weight: number): DeskGreeks {
  return {
    delta: weight * analytics.delta,
    gamma: weight * analytics.gamma,
    vega: weight * analytics.vega,
    theta: weight * analytics.theta,
    rho: weight * analytics.rho,
  };
}
```

Implement `valuePortfolio` with one `reduce` over position valuations and zero-valued Greek accumulators. `validateMarketState` checks finite spot/volatility/rate/dividend/valuationTime, requires positive spot, non-negative volatility and valuationTime, and permits negative rates/dividends. `validatePosition` checks finite quantity/multiplier and instrument fields, requires quantity non-negative, multiplier positive, option strike positive, maturity non-negative and entry/premium non-negative. Do not clamp these inputs.

Add a symmetric finite-difference test using `hS=1e-3`, `hVol=1e-5`, `hRate=1e-5` and `hTime=1/365`; compare price derivatives with analytical delta/gamma and convert raw volatility/rate derivatives to the engine’s per-vol-point/per-100bp units before comparison.

- [ ] **Step 5: Register and run the focused tests**

Add `tests/portfolio.test.ts` to `test:quant` in `package.json`.

Run: `node --import tsx --test tests/portfolio.test.ts && npm run typecheck`

Expected: all portfolio tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the valuation core**

```bash
git add src/quant/portfolio/types.ts src/quant/portfolio/valuation.ts tests/portfolio.test.ts package.json
git commit -m "feat: add portfolio valuation core"
```

### Task 2: Exact terminal payoff algebra and bounds

**Files:**
- Create: `src/quant/strategies/payoff.ts`
- Create: `tests/strategies.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `PortfolioPosition`, `OptionPosition`, `positionWeight`.
- Produces: `terminalLegPayoff`, `terminalLegProfit`, `buildPayoffIntervals`, `analyzeTerminalStrategy`, `StrategyAnalysis`, `PayoffInterval` and `StrategyBound`.

- [ ] **Step 1: Write failing exact-payoff tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTerminalStrategy, terminalLegProfit } from "../src/quant/strategies/payoff";
import type { OptionPosition } from "../src/quant/portfolio/types";

const longCall: OptionPosition = { id: "lc", instrument: "option", optionType: "call", direction: "long", quantity: 1, multiplier: 100, strike: 100, maturity: 1, premium: 5 };

test("long call has exact breakeven, finite loss and unlimited gain", () => {
  assert.equal(terminalLegProfit(longCall, 80), -500);
  assert.equal(terminalLegProfit(longCall, 120), 1500);
  const analysis = analyzeTerminalStrategy([longCall]);
  assert.deepEqual(analysis.breakevens, [105]);
  assert.deepEqual(analysis.maxLoss, { kind: "finite", value: 500 });
  assert.deepEqual(analysis.maxGain, { kind: "unlimited" });
});

test("call butterfly resolves two roots and a finite right-tail plateau", () => {
  const legs: OptionPosition[] = [
    { ...longCall, id: "c90", strike: 90, premium: 12 },
    { ...longCall, id: "c100", direction: "short", quantity: 2, strike: 100, premium: 6 },
    { ...longCall, id: "c110", strike: 110, premium: 2 },
  ];
  const analysis = analyzeTerminalStrategy(legs);
  assert.deepEqual(analysis.breakevens, [92, 108]);
  assert.deepEqual(analysis.maxGain, { kind: "finite", value: 800 });
  assert.deepEqual(analysis.maxLoss, { kind: "finite", value: 200 });
});

test("mixed expiries fail instead of producing a misleading payoff summary", () => {
  assert.throws(() => analyzeTerminalStrategy([longCall, { ...longCall, id: "other", maturity: 2 }]), /common expiry/i);
});

test("same-strike call minus put reproduces the synthetic forward payoff", () => {
  const put = { ...longCall, id: "p", optionType: "put" as const, direction: "short" as const };
  for (const spot of [0, 75, 100, 140]) {
    const optionProfit = terminalLegProfit(longCall, spot) + terminalLegProfit(put, spot);
    const syntheticEntry = (longCall.premium - put.premium) * longCall.multiplier;
    assert.equal(optionProfit, longCall.multiplier * (spot - longCall.strike) - syntheticEntry);
  }
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `node --import tsx --test tests/strategies.test.ts`

Expected: FAIL with module-not-found for `src/quant/strategies/payoff.ts`.

- [ ] **Step 3: Implement exact leg accounting**

```ts
export function terminalLegPayoff(position: PortfolioPosition, terminalSpot: number): number {
  const weight = positionWeight(position);
  if (position.instrument === "underlying") return weight * terminalSpot;
  const intrinsic = position.optionType === "call"
    ? Math.max(terminalSpot - position.strike, 0)
    : Math.max(position.strike - terminalSpot, 0);
  return weight * intrinsic;
}

export function terminalLegProfit(position: PortfolioPosition, terminalSpot: number): number {
  const payoff = terminalLegPayoff(position, terminalSpot);
  const entry = position.instrument === "underlying" ? position.entryPrice : position.premium;
  return payoff - positionWeight(position) * entry;
}
```

Validate terminal spot as finite and non-negative. Keep payoff and profit as separate functions.

- [ ] **Step 4: Implement interval algebra and extrema**

Represent each interval as `{ lower: number; upper: number | null; slope: number; intercept: number; activeLegIds: string[] }`. Use unique sorted strikes plus zero as boundaries. Evaluate active branches at an interior probe, derive each leg’s slope/intercept analytically, sum them, solve `-intercept / slope` only when the root lies in the interval, merge roots within `1e-9`, and determine the right-tail bound from the final interval slope. Evaluate all finite endpoints for finite extrema. Return finite maximum loss as the non-negative magnitude `Math.max(0, -minimumProfit)`; interval values remain signed P&L. Accept an optional explicit strategy expiry for an underlying-only book and require every option maturity to match it.

```ts
export type StrategyBound = { kind: "finite"; value: number } | { kind: "unlimited" };
export interface StrategyAnalysis {
  expiry: number;
  netEntryCashflow: number;
  breakevens: number[];
  maxGain: StrategyBound;
  maxLoss: StrategyBound;
  intervals: PayoffInterval[];
}
```

- [ ] **Step 5: Add edge-case tests and run GREEN**

Add assertions for short calls, short puts, covered calls, protective puts, duplicate strikes, zero quantity, negative terminal spot rejection and an iron condor. Assert interval equations directly for at least one vertical spread.

Run: `node --import tsx --test tests/strategies.test.ts && npm run typecheck`

Expected: all strategy tests PASS and TypeScript exits 0.

- [ ] **Step 6: Register and commit the payoff engine**

Add `tests/strategies.test.ts` to `test:quant`, then:

```bash
git add src/quant/strategies/payoff.ts tests/strategies.test.ts package.json
git commit -m "feat: add exact strategy payoff algebra"
```

### Task 3: Deterministic strategy presets, taxonomy and transfer contract

**Files:**
- Create: `src/quant/strategies/presets.ts`
- Create: `src/quant/strategies/transfer.ts`
- Modify: `tests/strategies.test.ts`
- Create: `docs/analytics/strategy-definitions.md`

**Interfaces:**
- Consumes: portfolio position contracts and `analyzeTerminalStrategy`.
- Produces: `StrategyPurpose`, `StrategyPresetId`, `StrategyPreset`, `strategyPresets`, `buildStrategyPreset`, `STRATEGY_TRANSFER_KEY`, `STRATEGY_TRANSFER_VERSION`, `serializeStrategyTransfer`, `parseStrategyTransfer` and `StrategyTransferPayload`.

- [ ] **Step 1: Write failing preset and transfer tests**

```ts
test("every preset produces a valid common-expiry strategy", () => {
  for (const preset of strategyPresets) {
    const legs = buildStrategyPreset(preset.id, { spot: 100, expiry: 1, multiplier: 100 });
    assert.ok(legs.length > 0, preset.id);
    assert.equal(new Set(legs.filter((leg) => leg.instrument === "option").map((leg) => leg.maturity)).size, 1, preset.id);
    assert.doesNotThrow(() => analyzeTerminalStrategy(legs), preset.id);
  }
});

test("strategy transfer round-trips and rejects unknown versions", () => {
  const payload = { version: 1 as const, market: { spot: 100, volatility: 0.2, rate: 0.03, dividend: 0, valuationTime: 0 }, positions: buildStrategyPreset("covered-call", { spot: 100, expiry: 1, multiplier: 100 }) };
  assert.deepEqual(parseStrategyTransfer(serializeStrategyTransfer(payload)), payload);
  assert.equal(parseStrategyTransfer('{"version":2}'), null);
  assert.equal(parseStrategyTransfer("not-json"), null);
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `node --import tsx --test tests/strategies.test.ts`

Expected: FAIL because the preset and transfer modules do not exist.

- [ ] **Step 3: Implement typed preset builders**

Use strike offsets relative to spot only to create deterministic educational examples. Define all 22 approved presets with stable IDs and purpose groups:

```ts
export type StrategyPurpose = "directional" | "income" | "protection" | "vertical" | "volatility" | "bounded" | "skew";
export type StrategyPresetId = "long-call" | "short-call" | "long-put" | "short-put" | "synthetic-long" | "synthetic-short" | "covered-call" | "cash-secured-put" | "protective-put" | "collar" | "bull-call" | "bear-put" | "bear-call" | "bull-put" | "long-straddle" | "short-straddle" | "long-strangle" | "short-strangle" | "call-butterfly" | "iron-condor" | "long-risk-reversal" | "short-risk-reversal";

export interface PresetContext { spot: number; expiry: number; multiplier: number; }
export interface StrategyPreset { id: StrategyPresetId; purpose: StrategyPurpose; legCount: number; }
export function buildStrategyPreset(id: StrategyPresetId, context: PresetContext): PortfolioPosition[];
```

Premiums are deterministic inputs for examples, not market estimates. Builders must preserve documented strike order and unique position IDs.

- [ ] **Step 4: Implement strict versioned transfer parsing**

```ts
export const STRATEGY_TRANSFER_VERSION = 1 as const;
export const STRATEGY_TRANSFER_KEY = "tqb-strategy-transfer-v1";
export interface StrategyTransferPayload { version: typeof STRATEGY_TRANSFER_VERSION; market: PortfolioMarketState; positions: PortfolioPosition[]; }

export function serializeStrategyTransfer(payload: StrategyTransferPayload): string {
  validateTransferPayload(payload);
  return JSON.stringify(payload);
}

export function parseStrategyTransfer(serialized: string): StrategyTransferPayload | null {
  try {
    const value: unknown = JSON.parse(serialized);
    return isStrategyTransferPayload(value) ? value : null;
  } catch {
    return null;
  }
}
```

Use these internal guards so parsing never trusts an `as` cast:

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrategyTransferPayload(value: unknown): value is StrategyTransferPayload {
  if (!isRecord(value) || value.version !== STRATEGY_TRANSFER_VERSION || !isRecord(value.market) || !Array.isArray(value.positions)) return false;
  try {
    validateMarketState(value.market as unknown as PortfolioMarketState);
    for (const position of value.positions) validatePosition(position as PortfolioPosition);
    return true;
  } catch {
    return false;
  }
}

function validateTransferPayload(payload: StrategyTransferPayload): void {
  if (!isStrategyTransferPayload(payload)) throw new RangeError("Invalid strategy transfer payload");
}
```

`validateMarketState` and `validatePosition` inspect the runtime fields before reading their numeric values, so these calls do not make the cast a source of trust. The guard validates every nested finite number, enum value, ID and instrument-specific field.

- [ ] **Step 5: Document exact preset legs and validation**

Write `docs/analytics/strategy-definitions.md` with one table per purpose containing preset ID, signed legs, strike ordering, premium convention, expiry boundary and finite/unlimited expectation. Record that preset premiums are synthetic and that the editable leg book is authoritative after selection.

- [ ] **Step 6: Run focused tests and commit**

Run: `node --import tsx --test tests/strategies.test.ts && npm run typecheck`

```bash
git add src/quant/strategies/presets.ts src/quant/strategies/transfer.ts tests/strategies.test.ts docs/analytics/strategy-definitions.md
git commit -m "feat: add validated strategy definitions"
```

### Task 4: Scenario repricing, Taylor explanation and hedging

**Files:**
- Create: `src/quant/portfolio/scenarios.ts`
- Create: `src/quant/portfolio/hedging.ts`
- Modify: `tests/portfolio.test.ts`
- Create: `docs/analytics/portfolio-greeks-lab.md`

**Interfaces:**
- Consumes: `valuePortfolio`, portfolio contracts and existing Black–Scholes Greeks.
- Produces: `PortfolioScenario`, `PortfolioPnlExplain`, `explainPortfolioPnl`, `buildSpotVolPnlGrid`, `buildTimeDecayProfile`, `HedgeProposal`, `proposeDeltaHedge`, `proposeOptionHedge` and `applyHedgeProposal`.

- [ ] **Step 1: Write failing scenario and hedge tests**

```ts
test("base scenario has zero actual, approximation and residual P&L", () => {
  const explain = explainPortfolioPnl([call], market, { spotMove: 0, volatilityMove: 0, elapsedDays: 0, rateMove: 0 });
  assert.deepEqual(explain, { actual: 0, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0, approximate: 0, residual: 0 });
});

test("Taylor residual contracts under a shrinking joint shock", () => {
  const large = explainPortfolioPnl([call], market, { spotMove: 2, volatilityMove: 0.01, elapsedDays: 1, rateMove: 0.001 });
  const small = explainPortfolioPnl([call], market, { spotMove: 0.2, volatilityMove: 0.001, elapsedDays: 0.1, rateMove: 0.0001 });
  assert.ok(Math.abs(small.residual) < Math.abs(large.residual));
});

test("delta and delta-gamma proposals neutralize declared targets", () => {
  const delta = proposeDeltaHedge([call], market);
  assert.equal(delta.status, "ok");
  if (delta.status === "ok") assert.ok(Math.abs(delta.after.greeks.delta) < 1e-9);

  const hedgeOption = { ...call, id: "hedge", strike: 110, premium: 4 };
  const gamma = proposeOptionHedge([call], market, hedgeOption, "gamma");
  assert.equal(gamma.status, "ok");
  if (gamma.status === "ok") {
    assert.ok(Math.abs(gamma.after.greeks.delta) < 1e-8);
    assert.ok(Math.abs(gamma.after.greeks.gamma) < 1e-8);
    assert.ok(Number.isFinite(gamma.after.greeks.theta));
  }
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `node --import tsx --test tests/portfolio.test.ts`

Expected: FAIL because scenario and hedging modules do not exist.

- [ ] **Step 3: Implement unit-aware full repricing and Taylor buckets**

```ts
export interface PortfolioScenario { spotMove: number; volatilityMove: number; elapsedDays: number; rateMove: number; }
export interface PortfolioPnlExplain { actual: number; delta: number; gamma: number; vega: number; theta: number; rho: number; approximate: number; residual: number; }

export function explainPortfolioPnl(positions: readonly PortfolioPosition[], market: PortfolioMarketState, scenario: PortfolioScenario): PortfolioPnlExplain {
  const base = valuePortfolio(positions, market);
  const shocked = valuePortfolio(positions, {
    ...market,
    spot: market.spot + scenario.spotMove,
    volatility: market.volatility + scenario.volatilityMove,
    rate: market.rate + scenario.rateMove,
    valuationTime: market.valuationTime + scenario.elapsedDays / 365,
  });
  const delta = base.greeks.delta * scenario.spotMove;
  const gamma = 0.5 * base.greeks.gamma * scenario.spotMove ** 2;
  const vega = base.greeks.vega * (scenario.volatilityMove / 0.01);
  const theta = base.greeks.theta * scenario.elapsedDays;
  const rho = base.greeks.rho * (scenario.rateMove / 0.01);
  const approximate = delta + gamma + vega + theta + rho;
  const actual = shocked.modelValue - base.modelValue;
  return { actual, delta, gamma, vega, theta, rho, approximate, residual: actual - approximate };
}
```

Reject shocked spot or volatility outside their financial domains. Build deterministic grids from explicit spot/vol axes and return the base-cell location plus values.

- [ ] **Step 4: Implement hedge proposals as ordinary positions**

```ts
export type OptionHedgeTarget = "gamma" | "vega";
export type HedgeProposal =
  | { status: "ok"; positions: PortfolioPosition[]; after: PortfolioValuation; tickets: PortfolioPosition[] }
  | { status: "unavailable"; reason: "near-zero-gamma" | "near-zero-vega" | "invalid-hedge" };

export function proposeOptionHedge(book: readonly PortfolioPosition[], market: PortfolioMarketState, hedgeOption: OptionPosition, target: OptionHedgeTarget): HedgeProposal {
  const before = valuePortfolio(book, market);
  const one = valuePosition({ ...hedgeOption, direction: "long", quantity: 1 }, market);
  const hedgeGreek = one.greeks[target];
  if (!Number.isFinite(hedgeGreek) || Math.abs(hedgeGreek) < 1e-10) return { status: "unavailable", reason: target === "gamma" ? "near-zero-gamma" : "near-zero-vega" };
  const signedOptionQuantity = -before.greeks[target] / hedgeGreek;
  const optionTicket: OptionPosition = { ...hedgeOption, id: `${hedgeOption.id}-ticket`, direction: signedOptionQuantity >= 0 ? "long" : "short", quantity: Math.abs(signedOptionQuantity) };
  const afterOption = valuePortfolio([...book, optionTicket], market);
  const signedStockQuantity = -afterOption.greeks.delta;
  const stockTicket: UnderlyingPosition = { id: `${hedgeOption.id}-delta-ticket`, instrument: "underlying", direction: signedStockQuantity >= 0 ? "long" : "short", quantity: Math.abs(signedStockQuantity), multiplier: 1, entryPrice: market.spot };
  const positions = [...book, optionTicket, stockTicket];
  return { status: "ok", positions, tickets: [optionTicket, stockTicket], after: valuePortfolio(positions, market) };
}
```

Preserve fractional hedge quantities and display them as estimates. `applyHedgeProposal` returns the proposal’s positions without hidden mutation.

- [ ] **Step 5: Document model and run GREEN**

Write `docs/analytics/portfolio-greeks-lab.md` with position scale, desk units, P&L formula/conversions, hedge equations/tolerance, scenario semantics and model limitations.

Run: `node --import tsx --test tests/portfolio.test.ts && npm run typecheck`

- [ ] **Step 6: Commit scenario and hedge logic**

```bash
git add src/quant/portfolio/scenarios.ts src/quant/portfolio/hedging.ts tests/portfolio.test.ts docs/analytics/portfolio-greeks-lab.md
git commit -m "feat: add portfolio scenarios and hedges"
```

### Task 5: Shared accessible Analytics controls

**Files:**
- Create: `src/components/analytics/MarketStateControls.tsx`
- Create: `src/components/analytics/PositionEditor.tsx`
- Create: `src/components/analytics/RiskVector.tsx`
- Create: `src/components/analytics/PnlHeatmap.tsx`
- Create: `tests/analytics-components.test.tsx`
- Modify: `package.json`
- Modify: `src/i18n/index.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: portfolio contracts, scenario-grid values, `useI18n` and existing semantic CSS tokens.
- Produces: `MarketStateControls`, `PositionEditor`, `RiskVector` and `PnlHeatmap` with labelled native controls and callback-only state changes.

- [ ] **Step 1: Write failing server-markup accessibility tests**

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PositionEditor } from "../src/components/analytics/PositionEditor";
import { RiskVector } from "../src/components/analytics/RiskVector";
import { I18nProvider } from "../src/i18n";
import type { OptionPosition } from "../src/quant/portfolio/types";

const call: OptionPosition = { id: "c1", instrument: "option", optionType: "call", direction: "long", quantity: 1, multiplier: 100, strike: 100, maturity: 1, premium: 8 };

test("position editor exposes labelled fields and row actions", () => {
  const html = renderToStaticMarkup(<I18nProvider initialLocale="en"><PositionEditor positions={[call]} onChange={() => undefined} onRemove={() => undefined} /></I18nProvider>);
  assert.match(html, /<table[^>]+aria-label="Portfolio positions"/i);
  for (const name of ["Direction", "Quantity", "Multiplier", "Strike", "Maturity", "Premium", "Remove position"]) assert.match(html, new RegExp(`aria-label="[^"]*${name}`, "i"));
});

test("risk vector includes explicit desk units", () => {
  const html = renderToStaticMarkup(<I18nProvider initialLocale="en"><RiskVector label="Aggregate risk" greeks={{ delta: 1, gamma: 2, vega: 3, theta: 4, rho: 5 }} /></I18nProvider>);
  assert.match(html, /per 1 spot unit/i);
  assert.match(html, /per 1 volatility point/i);
  assert.match(html, /per calendar day/i);
  assert.match(html, /per 100bp/i);
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `node --import tsx --test tests/analytics-components.test.tsx`

Expected: FAIL because the shared Analytics components do not exist.

- [ ] **Step 3: Implement controlled semantic components**

`MarketStateControls` accepts `{ value: PortfolioMarketState; onChange(next): void; showValuationTime?: boolean }`. `PositionEditor` accepts `{ positions; onChange(id, patch); onRemove(id); selectedId?; onSelect?(id) }`. It uses a semantic table on desktop and the same labelled fields in CSS-reflowed rows on mobile; do not render a second hidden form.

`RiskVector` accepts current and optional comparison Greeks and formats finite differences. `PnlHeatmap` renders each cell as a `<button>` with accessible name `Spot 95, volatility 20%, P&L -12.34`, `aria-pressed` for the selected cell, and an expandable numeric table.

- [ ] **Step 4: Add centralized bilingual UI keys**

Add aligned `analytics.portfolio.*`, `analytics.strategy.*`, `analytics.position.*`, `analytics.risk.*`, `analytics.scenario.*` and `analytics.transfer.*` keys to both dictionaries. Use `t(key)` inside components; quant IDs and mathematical notation remain language-neutral.

- [ ] **Step 5: Add route-scoped responsive styles**

Create `.portfolio-lab`, `.strategy-lab` and `.analytics-position-table` scopes. Reuse `--paper`, `--surface-elevated`, `--ink`, `--muted`, `--border`, `--accent`, `--positive`, `--negative`, `--focus-ring` and `--chart-*`. At `max-width: 768px`, use CSS grid row reflow and internal horizontal scrolling for numeric matrices; do not introduce raw color values when a semantic token exists.

- [ ] **Step 6: Run focused tests and commit**

Register `tests/analytics-components.test.tsx` in `test:quant`.

Run: `node --import tsx --test tests/analytics-components.test.tsx && npm run i18n:audit && npm run typecheck && npm run lint`

```bash
git add src/components/analytics src/i18n/index.tsx app/globals.css tests/analytics-components.test.tsx package.json
git commit -m "feat: add shared portfolio analytics controls"
```

### Task 6: Portfolio, Greeks and Hedging workspace

**Files:**
- Create: `src/components/analytics/PortfolioGreeksLab.tsx`
- Create: `app/analytics/portfolio/page.tsx`
- Modify: `tests/analytics-components.test.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: Tasks 1, 4 and 5; `LineChart`; `useQuantBateman`; `STRATEGY_TRANSFER_KEY` and `parseStrategyTransfer` from Task 3.
- Produces: a complete `/analytics/portfolio` workspace and consumes a validated Strategy transfer once after hydration.

- [ ] **Step 1: Write failing workspace and route contracts**

Add a server-markup test asserting the Portfolio component renders an editable position region, aggregate risk, hedge selector, scenario inputs, P&L decomposition, heatmap and model-boundary disclosure. Extend `tests/rendered-html.test.mjs`:

```js
test("portfolio analytics renders a deterministic risk and hedge workspace", async () => {
  const response = await render("/analytics/portfolio");
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const marker of ["PORTFOLIO, GREEKS & HEDGING", "Portfolio positions", "Aggregate risk", "Actual repricing", "Taylor approximation", "Spot × volatility P&L"]) assert.match(html, new RegExp(marker, "i"));
  assert.match(html, /SYNTHETIC.*EDUCATIONAL/i);
});
```

- [ ] **Step 2: Build and run the rendered test to verify RED**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL for `/analytics/portfolio` with a missing route or missing markers.

- [ ] **Step 3: Implement one linked state and position workflow**

Initialize a small call/put/underlying book. Keep `positions`, `market`, `selectedPositionId`, `hedgeTarget`, `scenario` and selected heatmap cell as component-local state. Derive valuation, scenario explanation, heatmap and time profile with `useMemo`; never cache duplicate calculated values in state.

Add buttons for calls, puts and underlying positions; use stable locally generated IDs. Changing one position must update the table, risk vector, scenario chart and P&L matrix from the same arrays.

- [ ] **Step 4: Implement hedge preview and apply semantics**

Preview calls `proposeDeltaHedge` or `proposeOptionHedge`. Render proposed tickets plus all before/after Greeks. Disable **Apply hedge** for unavailable results and show the typed reason. Applying replaces the book with `proposal.positions`; cancellation leaves it unchanged.

- [ ] **Step 5: Implement scenario views and assistant context**

Render P&L buckets as exact readouts, time decay with `LineChart`, and spot-volatility with `PnlHeatmap`. Write a compact `tqb-lab-context` object after changes and call:

```ts
setPageContext({ section: "portfolio analytics", instrument: "European options", action: "risk and hedging" });
```

The serialized context contains only model name, position count, aggregate Greeks, hedge target and scenario—not the full editable book.

- [ ] **Step 6: Implement safe Strategy transfer consumption**

On hydration, if `from=strategy`, read the single documented session key, parse it, remove only that key after a successful parse and initialize positions/market. An invalid value preserves defaults and displays the localized non-blocking transfer error.

- [ ] **Step 7: Add the thin route and run GREEN**

```tsx
import { AppShell } from "@/src/components/AppShell";
import { PortfolioGreeksLab } from "@/src/components/analytics/PortfolioGreeksLab";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Portfolio, Greeks & Hedging", description: "Aggregate vanilla option risk, construct hedges and compare local P&L with full repricing." }, es: { title: "Cartera, griegas y cobertura", description: "Agrega riesgo de opciones vanilla, construye coberturas y compara P&L local con revaloración completa." } });
export default function PortfolioAnalyticsPage() { return <AppShell><PortfolioGreeksLab /></AppShell>; }
```

Run: `npm run typecheck && npm run build && node --test tests/rendered-html.test.mjs`

- [ ] **Step 8: Commit the Portfolio workspace**

```bash
git add src/components/analytics/PortfolioGreeksLab.tsx app/analytics/portfolio/page.tsx tests/analytics-components.test.tsx tests/rendered-html.test.mjs
git commit -m "feat: add portfolio Greeks and hedging lab"
```

### Task 7: Options Strategy and Payoff workspace

**Files:**
- Create: `src/components/analytics/StrategyPayoffLab.tsx`
- Create: `app/analytics/strategies/page.tsx`
- Modify: `tests/analytics-components.test.tsx`
- Modify: `tests/rendered-html.test.mjs`
- Create: `docs/analytics/strategy-payoff-lab.md`

**Interfaces:**
- Consumes: Tasks 1–5, `LineChart`, strategy transfer serialization and `useQuantBateman`.
- Produces: a complete `/analytics/strategies` workspace and the Strategy-to-Portfolio action.

- [ ] **Step 1: Write failing workspace and route contracts**

Assert server markup includes taxonomy, preset controls, editable leg table, distinct payoff/profit/MTM tabs, expected zone, exact strategy metrics, settlement inspector, piecewise algebra, scenario Greeks and transfer action. Add:

```js
test("strategy analytics renders exact payoff, settlement and transfer controls", async () => {
  const response = await render("/analytics/strategies");
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const marker of ["OPTIONS STRATEGY & PAYOFF", "Strategy legs", "EXPIRY PROFIT", "Breakeven", "Settlement by leg", "Piecewise payoff", "Open in Portfolio Lab"]) assert.match(html, new RegExp(marker, "i"));
  assert.match(html, /single expiry/i);
});
```

- [ ] **Step 2: Build and run the rendered test to verify RED**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL for `/analytics/strategies`.

- [ ] **Step 3: Implement preset and arbitrary-leg editing**

Keep selected purpose, selected preset, positions, market, chart view, expected floor/ceiling and settlement spot in local state. Selecting a preset replaces the editable book only after its typed builder succeeds. Subsequent edits clear only the selected-preset badge; they do not force the book back to a preset.

Use `PositionEditor`, but hide irrelevant underlying strike/maturity fields through the instrument union rather than disabled fake values. Prevent mixed-expiry terminal analysis with a visible validation state while leaving the position editor usable.

- [ ] **Step 4: Implement linked payoff, profit and MTM views**

Construct a deterministic terminal spot axis around zero, spot, strikes, expected zone and breakevens. Use `LineChart` with aggregate plus optional leg series. Profit calls `terminalLegProfit`; payoff calls `terminalLegPayoff`; MTM calls `valuePortfolio` at each spot using the current valuation time. Labels and descriptions explicitly identify the active view and units.

- [ ] **Step 5: Implement exact metrics, settlement and algebra**

Render net debit/credit, breakevens, finite/unlimited maximum gain/loss and direction/volatility interpretation from quant outputs. The settlement slider displays per-leg intrinsic/payoff, signed entry cash flow and profit. Render every `PayoffInterval` with its domain, active legs and `aS+b` equation; highlight the interval containing settlement spot.

- [ ] **Step 6: Implement aggregate Greeks and mark-to-market scenarios**

Render aggregate Delta/Gamma/Vega/Theta/Rho at the current state and a compact time/volatility scenario comparison using `valuePortfolio` under explicit shocked states. Time shocks update valuation time; volatility shocks use decimal engine inputs but display percentage-point changes. Keep these mark-to-market scenarios separate from terminal payoff classification.

- [ ] **Step 7: Implement educational view matching and one-leg comparison**

Map direction/volatility inputs to candidate preset IDs in presentation-only copy. Show premium, capped-tail and aggregate-Greek trade-offs; do not label any candidate recommended. Calculate expected-zone profit at floor, midpoint and ceiling and warn when it crosses a breakeven or lies entirely on a zero-slope interval.

The **Compare one leg** action captures the current book and arms exactly one subsequent row edit. After that edit, show a compact before/after payoff series and changed risk vector, then disarm capture. **Clear comparison** removes the snapshot without altering the current book; preset selection and cross-route transfer also clear it.

- [ ] **Step 8: Implement transfer and assistant context**

On **Open in Portfolio Lab**, create a version-1 payload, write it to the single session key, then navigate to `/analytics/portfolio?from=strategy`. Write only a compact strategy summary to `tqb-lab-context` and set page context to strategy analysis.

- [ ] **Step 9: Add route, documentation and run GREEN**

Create the localized thin route following Task 6. Write `docs/analytics/strategy-payoff-lab.md` covering payoff/profit distinction, premium signs, exact interval method, MTM, view classification, single-expiry boundary and transfer behavior.

Run: `node --import tsx --test tests/strategies.test.ts tests/analytics-components.test.tsx && npm run typecheck && npm run build && node --test tests/rendered-html.test.mjs`

- [ ] **Step 10: Commit the Strategy workspace**

```bash
git add src/components/analytics/StrategyPayoffLab.tsx app/analytics/strategies/page.tsx tests/analytics-components.test.tsx tests/rendered-html.test.mjs docs/analytics/strategy-payoff-lab.md
git commit -m "feat: add options strategy payoff lab"
```

### Task 8: Discovery, search, localization and cross-links

**Files:**
- Modify: `src/components/AnalyticsHub.tsx`
- Modify: `src/content/search.ts`
- Modify: `src/i18n/index.tsx`
- Modify: `tests/search.test.ts`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `docs/QUANT_VISUALIZATION.md`

**Interfaces:**
- Consumes: the two canonical routes and existing core-search item contract.
- Produces: unique Analytics hub cards/search items, complete EN/ES chrome and documented payoff/risk visualization grammar.

- [ ] **Step 1: Write failing discovery and localization tests**

```ts
test("core search indexes portfolio and strategy analytics once", () => {
  const items = createCoreSearchItems("en");
  assert.equal(items.filter((item) => item.href === "/analytics/portfolio").length, 1);
  assert.equal(items.filter((item) => item.href === "/analytics/strategies").length, 1);
  assert.equal(searchPlatformItems(items, "delta gamma hedge", { limit: 5 })[0]?.href, "/analytics/portfolio");
  assert.equal(searchPlatformItems(items, "iron condor payoff", { limit: 5 })[0]?.href, "/analytics/strategies");
});
```

Add rendered assertions that `/analytics` contains both localized routes in English and Spanish.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --import tsx --test tests/search.test.ts && npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because hub and search entries are absent.

- [ ] **Step 3: Add hub and search discovery**

Add Portfolio as Analytics tool `05` and Strategy as `06`; preserve current four tools and route ordering. Add two `coreTools` records with bilingual titles/descriptions and keywords covering portfolio, Greeks, hedging, payoff, strategies, spreads, straddles, collars and breakevens. Do not add the full quant payload to the client search index.

- [ ] **Step 4: Complete bilingual audit and cross-links**

Render all visible UI text through centralized keys. Verify Academy links use the exact four canonical routes in the specification. Add concise assumptions/references links inside both labs; do not modify Academy content.

- [ ] **Step 5: Update visualization contract and run GREEN**

Document aggregate/leg series, zero-P&L and breakeven references, expected zone, scenario heatmap, financial units and numeric alternatives in `docs/QUANT_VISUALIZATION.md`.

Run: `node --import tsx --test tests/search.test.ts && npm run i18n:audit && npm run typecheck && npm run lint && npm run build && node --test tests/rendered-html.test.mjs`

- [ ] **Step 6: Commit product integration**

```bash
git add src/components/AnalyticsHub.tsx src/content/search.ts src/i18n/index.tsx tests/search.test.ts tests/rendered-html.test.mjs docs/QUANT_VISUALIZATION.md
git commit -m "feat: integrate portfolio analytics discovery"
```

### Task 9: Browser QA, edge-case hardening and release validation

**Files:**
- Modify only files implicated by reproduced defects from this task.
- Modify: `docs/qa/interactive-visualizations.md`

**Interfaces:**
- Consumes: completed Release 1 workspaces and all prior tests.
- Produces: verified production-ready branch with a recorded QA matrix and no known release-blocking defects.

- [ ] **Step 1: Run the complete automated baseline**

Run sequentially:

```bash
npm run typecheck
npm run lint
npm run i18n:audit
npm test
npm run build
npm run cloudflare:preflight
git diff --check
```

Expected: every command exits 0. Treat any sign, unit, time-scaling, payoff-bound or transfer failure as a release blocker.

- [ ] **Step 2: Start the production-like local application**

Run: `npm run dev`

Use the in-app browser against the local URL. Record console errors, document width, control response and exact readouts before changing any code.

- [ ] **Step 3: Exercise the quantitative interaction matrix**

Portfolio:

- add long/short call, put and underlying;
- change quantity and multiplier and verify proportional value/Greeks;
- preview and apply delta, delta-gamma and delta-vega hedges;
- reproduce an unavailable near-zero hedge Greek;
- compare actual and Taylor P&L as shocks shrink;
- inspect every heatmap cell by pointer and keyboard;
- advance time through expiry.

Strategy:

- load every preset and confirm common expiry;
- edit/add/remove each instrument type;
- switch payoff/profit/MTM without conflation;
- verify long-call, covered-call, butterfly and iron-condor metrics against tests;
- inspect settlement across every strike interval;
- create duplicate strikes and mixed expiries;
- exercise expected-zone mismatch and one-leg comparison;
- transfer an edited book to Portfolio and compare all legs.

- [ ] **Step 4: Exercise the presentation matrix**

For `/analytics`, `/analytics/portfolio` and `/analytics/strategies`, test 375×812, 768×900, 1280×900 and 1440×1000 in EN/ES and dark/light themes. Confirm no document-level horizontal overflow, internal matrix/table scrolling, 44px touch targets, visible focus, keyboard editing, reduced-motion behavior, model/demo labels and numeric alternatives.

- [ ] **Step 5: Fix each reproduced defect test-first**

For every defect, add the smallest failing pure, component or rendered regression before the correction. Run its focused command to capture RED, make the scoped fix with `apply_patch`, then rerun GREEN. Commit the exact regression test and corrected source together before moving to the next defect. Do not refactor unrelated Labs or Academy components during hardening.

- [ ] **Step 6: Update the QA evidence**

Append a dated Portfolio and Strategy section to `docs/qa/interactive-visualizations.md` with routes, viewports, locales, themes, controls exercised, quantitative references, accessibility checks, console state and declared Release 2 boundaries.

- [ ] **Step 7: Rerun final validation and inspect the branch**

```bash
npm run typecheck
npm run lint
npm run i18n:audit
npm test
npm run build
npm run cloudflare:preflight
git diff --check
git status --short --branch
git log --oneline origin/main..HEAD
```

Expected: all gates PASS; status contains only intentional QA documentation or fixes ready to commit.

- [ ] **Step 8: Commit hardening and QA**

```bash
git add docs/qa/interactive-visualizations.md
git commit -m "test: validate portfolio strategy analytics"
```

Each defect correction was committed in Step 5 with its exact files. Do not use broad staging when unrelated changes exist.

### Task 10: Independent review and release handoff

**Files:**
- Review: `origin/main..HEAD`
- Modify only files required by accepted review findings.

**Interfaces:**
- Consumes: the complete feature branch and validation evidence.
- Produces: a reviewed branch ready for an explicit merge/push/deploy decision.

- [ ] **Step 1: Request independent quantitative and product review**

The review must inspect exact payoff intervals/bounds, premium signs, multiplier scaling, Greek units, Taylor conversions, hedge equations/tolerances, same-expiry enforcement, transfer validation, bilingual UX, accessibility and Release 1 scope. Reviewers must classify Critical, Important and Minor findings with file/line evidence.

- [ ] **Step 2: Resolve accepted findings with RED/GREEN evidence**

For every Critical or Important finding, reproduce it with a focused failing test, make the smallest correction, rerun the focused test and then the complete validation sequence from Task 9. Record any rejected finding with concrete mathematical or architectural evidence.

- [ ] **Step 3: Verify final branch state**

Run:

```bash
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

Expected: clean feature branch, only scoped Analytics commits, no generated artifacts, secrets, licensed data or unrelated changes.

- [ ] **Step 4: Stop at the release boundary**

Report files, quantitative coverage, UI behavior, validation commands, commit list and remaining Release 2 extensions. Ask for explicit authorization before merging to `main`, pushing GitHub or triggering Cloudflare production.
