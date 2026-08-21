# Portfolio and Strategy Analytics design

**Status:** Approved in chat on 2026-08-21; awaiting written-spec review.

## Outcome

Add two production-quality Analytics workspaces to the existing application:

1. **Portfolio, Greeks & Hedging** at `/analytics/portfolio`.
2. **Options Strategy & Payoff** at `/analytics/strategies`.

The release must make a vanilla option book understandable from four connected views: positions, valuation, risk and scenarios. It is a deterministic educational analytics system, not an execution platform, market recommendation or source of live prices.

The first release is complete for European calls, puts and underlying positions sharing one valuation state. Advanced path-dependent features are a second release because they require additional models, not because they are optional decoration.

## Evidence and constraints

The design follows the existing platform rather than introducing a parallel product:

- `src/quant/models/blackScholes.ts` remains the vanilla pricing and analytical-Greek authority.
- Vega remains per one volatility point, theta per calendar day and rho per 100bp.
- Rates and volatilities remain decimal inputs, with ACT/365-like time and continuously compounded rates.
- `src/components/charts/LineChart.tsx` remains the shared accessible plot primitive.
- Routes remain thin and compose domain components.
- Quantitative calculations remain framework-free and browser-independent under `src/quant`.
- UI text supports English and Spanish; quant modules remain language-neutral.
- No chart, state-management or numerical dependency is added.
- All data is manual or synthetic and visibly labelled.

The Atlas payoff page was inspected as a behavioral reference. Its valuable interaction ideas are leg editing, an expected landing zone, exact settlement, piecewise payoff algebra and view/payoff mismatch feedback. The implementation will not copy its branding, layout, code or text.

## Release strategy

### Release 1: complete vanilla portfolio core

Release 1 delivers the two workspaces, shared state, exact same-expiry payoff analysis, actual repricing, desk-unit Greeks, delta and two-risk hedges, two-dimensional scenarios, pre-expiry mark-to-market, Academy links, contextual assistant state, EN/ES and responsive/accessibility validation.

### Release 2: advanced extensions

Release 2 adds dynamic hedge paths, transaction costs and financing; multi-expiry calendar/diagonal strategies; advanced cross-Greeks and smile conventions; and an optional three-dimensional P&L surface. Release 1 must not contain placeholders or controls for these features.

This separation protects mathematical rigor:

- a calendar spread cannot be summarized honestly by one terminal-payoff horizon;
- dynamic hedging needs a path model, rebalance rule, financing and execution costs;
- three-dimensional rendering must not delay or replace the exact accessible two-dimensional scenario view.

## Architecture

```text
thin Analytics routes
        |
        v
PortfolioGreeksLab / StrategyPayoffLab
        |
        +--> shared presentation primitives and LineChart
        |
        +--> versioned cross-lab state transfer
        |
        v
framework-free portfolio and strategy quant modules
        |
        +--> existing Black-Scholes engine
        +--> exact terminal-payoff algebra
        +--> aggregation, hedging and scenario repricing
```

The two workspaces share domain contracts but do not share a large generic React lab framework. Small common components are extracted only when both screens use the same semantic behavior.

## Domain contracts

### Market state

```ts
export interface PortfolioMarketState {
  spot: number;
  volatility: number;
  rate: number;
  dividend: number;
  valuationTime: number;
}
```

`valuationTime` is an ACT/365-like year fraction already elapsed from the portfolio reference date. Each option stores its original maturity in years; remaining time is `max(maturity - valuationTime, 0)`.

### Positions

```ts
export type PositionDirection = "long" | "short";

export interface BasePosition {
  id: string;
  direction: PositionDirection;
  quantity: number;
  multiplier: number;
}

export interface UnderlyingPosition extends BasePosition {
  instrument: "underlying";
  entryPrice: number;
}

export interface OptionPosition extends BasePosition {
  instrument: "option";
  optionType: "call" | "put";
  strike: number;
  maturity: number;
  premium: number;
}

export type PortfolioPosition = UnderlyingPosition | OptionPosition;
```

Direction is never encoded through negative quantity. Quantity and multiplier are non-negative finite magnitudes; the direction supplies the sign. A zero quantity is valid during editing but contributes no value or risk. Position IDs are stable UI identities and carry no financial meaning.

Option `premium` is a positive per-unit transaction price. `entryPrice` is the positive per-unit underlying transaction price. Signed cash flow is derived from direction. Multipliers scale value, P&L and every Greek consistently.

### Valuation output

```ts
export interface DeskGreeks {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface PositionValuation {
  positionId: string;
  modelValue: number;
  entryValue: number;
  unrealizedPnl: number;
  greeks: DeskGreeks;
  expired: boolean;
}

export interface PortfolioValuation {
  positions: PositionValuation[];
  modelValue: number;
  entryValue: number;
  unrealizedPnl: number;
  greeks: DeskGreeks;
}
```

