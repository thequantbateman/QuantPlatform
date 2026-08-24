# Analytics Guided Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every existing Analytics tool a rigorous guided experiment with real state changes, academic explanations, and deterministic contextual Quant Bateman coaching.

**Architecture:** A framework-free scenario catalog and pure event-to-insight resolvers sit above the existing quant engines. Each lab owns a small adapter that atomically applies scenario inputs, while one shared guide component and one Quant Bateman bridge render consistent instruction without centralizing calculator state or duplicating models.

**Tech Stack:** React 19, TypeScript 5.9, vinext, Node `node:test`, server-rendered component contract tests, existing CSS/i18n/KaTeX/quant modules, Cloudflare Workers.

**Spec:** `docs/superpowers/specs/2026-08-24-analytics-guided-experience-design.md`

## Global Constraints

- Do not add Analytics modules, routes, data providers, dependencies, model engines, or character assets.
- Preserve manual controls, canonical query parameters, strategy transfer, existing volatility scenarios, existing market-making missions, and framework-free quant calculations.
- Guidance is deterministic, bilingual, scenario-led, mathematically explicit, and silent during routine edits.
- Full repricing or the existing quant engine remains the numerical authority; guidance never calculates a second answer.
- Quant Bateman remains the single global assistant and receives bounded serializable context only.
- All UI must work at 375, 768, 1280, and 1440 pixels with keyboard focus, reduced motion, and EN/ES parity.
- Use no invented market data. Preserve the synthetic/educational labels and model limitations.
- Implement test-first, commit each independently reviewable task, and do not merge or deploy before full validation and explicit production confirmation.

---

### Task 1: Typed Scenario Catalog and Academic Contracts

**Files:**
- Create: `src/analytics/guidance/types.ts`
- Create: `src/analytics/guidance/scenarios/core.ts`
- Create: `src/analytics/guidance/scenarios/portfolio.ts`
- Create: `src/analytics/guidance/scenarios/strategies.ts`
- Create: `src/analytics/guidance/scenarios/surface.ts`
- Create: `src/analytics/guidance/scenarios/marketMaking.ts`
- Create: `src/analytics/guidance/scenarios/index.ts`
- Create: `src/analytics/guidance/insights.ts`
- Create: `src/analytics/guidance/context.ts`
- Create: `tests/analytics-guidance.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `AnalyticsLabId`, `LocalizedText`, `AnalyticsScenario<TInputs>`, `AnalyticsEvent`, `AnalyticsInsight`, `analyticsScenarios`, `scenariosForLab(labId)`, `resolveAnalyticsInsight(event)`, and `serializeAnalyticsContext(context)`.
- Consumes: canonical surface scenario IDs from `src/quant/volatility/volSurface.ts`, market-making mission IDs from `src/quant/market-making/missions.ts`, canonical Academy routes, and no React runtime.

- [ ] **Step 1: Register a failing pure test suite**

Add `tests/analytics-guidance.test.ts` to `test:quant` and begin with executable contract assertions:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { analyticsScenarios, scenariosForLab } from "@/src/analytics/guidance/scenarios";
import { resolveAnalyticsInsight } from "@/src/analytics/guidance/insights";
import { serializeAnalyticsContext } from "@/src/analytics/guidance/context";

test("scenario catalog is bilingual, unique and academically complete", () => {
  assert.equal(new Set(analyticsScenarios.map(({ id }) => id)).size, analyticsScenarios.length);
  for (const scenario of analyticsScenarios) {
    for (const field of ["name", "description", "learningObjective", "expectedObservation", "explanation", "modelBoundary"] as const) {
      assert.ok(scenario[field].en.trim());
      assert.ok(scenario[field].es.trim());
    }
    assert.ok(scenario.suggestedInteractions.length > 0);
  }
  assert.equal(scenariosForLab("volatility-surface").length, 6);
});

test("routine edits do not create assistant chatter", () => {
  assert.equal(resolveAnalyticsInsight({
    labId: "greeks", kind: "parameter-edited", inputs: { spot: 101 }, metrics: { gamma: 0.02 }, timestamp: 1,
  }), null);
});

test("assistant context stays bounded and strips unsupported values", () => {
  const value = serializeAnalyticsContext({ labId: "portfolio", scenarioId: "delta-neutral", inputs: { spot: 100 }, metrics: { delta: 0.2 }, positions: Array(100).fill({ secret: "discard" }) } as never);
  assert.deepEqual(value, { labId: "portfolio", scenarioId: "delta-neutral", inputs: { spot: 100 }, metrics: { delta: 0.2 } });
});
```

