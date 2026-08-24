# Analytics Guided Experience Design

## Purpose

Turn the existing Analytics area into a guided quantitative learning environment without replacing its pricing, risk, portfolio, strategy, volatility, curve, or market-making engines. A learner should be able to open any major tool, load a meaningful experiment, change one variable, observe a real recalculation, and understand the financial and mathematical reason for the result.

The work is educational product refinement, not curriculum or module expansion. It preserves every existing manual control and treats full repricing or the relevant framework-free quant engine as the numerical authority.

## Product Decisions

- Guidance is scenario-led and event-driven. Quant Bateman stays silent during routine parameter edits.
- Each lab may show one dismissible first-visit hint. It is stored locally and never blocks manual use.
- Quant Bateman speaks only after a guided scenario is loaded, a meaningful threshold is crossed, a hedge/comparison is applied, or an invalid state needs attention.
- Messages are deterministic, bilingual, debounced, deduplicated, scoped to the current lab, and derived from the current computed state.
- The existing global Quant Bateman is reused. No second mascot, chat, assistant provider, or oversized character is introduced.
- No Monte Carlo or xVA Analytics module is added because neither is currently an Analytics product surface.
- Existing routes, URL query parameters, model implementations, manual modes, strategy transfer, volatility scenarios, and market-making missions remain valid.

## Audit Summary

### Analytics hub

The hub accurately links seven real tools but behaves like a directory. It does not help a learner choose an experiment, distinguish difficulty, or understand the first useful action. It will become an experiment-oriented discovery page while retaining the same seven destinations.

### Vanilla and Black–Scholes labs

The engines already provide valid linked calculations, diagnostics, Greeks, implied-volatility inversion, scenarios, and implementation details. The learning path is unclear because users encounter many controls before being shown a financially meaningful experiment. Guidance will introduce convention choice, moneyness, time decay, and volatility exposure without changing the calculators.

### Greeks lab

The chart and heatmap are useful but do not explicitly direct learners to move spot through strike, shorten maturity, or compare local sensitivities with nonlinear repricing. Guided scenarios will make those causal relationships explicit.

### Volatility surface workbench

This is the strongest existing guided experience. Its six canonical scenarios, shared surface state, heatmap-first mobile fallback, slices, 3D view, and numeric table will be retained. The work is limited to adding the shared educational explanation contract and contextual assistant events.

### Yield-curve lab

Bootstrapping and curve manipulation work, but the initial experience does not distinguish market quotes, calibrated discount factors, zero rates, and forwards. Scenarios will expose curve shape, quote bumps, propagation, and model conventions.

### Portfolio Greeks and hedging

The lab already performs full valuation, Greek aggregation, exact scenario repricing, Taylor attribution, heatmaps, decay profiles, and hedge proposals. Guided scenarios will teach why a delta hedge leaves gamma, vega, theta, and discrete-rehedging risk rather than presenting a hedge ticket as a complete solution.

### Options strategies

The strategy lab has 22 real presets, exact terminal algebra, model-value views, breakevens, tail analysis, leg editing, and a versioned transfer to portfolio risk. Guidance will organize presets around questions and make a one-leg modification visibly explain the resulting payoff and risk change.

### Market making

The recently added lab already has missions, client flow, dealer inventory, hedge choices, costs, scenarios, and replay. These missions will be adapted to the shared scenario contract rather than rewritten. A current CSS rule hides Quant Bateman on this page; that rule must be removed and the responsive assistant boundary verified.

### Quant Bateman

The provider currently receives only `pathname`, `section`, `instrument`, and `action`, while individual labs call message methods directly. Page context is merged and can retain stale fields after navigation. The new layer will add a bounded structured Analytics context, clear stale lab data on route changes, and centralize message priority, timing, and deduplication.

## Experience Architecture

### 1. Scenario definitions

Create a framework-free scenario contract under `src/analytics/guidance/`:

```ts
export type AnalyticsLabId =
  | "vanilla"
  | "black-scholes"
  | "greeks"
  | "volatility-surface"
  | "yield-curve"
  | "portfolio"
  | "strategies"
  | "market-making";

export interface LocalizedText {
  en: string;
  es: string;
}

export interface AnalyticsScenario<TInputs extends Record<string, unknown>> {
  id: string;
  labId: AnalyticsLabId;
  name: LocalizedText;
  description: LocalizedText;
  learningObjective: LocalizedText;
  initialInputs: TInputs;
  expectedObservation: LocalizedText;
  suggestedInteractions: readonly LocalizedText[];
  explanation: LocalizedText;
  modelBoundary: LocalizedText;
  difficulty: "foundation" | "practitioner" | "front-office";
  academyHref?: string;
}
```

Scenario definitions contain only validated input patches and authored educational text. They do not calculate prices or duplicate quant logic. Each lab owns a narrow adapter that validates and atomically applies its scenario inputs to the existing state.

### 2. Events and insights

Create typed events emitted only after state changes are accepted:

```ts
export type AnalyticsEventKind =
  | "scenario-loaded"
  | "threshold-crossed"
  | "hedge-applied"
  | "comparison-created"
  | "invalid-state"
  | "reset";

export interface AnalyticsEvent {
  labId: AnalyticsLabId;
  kind: AnalyticsEventKind;
  scenarioId?: string;
  inputs: Readonly<Record<string, number | string | boolean>>;
  metrics: Readonly<Record<string, number | string | boolean>>;
  timestamp: number;
}

export interface AnalyticsInsight {
  labId: AnalyticsLabId;
  priority: "low" | "medium" | "high";
  dedupeKey: string;
  state: "talking" | "success" | "warning";
  title: LocalizedText;
  message: LocalizedText;
  contextSummary: LocalizedText;
}
```

Pure resolvers convert events and post-update metrics into insights. A resolver must never infer from pre-update state or invent values. Numerical values in messages come from the event metrics and use the platform locale formatter.

### 3. Quant Bateman bridge

Add a client hook that receives `AnalyticsInsight` objects and publishes them through the existing Quant Bateman provider.

- High priority warnings replace lower-priority messages immediately.
- Medium-priority results replace low-priority hints.
- Low-priority messages wait for the debounce window and disappear using the existing transient behavior.
- Repeated `dedupeKey` values are suppressed while the relevant state remains unchanged.
- Route changes clear the Analytics context and pending insight timers.
- Opening the mini chat sends a compact structured context containing lab ID, active scenario, model/convention, selected inputs, and key outputs. Full position books or surface grids are not serialized.
- “Ask about this” opens the existing mini chat with the same bounded context; it does not create a second chat interface.

The provider retains all current character images, poses, dragging, success/warning behavior, and Ask routing. The market-making assistant suppression rule is removed. Assistant placement is tested against control panels at mobile and desktop widths.

### 4. Shared guidance interface

Add a compact reusable `AnalyticsGuide` component rendered inside each lab after the lab purpose and before dense controls.

The collapsed/default view contains:

- one-sentence tool purpose;
- “First try” scenario selector;
- difficulty and synthetic/educational status;
- reset-to-example and manual-mode actions.

The selected scenario expands in place to show:

- learning objective;
- what to change;
- what to watch in the primary chart or metrics;
- why the result changes mathematically;
- the model boundary;
- before/after key metrics when the lab exposes them;
- a related Academy link when an existing canonical lesson applies;
- “Ask about this” using the existing assistant.

The primary chart or result remains visually dominant. The guide uses existing typography, borders, spacing, focus treatments, and disclosure patterns. It does not become a wizard, modal, tour overlay, or oversized card stack.

## Scenario Inventory

### Vanilla pricer

1. **Equity carry and moneyness** — compare spot, strike, rate, and dividend yield; observe forward moneyness and call value.
2. **FX domestic versus foreign rate** — activate Garman–Kohlhagen inputs; observe that the foreign rate acts as carry rather than a second discount factor pasted onto the result.
3. **Black-76 forward option** — switch to forward mode; distinguish observable forward, discounting, and spot-based conventions.

### Black–Scholes lab

1. **ATM near expiry** — set spot and strike equal with short maturity; watch gamma concentration and theta cost.
2. **Long-dated volatility exposure** — extend maturity; watch vega increase while gamma becomes less concentrated.

### Greeks lab

1. **Move spot through strike** — observe the delta transition and gamma peak.
2. **Shorten maturity** — compare gamma concentration with theta magnitude.
3. **Volatility and vega** — compare the local derivative with actual repricing after a finite volatility move.

### Volatility surface

Reuse the existing six canonical scenarios: base, spot crash, volatility spike, term inversion, skew steepening, and normalization. Add objective, suggested interaction, expected observation, and model-boundary fields without changing surface generation.

### Yield curve

1. **Normal versus inverted curve** — load coherent market quotes and observe zeros and forwards separately.
2. **Localized 1bp quote bump** — bump one calibration quote, rebuild, and observe propagation through dependent maturities.
3. **Front-end repricing** — alter short maturities and explain why forwards may move more sharply than long discount factors.

### Portfolio and hedging

1. **Delta-neutral is not risk-neutral** — apply the proposed delta hedge and compare remaining gamma, vega, theta, and scenario P&L.
2. **Spot-down and volatility-up** — apply a joint shock and compare exact repricing with the Taylor approximation and residual.
3. **Time decay with static hedge** — advance time while holding market inputs fixed and explain hedge drift.

### Strategies

1. **Bull call spread** — compare capped upside with premium reduction and exact breakeven.
2. **Long straddle** — inspect convex tails, premium hurdle, theta, and volatility sensitivity.
3. **Iron condor** — inspect the bounded profit region and tail losses, then move one short strike and compare the changed range.

### Market making

Adapt three existing mission flows:

1. **Client fill creates dealer inventory** — connect trade direction to dealer delta and mark-to-market risk.
2. **Hedge the inventory, price the friction** — compare residual risk with spread, fees, slippage, and hedge cost.
3. **Cross hedge under basis risk** — show why lower immediate delta does not remove mismatch and liquidity risk.