For an underlying position, model value is spot, delta is one per unit and the other Greeks are zero before direction, quantity and multiplier scaling. For an option, price and Greeks come from the existing Black–Scholes engine. Entry value is signed consistently so `unrealizedPnl = modelValue - entryValue` after position scaling.

## Mathematical conventions

### Signed position scale

For direction sign \(s_i\in\{-1,+1\}\), quantity \(q_i\) and multiplier \(m_i\):

\[
w_i=s_iq_im_i.
\]

Every per-unit value and Greek is multiplied by the same \(w_i\). Portfolio measures are simple sums only after units have been normalized.

### Actual and approximated P&L

The scenario engine first performs full repricing:

\[
P\&L_{actual}=V(S+\Delta S,\sigma+\Delta\sigma,t+\Delta t,r+\Delta r)-V(S,\sigma,t,r).
\]

The local explanation uses the platform desk units:

\[
P\&L_{approx}=\Delta\,\Delta S+
\tfrac12\Gamma(\Delta S)^2+
\nu_{1vol}\,\Delta\sigma_{points}+
\Theta_{day}\,\Delta t_{days}+
\rho_{100bp}\,\Delta r_{100bp}.
\]

Conversions are explicit:

- `volatilityMovePoints = volatilityMoveDecimal / 0.01`;
- `elapsedDays = elapsedYearFraction * 365`;
- `rateMove100bp = rateMoveDecimal / 0.01`.

The residual is `actual - approximate`, not a miscellaneous error bucket. The interface explains that omitted cross terms, curvature beyond gamma, surface dynamics, expiry discontinuity and finite shocks can create residuals.

### Delta hedge

An underlying hedge uses

\[
q_S=-\Delta_P,
\]

where \(\Delta_P\) is aggregate portfolio delta in underlying units. The hedge line reports quantity, direction, estimated transaction value and post-hedge Greeks.

### Two-risk option hedges

For a chosen hedge option \(H\), gamma neutralization is

\[
q_H=-\frac{\Gamma_P}{\Gamma_H},
\qquad
q_S=-(\Delta_P+q_H\Delta_H).
\]

Vega neutralization uses the same structure with \(\nu\):

\[
q_H=-\frac{\nu_P}{\nu_H},
\qquad
q_S=-(\Delta_P+q_H\Delta_H).
\]

The engine rejects an option hedge when the selected hedge Greek is non-finite or below a declared tolerance. The interface shows all post-hedge Greeks so users see theta, rho and the non-targeted risk created by the hedge. It does not claim that one option plus underlying can neutralize more than two independent risks.

### Terminal payoff and profit

For terminal spot \(S_T\):

\[
\Pi_{call}=w\max(S_T-K,0)-w p,
\]

\[
\Pi_{put}=w\max(K-S_T,0)-w p,
\]

\[
\Pi_{underlying}=w(S_T-S_0).
\]

Gross payoff excludes the premium/entry cash flow. Profit includes it. The chart can display both but never conflates them.

### Exact piecewise analysis

Unique sorted strikes partition \([0,\infty)\) into linear intervals. Within each interval, every max function has a known active branch, so total profit is represented as

\[
\Pi(S)=aS+b.
\]

Breakevens are roots inside their valid intervals. Duplicate roots are merged within a numerical tolerance. Maximum gain/loss are determined from interval endpoints and the final slope as \(S\to\infty\):

- positive final slope implies unlimited maximum gain;
- negative final slope implies unlimited maximum loss;
- zero final slope implies a finite right-tail plateau;
- the left boundary is evaluated at \(S=0\).

This exact algebra replaces grid-based guesses. Invalid or mixed expiries disable terminal strategy classification and explain why.

### Put-call parity and synthetic identities

At expiry, same-strike/same-expiry legs support exact payoff identities such as long call plus short put equalling a synthetic forward payoff. Pre-expiry comparisons include the correct discounted strike and dividend carry through Black–Scholes parity. Equivalence is reported only when strikes, maturities, quantities and multipliers satisfy the typed rule.

## Quant module boundaries

Create focused framework-free modules:

- `src/quant/portfolio/types.ts` — public contracts and units.
- `src/quant/portfolio/valuation.ts` — position valuation and aggregation.
- `src/quant/portfolio/scenarios.ts` — full repricing, Taylor explain, spot-volatility and time grids.
- `src/quant/portfolio/hedging.ts` — delta and option-based two-risk hedge construction.
- `src/quant/strategies/payoff.ts` — terminal leg values, piecewise intervals, breakevens and extrema.
- `src/quant/strategies/presets.ts` — curated, validated strategy definitions and taxonomy.
- `src/quant/strategies/transfer.ts` — versioned serializable cross-lab payload validation.