- [ ] **Step 2: Run the focused suite and capture RED**

Run: `node --import tsx --test tests/analytics-guidance.test.ts`

Expected: FAIL because the guidance modules do not exist.

- [ ] **Step 3: Implement the core types and scenario catalog**

Use the exact lab union and academic fields from the specification. Add `kind: "parameter-edited"` to `AnalyticsEventKind` so resolvers can explicitly return `null` for routine movement. Scenario IDs must be globally unique and use stable kebab-case names. The index must be a readonly flattened catalog:

```ts
export const analyticsScenarios = [
  ...coreScenarios,
  ...portfolioScenarios,
  ...strategyScenarios,
  ...surfaceScenarios,
  ...marketMakingScenarios,
] as const satisfies readonly AnalyticsScenario<Record<string, unknown>>[];

export function scenariosForLab(labId: AnalyticsLabId) {
  return analyticsScenarios.filter((scenario) => scenario.labId === labId);
}
```

Author all scenario text in EN/ES using the five-question academic standard. Surface entries reference the six existing IDs; market-making entries reference three existing mission flows. Do not duplicate the underlying input grids, payoff functions, or mission calculations.

- [ ] **Step 4: Implement pure insight and context functions**

`resolveAnalyticsInsight` returns `null` for `parameter-edited` and `reset`. For scenario, hedge, comparison, threshold, or invalid events it returns localized authored content, stable `dedupeKey`, priority, and character state. `serializeAnalyticsContext` accepts only lab/scenario/model plus primitive input and metric maps, drops non-finite values, and caps each map at twelve keys.

- [ ] **Step 5: Add quant-linked catalog assertions**

Extend the test suite to prove:

- surface scenario IDs equal the canonical surface scenario IDs;
- market-making scenario mission IDs satisfy the existing `MarketMakingMissionId` union and execute through `evaluateMarketMakingMission` with valid contexts;
- every `academyHref` resolves against an existing Academy lesson route;
- numeric inputs are finite;
- all eight lab IDs have scenarios.

- [ ] **Step 6: Run focused and static validation**

Run:

```bash
node --import tsx --test tests/analytics-guidance.test.ts
npm run typecheck
npm run lint
npm run i18n:audit
git diff --check
```

Expected: all pass.

- [ ] **Step 7: Commit the domain layer**

```bash
git add package.json src/analytics/guidance tests/analytics-guidance.test.ts
git commit -m "feat: add guided analytics scenario contracts"
```

---

### Task 2: Deterministic Quant Bateman Analytics Bridge

**Files:**
- Create: `src/components/analytics/useAnalyticsGuidance.ts`
- Modify: `src/components/quant-bateman/quantBateman.types.ts`
- Modify: `src/components/quant-bateman/QuantBatemanProvider.tsx`
- Modify: `src/components/quant-bateman/QuantBatemanAssistant.tsx`
- Modify: `src/components/quant-bateman/QuantBatemanMiniChat.tsx`
- Modify: `src/components/quant-bateman/quantBateman.config.ts`
- Modify: `tests/quant-bateman.test.ts`
- Modify: `tests/analytics-components.test.tsx`

**Interfaces:**
- Consumes: `AnalyticsEvent`, `AnalyticsInsight`, `resolveAnalyticsInsight`, and `serializeAnalyticsContext` from Task 1.
- Produces: `QuantBatemanAnalyticsContext`, `publishAnalyticsEvent(event)`, `setAnalyticsContext(context)`, `clearAnalyticsContext()`, and `useAnalyticsGuidance({ labId, model })`.