## Academic Explanation Standard

Every selected scenario must answer five questions in this order:

1. What financial object or convention is being changed?
2. Which observable chart, metric, or risk vector should move?
3. What mathematical relationship causes the move?
4. How would a practitioner interpret or hedge it?
5. Where does the model or approximation stop being reliable?

Explanations use existing notation and canonical Academy links. They distinguish state variables, market quotes, calibrated quantities, model parameters, and derived outputs. They do not describe Greeks as exact finite-shock P&L, a delta hedge as complete risk removal, or synthetic educational data as observed market data.

## Hub Redesign

Retain the compact title and seven real destinations. Reframe each tool as an experiment card with:

- the question it answers;
- a first recommended experiment;
- difficulty and primary output;
- the same canonical route.

Add a compact progression from single-instrument pricing to sensitivities, surfaces/curves, portfolio risk, strategies, and dealer inventory. This is navigation, not a new curriculum graph. No capability count or destination is invented.

## State, Reset, and Failure Behavior

- Scenario application is atomic. Invalid patches leave the current state unchanged and publish a localized warning.
- “Reset to example” restores the active scenario exactly.
- “Return to manual” preserves current values but stops scenario-specific prompts.
- Existing lab reset buttons continue to restore their original defaults.
- Scenario selection remains local to the page; only the dismissible first-visit hint flag is persisted.
- Reduced-motion users receive the same analytical state without autoplay.
- If the assistant provider is unavailable, deterministic local guidance remains fully functional.

## Internationalization and Accessibility

- All guidance, scenario names, assistant messages, control labels, and explanatory copy are authored in English and Spanish.
- Mathematical notation and instrument names remain unchanged where translation would be incorrect.
- Scenario controls use native buttons, links, and disclosures with visible focus and at least 44px targets.
- Status updates use restrained `aria-live` announcements; routine slider movement is not announced by Quant Bateman.
- Primary charts retain their current numeric/table alternatives.
- At 375px and 768px, guidance stacks before dense controls, the assistant never covers the active input/result, and wide equations or tables scroll inside their owner.

## Testing Strategy

### Pure contract tests

- Every scenario ID is unique and belongs to an existing lab.
- Every scenario has complete EN/ES academic fields, valid difficulty, finite numeric inputs, and a real Academy route when linked.
- Volatility and market-making adapters reference existing canonical scenario/mission IDs rather than creating a second model.
- Event resolvers use post-update metrics, enforce priority, produce stable dedupe keys, and return no message for routine edits below thresholds.
- Assistant context serialization is bounded, deterministic, and strips unsupported values.

### Quant and adapter tests

- Each scenario applies to its real lab state and changes the expected model output.
- Black–Scholes near-expiry ATM gamma exceeds the long-dated comparison while finite values are preserved.
- A delta hedge reduces absolute portfolio delta but leaves non-delta risks observable.
- Exact scenario repricing remains the authority over Taylor residuals.
- A localized curve quote bump rebuilds discount factors and forwards through the existing curve engine.
- Strategy scenario metrics match the existing exact payoff analyzer.
- Market-making guidance consumes existing risk, hedge, friction, and replay outputs.

### Render and interaction tests

- The Analytics hub exposes seven canonical tool routes and experiment metadata in both locales.
- Each major lab renders a compact guide, reset/manual actions, and synthetic/model-boundary labels.
- Scenario activation updates the real controls and visible metrics.
- Quant Bateman receives the current lab/scenario context, suppresses duplicate messages, clears stale context on navigation, and remains available in market making.
- Strategy-to-portfolio transfer remains compatible.
- Keyboard, focus, disclosure, and reduced-motion behavior remain valid.

### Release validation

- Run focused guidance, Analytics, quant, content, i18n, and rendered-route tests.
- Run `npm run typecheck`, `npm run lint`, `npm run i18n:audit`, `npm test`, and `npm run build`.
- Run the repository security and Cloudflare preflight checks discovered from package scripts.
- Inspect `/analytics` and all seven tool experiences at 375, 768, 1280, and 1440 pixels in English and Spanish.
- Verify no console errors, document overflow, assistant overlap, stale message, or broken query route.

## Git and Production

Implementation occurs on `codex/analytics-guided-experience` with small test-first commits. After review and full validation, merge into `main`, push the canonical GitHub remote, wait for the configured Cloudflare Workers Build, and verify `https://thequantbateman.com/analytics` plus representative guided scenarios. Production deployment requires explicit confirmation immediately before the external write.

## Out of Scope

- New Analytics modules, instruments, data providers, databases, accounts, or paid services.
- A replacement pricing, portfolio, strategy, volatility, curve, or market-making engine.
- A second assistant, a new character asset, Rive integration, or a global Ask redesign.
- Live market claims for synthetic inputs.
- Bulk Academy curriculum expansion.