No module imports React, localization, browser storage or route types. Pure functions accept complete inputs and return either valid outputs or typed validation failures. Calculations do not silently clamp invalid user inputs except remaining time at expiry; UI controls may constrain normal editing ranges.

## Portfolio workspace

### Information hierarchy

1. Compact title, data/model status and Academy links.
2. Shared market-state toolbar.
3. Editable position table.
4. Aggregate valuation and Greek strip.
5. Risk decomposition and hedge construction.
6. Scenario workspace with actual-versus-approximate P&L.
7. Spot-volatility heatmap and time-decay profile.
8. Collapsed assumptions, units and model limits.

The position table is the primary control surface. Desktop uses columns for instrument, side, quantity, multiplier, strike, maturity, premium/entry and actions. Mobile renders the same controls as compact position groups without hiding fields.

### Greek interdependency

Selecting a row highlights that position across the Greek table and charts. The aggregate row remains visible. Adding, removing or changing one leg updates the before/after delta, gamma, vega, theta and rho vector in one calculation pass.

### Hedge workflow

The user chooses:

- delta only;
- delta plus gamma; or
- delta plus vega.

For an option hedge, the user selects call/put, strike, maturity and volatility inherited from or explicitly tied to the shared state. The proposed tickets are previews until the user chooses **Apply hedge**. Applying adds ordinary positions, so there is no hidden hedge state.

### Scenario workflow

The scenario toolbar controls spot move, volatility move, elapsed days and rate move. It displays actual P&L, each Taylor contribution, approximation total and residual. The heatmap varies spot and volatility around the current state using full repricing. A numeric table is the accessible alternative and source of exact cell values.

## Strategy workspace

### Information hierarchy

1. Compact title, single-expiry boundary and model status.
2. Purpose taxonomy and validated presets.
3. Editable leg table and shared market state.
4. Profit/payoff chart with leg overlays and expected landing zone.
5. Cost, breakeven, maximum gain/loss and direction/volatility interpretation.
6. Exact settlement inspector and piecewise algebra.
7. Pre-expiry mark-to-market, time/volatility scenarios and aggregate Greeks.
8. Modify-one-leg comparison and parity/synthetic-equivalence notes.
9. **Open in Portfolio Lab** transfer action.

### Presets and taxonomy

Presets are definitions, not recommendations. Initial coverage is:

- directional: long/short call, long/short put, synthetic long/short;
- income/overwrite: covered call, cash-secured short put;
- protection: protective put, collar;
- vertical spreads: bull call, bear put, bear call and bull put;
- volatility: long/short straddle and long/short strangle;
- bounded structures: long call butterfly and iron condor;
- skew expression: long and short risk reversal.

Every preset is generated from the same public position contract and passes the same validation as manually entered legs. Invalid strike order produces a specific message; it never silently reorders user-authored legs.

### Start from a view

The view selector maps a direction and volatility thesis to educational candidate structures. It presents trade-offs—premium, tail exposure, capped upside and Greek profile—and never chooses a strategy or uses recommendation language. If the expected landing zone lies wholly on an economically flat segment, or crosses a breakeven, the interface explains the mismatch.

### Mark-to-market

Because the existing engine supports European option repricing, the strategy lab includes a today/pre-expiry value profile. The expiry chart remains separate. A view label always identifies `EXPIRY PROFIT`, `EXPIRY PAYOFF` or `PRE-EXPIRY MTM`.

## State and integration

### Strategy to Portfolio

The strategy workspace writes a versioned payload to `sessionStorage` only when the user activates **Open in Portfolio Lab**, then navigates to `/analytics/portfolio?from=strategy`. The portfolio route validates the payload before use and clears only the consumed transfer key. Invalid or stale payloads fall back safely and show a non-blocking message.

The payload contains only synthetic/manual analytical inputs. It contains no account, order or personal data. Session storage is chosen over a long encoded URL because arbitrary leg books would create brittle and difficult-to-audit query strings.

### Assistant context

Each workspace sets high-level page context and writes a compact serialized lab summary consistent with the existing `tqb-lab-context` behavior. The assistant may explain selected strategy, aggregate risk, scenario and declared model boundaries. It never mutates the portfolio or acts as a pricing authority.

### Discovery

The Analytics hub gains two primary cards. Core search gains both canonical routes. Existing `/lab` tabs remain unchanged and are not duplicated inside the new routes. Academy cross-links point to:

- `/learn/derivatives/black-scholes-replication-pricing`;
- `/learn/risk/first-order-greeks`;
- `/learn/risk/higher-order-greeks`;
- `/learn/risk/hedging-pnl-attribution`.