- [ ] **Step 1: Write failing provider and bridge tests**

Add tests for bounded context, stale route clearing, priority, and deduplication. Render a harness around `QuantBatemanProvider` and assert the following sequence:

```ts
publishAnalyticsEvent(lowScenarioEvent);
publishAnalyticsEvent(lowScenarioEvent); // identical dedupe key
publishAnalyticsEvent(highInvalidStateEvent);
```

Expected contract: one low message, no duplicate, then immediate warning. Add a context test proving navigation clears `instrument`, `action`, and `analytics` before the next lab populates them.

- [ ] **Step 2: Run the focused tests and capture RED**

Run: `node --import tsx --test tests/quant-bateman.test.ts tests/analytics-components.test.tsx`

Expected: FAIL because the Analytics bridge methods and context do not exist.

- [ ] **Step 3: Extend the provider without replacing current APIs**

Add optional `analytics` to `QuantBatemanPageContext`. Keep `setPageContext` for compatibility and add explicit clear behavior:

```ts
setAnalyticsContext: (context: QuantBatemanAnalyticsContext) => void;
clearAnalyticsContext: () => void;
publishAnalyticsEvent: (event: AnalyticsEvent) => void;
```

Store the last dedupe key and priority in refs. Cancel pending low-priority timers on route changes and on high-priority events. Localize the resolved message at publication using the current locale supplied by the hook. Reuse existing state/message/transient APIs.

- [ ] **Step 4: Clear stale context on route changes**

In `QuantBatemanAssistant`, reset page-specific fields before applying the new pathname:

```ts
setPageContext({
  pathname,
  section: sectionFromPath(pathname),
  instrument: undefined,
  action: undefined,
  analytics: undefined,
});
clearAnalyticsContext();
```

Ensure cleanup cannot erase a newly mounted lab context after the same navigation commit; use one provider method that performs the route reset atomically.

- [ ] **Step 5: Pass bounded context into mini chat**

Keep `requestAssistant` unchanged except for the new serialized context field. The mini chat must display the active scenario name and model when present and submit only the bounded primitive maps, never full positions or surface grids.

- [ ] **Step 6: Run focused validation**

Run:

```bash
node --import tsx --test tests/quant-bateman.test.ts tests/analytics-components.test.tsx tests/analytics-guidance.test.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: all pass with no changes to Ask-page behavior.

- [ ] **Step 7: Commit the assistant bridge**

```bash
git add src/components/quant-bateman src/components/analytics/useAnalyticsGuidance.ts tests/quant-bateman.test.ts tests/analytics-components.test.tsx
git commit -m "feat: connect analytics insights to Quant Bateman"
```

---

### Task 3: Shared Guidance Interface and Experiment-Oriented Hub

**Files:**
- Create: `src/components/analytics/AnalyticsGuide.tsx`
- Modify: `src/components/AnalyticsHub.tsx`
- Modify: `src/i18n/index.tsx`
- Modify: `app/globals.css`
- Modify: `tests/analytics-components.test.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `AnalyticsScenario`, `scenariosForLab`, `useAnalyticsGuidance`, current locale, and callbacks supplied by each lab.
- Produces: `AnalyticsGuide({ labId, activeScenarioId, snapshots, onApply, onReset, onManual })` and stable `data-analytics-guide`/`data-analytics-scenario` render markers.

- [ ] **Step 1: Add failing SSR contracts**

Assert that the guide renders semantic controls and academic sections without needing a DOM test dependency:

```tsx
const html = renderToStaticMarkup(<AnalyticsGuide
  labId="greeks"
  activeScenarioId={null}
  snapshots={null}
  onApply={() => undefined}
  onReset={() => undefined}
  onManual={() => undefined}
/>);
assert.match(html, /data-analytics-guide="greeks"/);
assert.match(html, /First try|Primer experimento/);
assert.match(html, /What to watch|Qué observar/);
assert.match(html, /Model boundary|Límite del modelo/);
```

