# Fixed Income Spreads & Curve Analytics — Implementation Plan

**Goal:** ship one validated, bilingual fixed-income analytics lab on the shared quant, curve, chart, guidance and design infrastructure.

**Architecture:** framework-free pricing/risk modules produce immutable result objects. A single client workbench owns UI state and selects one visualization per mode. Existing Analytics guidance supplies scenarios, assistant context and Ask handoff. No callable/OAS or CDS numeric engine ships without validated model infrastructure.

**Tech:** TypeScript strict, React 19, native HTML/Canvas/SVG where already used, KaTeX, Node test runner, vinext/Vite/Cloudflare Workers.

## Task 1 — Quant contracts and independent fixtures

**Files:** create `tests/fixed-income.test.ts`; update `package.json`.

- Add failing tests with hand-derived fixtures for regular cash flows, accrued/dirty price, periodic YTM inversion, zero-curve price and clean/dirty invariants.
- Add failing tests for zero-spread benchmark parity, Z-spread inversion, spread widening lowering price, G/I benchmark dependence and solver failure diagnostics.
- Add failing tests for benchmark DV01, CS01/spread duration, KRD aggregation tolerance, rate/spread grid full repricing, ASW DCF identity, curve shocks, and carry/rolldown reconciliation.
- Run the focused file and capture RED before production implementation.

## Task 2 — Shared numerical, curve and fixed-income engine

**Files:** create `src/quant/numerics/rootFinding.ts`, `src/quant/curves/scenarios.ts`, `src/quant/fixed-income/types.ts`, `bonds.ts`, `spreads.ts`, `risk.ts`, `carry.ts`.

- Implement a bounded Brent/bisection-style solver with convergence metadata and explicit bracket/failure errors.
- Add shared parallel, steepener, flattener and butterfly shocks over curve nodes.
- Implement schedule generation, accrued interest, discounted cash-flow pricing, periodic YTM, duration, convexity and price anatomy.
- Implement G/I/Z spread, Z-spread solve, par-swap and discounted ASW calculations.
- Implement full-repricing DV01, CS01, spread duration, DTS, KRD and rate × spread grid.
- Implement conditional carry/rolldown with coupon, funding, curve-roll and spread-roll components.
- Make focused tests GREEN, then refactor names/units without changing behavior.

## Task 3 — Guided scenarios and assistant state

**Files:** update `src/analytics/guidance/types.ts`, `context.ts`, `scenarios/index.ts`, `insights.ts`, `AnalyticsGuide.tsx`; create `scenarios/fixedIncome.ts`; update guidance tests.

- Register `fixed-income` as a canonical lab ID.
- Add curated Government, corporate G→Z, benchmark-change, spread-widening, rate-vs-credit, steepener, asset-swap and carry/rolldown scenarios.
- Add domain metric labels and state-dependent authored insights.
- Reuse `useAnalyticsGuidance`; expose selected bond, benchmark, spread measure, curve scenario and risk metrics to Ask.
- Prove scenario registry and serialization with failing-then-green tests.

## Task 4 — Cohesive workbench

**Files:** create `src/components/analytics/FixedIncomeLab.tsx`, `FixedIncomeHeatmap.tsx`, `FixedIncomeCashflows.tsx`, `FixedIncomeSpreadMap.tsx`; add `app/analytics/fixed-income/page.tsx`; update component/SSR tests.

- Build five linked modes with one shared state and one primary visual each.
- Bond mode: validated inputs, price anatomy, cash-flow timeline and YTM/curve distinction.
- Spreads mode: benchmark selector, G/I/Z/ASW metrics, curve overlays, meaningful spread decision map and convention caveats.
- Risk mode: flagship semantic heatmap, exact P&L decomposition, DV01/CS01/DTS and KRD.
- Curve/RV mode: before/after curve, explicit 2s10s and fly convention, DV01-neutral ratio, comparable bonds.
- Carry mode: unchanged-curve conditional decomposition and explicit assumptions.
- Include quality-gate panels for OAS/CDS instead of fake analytics.
- Use existing `AnalyticsGuide`, `LineChart`, formula renderer, assistant and semantic surfaces.

## Task 5 — Product integration and bilingual content

**Files:** update `AnalyticsHub.tsx`, `src/content/search.ts`, relevant Academy formula links if one authoritative existing formula benefits, `src/i18n/index.tsx`, CSS, search/content/render tests.

- Add Analytics discovery/search entry and update journey without inventing a separate application.
- Add subtle links to zero/forward curves, bootstrapping, swaps, curve risk and rate optionality Academy lessons.
- Add EN/ES permanent UI copy while keeping market acronyms unchanged.
- Add scoped semantic CSS using current surface/chart tokens; no giant navy module or new color system.

## Task 6 — Validation, visual QA and release

- Run focused tests after every task, then `npm run typecheck`, `npm run lint`, `npm run i18n:audit`, `npm run license:audit`, `npm test`, `npm run build`, `npm run cloudflare:preflight`.
- Run the impeccable detector exactly once on changed UI/CSS targets and fix mechanical findings.
- Interact with all five modes at 1440, 1280, 768 and 375; test EN/ES, keyboard, solver errors, heatmap cells, scenarios, Ask context and non-overlap with Quant Bateman. Capture valid desktop/mobile evidence.
- Perform a fresh in-thread finish review because project instructions prohibit spawning a reviewer subagent; document this degraded review explicitly.
- If clean, commit the feature branch, merge non-destructively into local `main`, push `main`, deploy via the existing Cloudflare script and verify `/analytics/fixed-income` on `https://thequantbateman.com`.