## Visual and interaction design

The workspaces use the existing warm editorial shell with a restrained analytical stage. They avoid retail trading colors, large decorative illustrations, nested card grids and copied Atlas styling.

- Tables and charts dominate; prose is concise and progressively disclosed.
- Positive/negative colors are semantic and never the only signal.
- Breakpoints, zero P&L, current spot and expected landing zone use distinct line styles and labels.
- All controls have labels and at least 44px touch targets where compact.
- Charts provide keyboard inspection and numeric alternatives.
- Wide tables scroll inside their own region rather than widening the page.
- At 768px and below, controls precede outputs and position rows become compact groups.
- Reduced motion disables scenario autoplay; manual controls remain available.
- The two-dimensional heatmap is the required scenario view. No 3D code is shipped in Release 1.

## Validation and failure handling

### Domain validation

Reject or explicitly classify:

- non-finite numbers;
- non-positive spot, strike or multiplier;
- negative quantity;
- negative volatility or maturity;
- valuation time beyond all expiries for mark-to-market analysis;
- mixed expiries in terminal strategy metrics;
- hedge instruments with near-zero target Greek;
- invalid preset strike ordering;
- transfer payloads with unknown version or malformed positions.

Negative rates are valid. Zero time and zero volatility use the existing pricing-engine boundaries. Deep ITM/OTM states and very high volatility must remain finite. Duplicate strikes are valid and consolidated only for interval analysis, not by mutating the user positions.

### Numerical tests

- Black–Scholes analytical Greeks against symmetric finite differences with unit-aware tolerances.
- Long/short call and put terminal profit references.
- Covered call, protective put, collar, vertical spreads, straddles, strangles, butterfly and iron-condor breakevens and bounds.
- Put-call parity and synthetic-forward equivalence.
- Position sign, quantity and multiplier scaling.
- Portfolio value and Greek aggregation.
- Delta hedge neutrality.
- Delta-gamma and delta-vega hedge target neutrality plus non-target risk reporting.
- Actual repricing versus Taylor approximation under shrinking shocks.
- Scenario-grid determinism and base-cell zero P&L.
- Expiry, zero-volatility, negative-rate, zero-quantity, duplicate-strike, unbounded-tail and invalid-transfer cases.

Tests assert invariants and analytical values, not snapshots of numerical output.

### Rendered and browser tests

- Both routes render canonical headings, model/demo status, position tables and numerical alternatives.
- EN/ES labels and financial units remain aligned.
- Analytics hub and search resolve the new routes once each.
- Strategy transfer reconstructs the same typed positions in Portfolio.
- Adding/removing/editing a leg updates every dependent output.
- Hedge preview does not mutate positions; applying it does.
- Settlement, expected-zone and chart view controls update exact readouts.
- 375, 768, 1280 and 1440px show no document-level horizontal overflow.
- Keyboard focus, table editing, chart inspection and disclosure controls work.
- Light/dark contrast and reduced-motion behavior pass.

### Repository gates

Before handoff: targeted quant tests, `npm run typecheck`, `npm run lint`, `npm run i18n:audit`, `npm test`, `npm run build` and `npm run cloudflare:preflight` must pass. Production deployment remains a separate explicit release action.

## Documentation

Implementation adds:

- `docs/analytics/portfolio-greeks-lab.md` — model, unit, hedge and scenario contract;
- `docs/analytics/strategy-payoff-lab.md` — payoff, profit, MTM and interaction contract;
- `docs/analytics/strategy-definitions.md` — exact preset legs, taxonomy and validation.

Existing quant-convention and visualization documents are updated only where the new public contracts extend them.

## Definition of done

Release 1 is complete when:

- both canonical Analytics routes are discoverable and functional;
- arbitrary valid calls, puts and underlying positions can be entered and edited;
- position and aggregate value plus Delta/Gamma/Vega/Theta/Rho are correct and unit-labelled;
- delta and option-based two-risk hedges show tickets, post-hedge risk and side effects;
- full-revaluation and Taylor P&L reconcile with a visible residual;
- spot-volatility and time-decay scenarios share one validated state;
- strategy profit/payoff, premiums, breakevens and finite/unlimited bounds are exact;
- all declared presets pass their quantitative contracts;
- settlement, piecewise algebra, view mismatch and pre-expiry MTM are linked to the edited legs;
- Strategy transfers its exact legs into Portfolio;
- EN/ES, desktop/mobile, keyboard, numeric alternatives and reduced motion pass;
- targeted numerical, rendered, full repository and Worker build gates pass.

## Release boundary

Design, implementation and validation occur on `codex/analytics-portfolio-strategies`. Merge, push and production deployment require separate explicit confirmation after the completed implementation is reviewed.