Extend rendered HTML tests so `/analytics` still exposes exactly the seven canonical routes and now includes experiment, difficulty, and primary-output metadata in EN/ES.

- [ ] **Step 2: Run tests and capture RED**

Run: `node --import tsx --test tests/analytics-components.test.tsx`

Expected: FAIL because `AnalyticsGuide` does not exist.

- [ ] **Step 3: Implement the compact guide**

Use native buttons and `<details>` rather than a modal or tour. The component receives state through props and does not own calculator values. It displays selected scenario copy, before/after primitive snapshots, related Academy link, reset/manual actions, and an “Ask about this” button that opens the existing mini chat.

Persist only `tqb-analytics-hint-v1:<labId>` after the first hint is dismissed. Storage failure must leave the guide usable.

- [ ] **Step 4: Refine the Analytics hub**

Replace directory-like tool descriptions with bilingual question/experiment/output/difficulty metadata while preserving the seven links. Add a compact sequence strip:

```text
Instrument → Sensitivities → Surface / curve → Portfolio → Strategy → Dealer inventory
```

The sequence is explanatory navigation, not a new route or curriculum graph. Keep the title compact and Quant Bateman secondary.

- [ ] **Step 5: Add scoped visual styles**

Create `analytics-guide-*` and updated `analytics-tool-*` rules using existing tokens only. The chart/result remains dominant. At 600/768px stack guide content before controls; ensure 44px targets and visible focus. Remove no global styles in this task.

- [ ] **Step 6: Run focused validation**

Run:

```bash
npm run build
node --test tests/rendered-html.test.mjs
node --import tsx --test tests/analytics-components.test.tsx
npm run typecheck
npm run lint
npm run i18n:audit
git diff --check
```

Expected: all pass; the seven route assertions remain unchanged.

- [ ] **Step 7: Commit the shared interface and hub**

```bash
git add src/components/analytics/AnalyticsGuide.tsx src/components/AnalyticsHub.tsx src/i18n/index.tsx app/globals.css tests/analytics-components.test.tsx tests/rendered-html.test.mjs
git commit -m "feat: guide analytics discovery with real experiments"
```

---

### Task 4: Pricing, Greeks, and Curve Scenario Adapters

