# Market-Making Hedging Lab implementation plan

> **Execution rule:** implement every quantitative change test-first. Do not merge, push or deploy without separate user confirmation.

**Goal:** Add a rigorous guided dealer-book and discrete-hedging simulator to `/lab?lab=market-making`, reusing the platform's existing Black–Scholes and portfolio authority.

**Spec:** `docs/superpowers/specs/2026-08-22-market-making-hedging-lab-design.md`

## Constraints

- No new dependencies.
- `src/quant` remains framework-free.
- Rates/volatility are decimal inputs; time is ACT/365-like.
- Vega is per vol point, theta per day, rho per 100bp.
- Client direction converts to dealer direction exactly once.
- All market data is deterministic, synthetic and labelled.
- No workbook macros or external add-ins execute at build or runtime.
- Preserve existing Lab behavior and routes.
- English and Spanish are release requirements.
- Every canvas or colored matrix has a numeric/semantic alternative.

## Task 1 — Market-making contracts, surface and dealer flow

**Create:**

- `src/quant/market-making/types.ts`
- `src/quant/market-making/surface.ts`
- `src/quant/market-making/book.ts`
- `tests/market-making.test.ts`

**Modify:** `package.json`

1. Write RED tests for surface ATM/skew/term invariants, dealer-side sign conversion, input validation, per-underlying valuation and aggregation.
2. Add typed market, trade and book contracts.
3. Implement the educational surface with an explicit volatility floor.
4. Adapt market-maker trades to existing `PortfolioPosition` valuation without copying pricing logic.
5. Aggregate risk per underlying and retain labelled whole-book summaries.
6. Register the test and run focused tests plus typecheck.

## Task 2 — Costs, hedge tickets and snapshot scenarios

**Create:**

- `src/quant/market-making/hedging.ts`
- `src/quant/market-making/scenarios.ts`

**Modify:**

- `tests/market-making.test.ts`

1. Write RED tests for delta hedge, rounded gamma/vega hedge, post-rounding delta repair, cost monotonicity and unavailable target Greeks.
2. Implement stock and listed-option hedge previews with explicit costs.
3. Write RED tests for snapshot immutability, zero-shock identity, full repricing and shrinking-shock residual.
4. Implement saved-state shocks for spot, surface level/skew, rates and time.
5. Reuse platform desk units in local P&L attribution.
6. Run focused tests plus typecheck.

## Task 3 — Higher-order diagnostics and replay ledger

**Create:**

- `src/quant/market-making/diagnostics.ts`
- `src/quant/market-making/replay.ts`
- `src/quant/market-making/missions.ts`

**Modify:**

- `tests/market-making.test.ts`

1. Write RED tests for finite higher-order values and unit-consistent vanna/volga/charm/color/veta.
2. Implement central/one-sided finite differences using existing value/Greek functions.
3. Write RED tests for deterministic replay, cash financing, hedge cost, wealth reconciliation and cost monotonicity.
4. Implement deterministic events, an auditable ledger and manual/benchmark actions.
5. Write RED tests for mission pass/fail predicates.
6. Implement mission definitions and evaluation without UI state.
7. Run focused tests, existing portfolio tests and typecheck.

## Task 4 — Market-making UI and semantic components

**Create:**

- `src/components/labs/MarketMakingLab.tsx`
- `src/components/labs/MarketMakingBlotter.tsx`
- `src/components/labs/MarketMakingRisk.tsx`
- `src/components/labs/MarketMakingReplay.tsx`

**Modify:**

- `tests/analytics-components.test.tsx`
- `src/components/labs/Labs.tsx`
- `src/i18n/index.tsx`

1. Add failing server-markup tests for the six-stage workflow, synthetic-data disclosure, dealer direction, costs, exact/local P&L and numeric alternatives.
2. Implement one client-owned state graph in `MarketMakingLab`.
3. Keep components semantic and narrowly scoped; do not introduce a generic lab framework.
4. Add the sixth Lab tab with complete tab IDs, panels and keyboard navigation.
5. Author all new UI copy in EN/ES.
6. Run component tests, i18n audit, typecheck and lint.

## Task 5 — Design system, discovery and Academy bridge

**Modify:**

- `app/globals.css`
- `src/components/AnalyticsHub.tsx`
- `src/content/search.ts`
- the Hedging & P&L Academy formula/lab linkage
- `tests/search.test.ts`
- `tests/academy-content.test.ts`
- `tests/rendered-html.test.mjs`
- `app/lab/page.tsx`

1. Write failing discovery/route tests for the new canonical query route in EN/ES.
2. Add the Analytics card and search record without importing the heavy component into search.
3. Point the Hedging & P&L lesson's relevant formula/action to `/lab?lab=market-making`.
4. Extend metadata to mention the dealer-book lab.
5. Add route-scoped warm-editorial/dark-analytical styles and responsive table containment.
6. Use existing analytical tokens; add only missing semantic aliases.
7. Run focused discovery, content and rendered-route tests.

## Task 6 — Documentation and validation

**Create:**

- `docs/analytics/market-making-hedging-lab.md`

**Modify:**

- `docs/QUANT_VISUALIZATION.md`
- `docs/qa/interactive-visualizations.md`

1. Document equations, units, sign conventions, replay accounting, source boundary and limitations.
2. Run the Impeccable mechanical detector once over changed UI/CSS targets and address relevant findings.
3. Run `npm run typecheck`.
4. Run `npm run lint`.
5. Run `npm run i18n:audit`.
6. Run `npm run build`.
7. Run `npm test` against the fresh build.
8. Browser-check `/lab?lab=market-making` at 375, 768, 1280 and 1440px in EN/ES, light/dark and reduced-motion modes.
9. Exercise one complete mission path and verify no console errors or page overflow.
10. Review the complete diff, commit the feature branch and report the commit hash.

## Release gate

After all validation passes, stop on `codex/market-making-hedging`. Request explicit confirmation before:

- merging into `main`;
- pushing to GitHub;
- deploying to Cloudflare production.