**Files:**
- Modify: `src/components/labs/Labs.tsx`
- Modify: `src/components/analytics/AnalyticsGuide.tsx`
- Modify: `tests/quant.test.ts`
- Modify: `tests/analytics-components.test.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: core scenarios from Task 1, `AnalyticsGuide` from Task 3, and existing vanilla/Black–Scholes/Greeks/curve state setters.
- Produces: atomic `applyScenario` functions inside each existing lab and post-update Analytics events containing current model metrics.

- [ ] **Step 1: Write scenario-to-engine regression tests**

Add tests that call the existing quant functions with catalog inputs:

```ts
test("ATM near-expiry scenario concentrates gamma", () => {
  const near = blackScholes({ ...nearExpiryInputs, type: "call" });
  const long = blackScholes({ ...longDatedInputs, type: "call" });
  assert.ok(Number.isFinite(near.gamma));
  assert.ok(near.gamma > long.gamma);
});
```

Also assert FX domestic/foreign carry changes the forward consistently, Black-76 uses the supplied forward, finite-volatility repricing differs from local vega by an observable residual, and a localized curve quote bump changes rebuilt forwards.

- [ ] **Step 2: Run focused quant tests and capture any RED contract gaps**

Run: `node --import tsx --test tests/quant.test.ts tests/analytics-guidance.test.ts`

Expected: new scenario adapter helpers or exported catalog input guards fail before implementation; existing numerical tests remain green.

- [ ] **Step 3: Integrate vanilla and Black–Scholes guidance**

Inside the existing lab components, implement one atomic callback per lab:

```ts
function applyScenario(scenario: AnalyticsScenario<Record<string, unknown>>) {
  const next = validateScenarioInputs(scenario.initialInputs);
  if (!next.ok) return publishInvalidScenario(scenario.id, next.reason);
  setAllRelatedState(next.value);
  setActiveScenarioId(scenario.id);
  queueMicrotask(() => publishScenarioLoaded(scenario.id, next.value));
}
```

The actual event metrics must be derived from the same memoized model output shown on screen. Do not calculate a duplicate output in the guide.

- [ ] **Step 4: Integrate Greeks guidance**

Apply spot/strike/maturity/volatility/selected-Greek state together. Publish threshold insights only when crossing authored conditions such as ATM proximity or short maturity; do not publish on each slider tick.

- [ ] **Step 5: Integrate curve guidance**

Apply complete quote-node arrays atomically, rebuild through the existing bootstrap, and publish metrics from displayed discount/zero/forward outputs. The 1bp experiment changes a calibration quote, not a displayed zero rate.

- [ ] **Step 6: Preserve route and reset semantics**

Verify `/lab?lab=vanilla`, `/lab?lab=black-scholes`, `/lab?lab=greeks`, and `/lab?lab=curve` still select the correct tab. “Return to manual” retains values; scenario reset restores the example; original lab reset restores original defaults.

- [ ] **Step 7: Run focused validation**

Run:

```bash
node --import tsx --test tests/quant.test.ts tests/analytics-guidance.test.ts tests/analytics-components.test.tsx
npm run build
node --test tests/rendered-html.test.mjs
npm run typecheck
npm run lint
git diff --check
```

Expected: all pass with canonical query routes intact.

- [ ] **Step 8: Commit core lab adapters**

```bash
git add src/components/labs/Labs.tsx src/components/analytics/AnalyticsGuide.tsx tests/quant.test.ts tests/analytics-components.test.tsx tests/rendered-html.test.mjs
git commit -m "feat: add guided pricing and curve experiments"
```

---

### Task 5: Surface, Portfolio, Strategy, and Market-Making Integration

**Files:**
- Modify: `src/components/academy/VolSurfaceLab.tsx`
- Modify: `src/components/analytics/PortfolioGreeksLab.tsx`
- Modify: `src/components/analytics/StrategyPayoffLab.tsx`
- Modify: `src/components/labs/MarketMakingLab.tsx`
- Modify: `app/globals.css`
- Modify: `tests/portfolio.test.ts`
- Modify: `tests/strategies.test.ts`
- Modify: `tests/market-making.test.ts`
- Modify: `tests/analytics-components.test.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: canonical surface scenarios, portfolio/strategy/market-making guidance entries, existing model outputs, and the shared guide/assistant bridge.
- Produces: real before/after snapshots and events for scenario loads, hedge application, strategy comparison, and market-making mission outcomes.

- [ ] **Step 1: Add failing real-engine assertions**

Test the academically important outcomes:

```ts
test("delta hedge reduces delta without erasing remaining risk", () => {
  const before = valuePortfolio(defaultPositions, defaultMarket);
  const proposal = proposeDeltaHedge(defaultPositions, defaultMarket);
  assert.equal(proposal.status, "ok");
  if (proposal.status !== "ok") return;
  assert.ok(Math.abs(proposal.after.greeks.delta) < Math.abs(before.greeks.delta));
  assert.ok(Math.abs(proposal.after.greeks.gamma) + Math.abs(proposal.after.greeks.vega) + Math.abs(proposal.after.greeks.theta) > 0);
});
```

Add equivalent assertions for exact-versus-Taylor residual, one-leg strategy modification and breakeven change, surface scenario canonical IDs, and market-making hedge cost/residual/basis-risk metrics.

- [ ] **Step 2: Run focused suites and capture RED where adapter exports are absent**

Run:

```bash
node --import tsx --test tests/portfolio.test.ts tests/strategies.test.ts tests/market-making.test.ts tests/analytics-guidance.test.ts
```

Expected: existing engine tests pass; new adapter/context assertions fail until the integrations are implemented.

- [ ] **Step 3: Enrich the existing volatility scenarios**

Map the six existing scenario buttons to shared guidance IDs and publish post-update selected-point/slice metrics. Keep HEATMAP as the default, keep 3D opt-in, and do not duplicate scenario parameters or playback state.

- [ ] **Step 4: Integrate portfolio guidance and hedge events**

Scenario application updates `market`, `positions`, and `scenario` together. Capture before metrics from the current valuation and after metrics from the next real valuation. On “Apply hedge,” publish the displayed before/after Greek vectors and keep the existing proposed ticket logic authoritative.

- [ ] **Step 5: Integrate strategy guidance and comparisons**

Map the bull call, long straddle, and iron condor scenarios to existing preset builders. When a learner changes the guided leg, create a comparison snapshot from the existing `analyzeTerminalStrategy` result. Preserve all 22 presets and the versioned session-storage transfer.

- [ ] **Step 6: Adapt existing market-making missions**

Reference existing mission IDs and outputs rather than adding a second mission system. Publish inventory, residual delta, hedge cost, spread/friction, and basis-risk metrics from the existing market-making engine.

Remove only the rule that hides the assistant:

```css
body:has(.market-making-lab) .qb-assistant { display: none; }
```

Replace it with scoped layout clearance if needed so the assistant remains visible without covering stage controls.

- [ ] **Step 7: Run integration validation**

Run:

```bash
node --import tsx --test tests/portfolio.test.ts tests/strategies.test.ts tests/market-making.test.ts tests/analytics-guidance.test.ts tests/analytics-components.test.tsx
npm run build
node --test tests/rendered-html.test.mjs
npm run typecheck
npm run lint
git diff --check
```

Expected: all pass, including strategy-to-portfolio transfer contracts and canonical surface routes.

- [ ] **Step 8: Commit advanced lab integration**

```bash
git add src/components/academy/VolSurfaceLab.tsx src/components/analytics/PortfolioGreeksLab.tsx src/components/analytics/StrategyPayoffLab.tsx src/components/labs/MarketMakingLab.tsx app/globals.css tests
git commit -m "feat: guide portfolio and dealer risk workflows"
```

---

### Task 6: Responsive, Accessibility, Internationalization, and Visual Hardening

**Files:**
- Modify: `app/globals.css`
- Modify: `src/i18n/index.tsx`
- Modify: touched Analytics components only when browser findings require a fix
- Modify: `tests/analytics-components.test.tsx`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `docs/PRODUCT.md` only if the implemented interaction contract materially changes the documented product behavior

**Interfaces:**
- Consumes: all completed guided Analytics components.
- Produces: final responsive and accessibility behavior with no new public API.

- [ ] **Step 1: Strengthen semantic and locale tests**

Add SSR assertions for:

- guide landmark and native scenario controls;
- `aria-expanded` disclosure behavior in initial markup;
- `aria-live` only on meaningful status output;
- all eight lab IDs in both locales;
- model-boundary and synthetic labels;
- market-making assistant not hidden by CSS;
- translated first-visit and Ask-context copy.

- [ ] **Step 2: Run focused tests and capture RED for uncovered issues**

Run: `node --import tsx --test tests/analytics-components.test.tsx`

Expected: new assertions fail before final markup/CSS corrections.

- [ ] **Step 3: Run the Impeccable detector on changed UI targets**

Run:

```bash
node /Users/alejandrogarciamunoz/.agents/skills/impeccable/scripts/detect.mjs --json src/components/AnalyticsHub.tsx src/components/analytics src/components/labs/Labs.tsx src/components/labs/MarketMakingLab.tsx src/components/academy/VolSurfaceLab.tsx app/globals.css
```

Classify findings as new/actionable, pre-existing/out-of-scope, or false positive. Fix only new actionable issues.

- [ ] **Step 4: Perform browser matrix validation**

Run the built application and inspect:

- `/analytics`;
- `/lab?lab=vanilla`;
- `/lab?lab=greeks`;
- `/lab?lab=curve`;
- `/analytics/volatility`;
- `/analytics/portfolio`;
- `/analytics/strategies`;
- `/lab?lab=market-making`.

At 375, 768, 1280, and 1440 pixels verify no document overflow, chart/result priority, 44px controls, visible focus, assistant clearance, guide stacking, wide-table ownership, and compact density. Repeat representative routes in EN/ES, light/dark, and reduced-motion modes.

- [ ] **Step 5: Verify interaction flows in the browser**

For each major surface load one scenario, alter the suggested input, verify the real metric changes, reset to the example, return to manual, and open “Ask about this.” Specifically verify duplicate routine slider edits do not produce repeated bubbles and navigation clears the prior scenario context.

- [ ] **Step 6: Apply the smallest CSS/markup corrections**

Use existing design tokens and scoped selectors. Do not refactor unrelated global CSS. Re-run computed focus-visible, contrast, target-size, overflow, and assistant-rectangle checks after each correction.

- [ ] **Step 7: Run full pre-release validation**

Run:

```bash
npm run typecheck
npm run lint
npm run i18n:audit
npm test
npm run build
npm run cloudflare:preflight
git diff --check
git status --short
```

Expected: every command exits zero and only intended tracked changes remain.

- [ ] **Step 8: Commit hardening changes**

```bash
git add app/globals.css src/i18n/index.tsx src/components tests docs/PRODUCT.md
git commit -m "fix: harden guided analytics across viewports"
```

---

### Task 7: Final Review, Main Integration, and Production Verification

**Files:**
- Review: entire `main..codex/analytics-guided-experience` diff
- Create: no production code unless review or production verification exposes a regression

**Interfaces:**
- Consumes: all previous task commits and the configured GitHub/Cloudflare build pipeline.
- Produces: reviewed feature branch, merged `main`, canonical remote update, and verified production Analytics routes.

- [ ] **Step 1: Review the complete branch diff against the specification**

Run:

```bash
git diff --stat main...HEAD
git diff --check main...HEAD
git log --oneline main..HEAD
```

Inspect for model duplication, hardcoded mixed language, stale context, direct scattered assistant messages, unbounded serialization, route changes, licensed data, and unrelated refactors.

- [ ] **Step 2: Re-run the complete verification suite from a clean state**

Run:

```bash
npm run typecheck
npm run lint
npm run i18n:audit
npm test
npm run build
npm run cloudflare:preflight
```

Expected: all pass with fresh output.

- [ ] **Step 3: Record final before/after evidence**

Capture the hub and representative pricing, portfolio, surface, strategy, and market-making views at desktop and mobile widths. Record the tested scenario IDs, observed metric changes, assistant messages, EN/ES status, and any non-blocking warnings.

- [ ] **Step 4: Request explicit production confirmation**

Present the validation evidence, branch commits, risks, and exact proposed external writes: merge to `main`, push `origin/main`, and let the configured Cloudflare Workers Build deploy. Do not perform these writes without confirmation.

- [ ] **Step 5: Merge and push after confirmation**

```bash
git switch main
git merge --ff-only codex/analytics-guided-experience
git push origin main
```

If fast-forward is impossible, stop and inspect divergence; do not force push.

- [ ] **Step 6: Verify Cloudflare production**

Wait for the configured build, then inspect `https://thequantbateman.com/analytics` and representative guided routes. Confirm the deployed commit, canonical links, scenario interaction, assistant context, EN/ES, responsive layout, and absence of new console errors.

- [ ] **Step 7: Deliver one consolidated final report**

Use the required headings: Audit, Scenarios, Quant Bateman Guidance, Interaction, Education, Regression, Responsive/i18n, Validation, Git, Production. End with exactly one status: `READY AND DEPLOYED`, `DEPLOYED WITH NON-BLOCKING WARNINGS`, or `NOT DEPLOYED — BLOCKING ISSUE`.
