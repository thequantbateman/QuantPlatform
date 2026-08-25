# Fixed Income Spreads & Curve Analytics — Design

## Scope

Add one cohesive `/analytics/fixed-income` experience inside the existing Analytics and Rates ecosystem. The lab is synthetic/educational, deterministic, bilingual, convention-aware, and uses the existing black/orange interactive-surface system. It must teach the linked chain from cash flows to price, curve, benchmark, spread, risk, relative value, and holding-period attribution.

Validated core scope: vanilla fixed-rate bonds, cash-flow anatomy, YTM versus curve pricing, Government/Swap/OIS benchmark selection, G-spread, I-spread, full cash-flow-aware Z-spread, benchmark DV01, spread duration/CS01, DTS, key-rate DV01, curve shocks, rate × spread full-repricing heatmap, discounted-cash-flow asset-swap spread, swap spreads, relative-value comparison, carry and rolldown, guided scenarios, Academy/Ask integration, EN/ES, and responsive/a11y QA.

OAS and CDS-bond basis remain visible as explicit professional quality gates, not numeric outputs. The repository has no validated callable-rate model, CDS curve, recovery, repo, or funding infrastructure; shipping approximations would violate the brief.

## Existing dependency map

| New capability | Existing authority | Decision |
|---|---|---|
| Discount factors, zero/forward rates, par swaps | `src/quant/curves/rates.ts` | Reuse |
| Linear and log-discount interpolation | `src/quant/curves/interpolation.ts`, `rates.ts` | Reuse |
| Curve scenarios | Component-local demonstrations | Create one framework-free shared curve-shock primitive; migrate touched rates usage only |
| Bond cash flows, price, YTM, accrued, duration, convexity | None | Create shared fixed-income engine |
| Root finding | IV-specific solver only | Create shared bounded solver and preserve explicit failure diagnostics |
| G/I/Z spread, ASW, swap spread | None | Create shared spread engine using bond + curve primitives |
| DV01, spread duration/CS01, KRD, rate/spread grid | Existing UI examples are synthetic, not reusable | Create shared full-repricing risk engine |
| Carry/rolldown | Academy prose only | Create shared conditional holding-period engine |
| Charts | `LineChart`, accessible table/heatmap conventions | Reuse; add domain heatmap only |
| Guided scenarios | Analytics guidance registry, guide, events | Extend with one lab ID and curated fixed-income scenarios |
| Quant Bateman | Existing provider/context/floating assistant | Reuse exactly |
| Portfolio transfer | Option-specific position schema | Defer typed bond transfer; expose architecture boundary and route link |

## Quantitative conventions

- Rates and spreads are decimals internally; displayed rates are percentages and spreads basis points.
- Curve zero rates are continuously compounded; discount factors use log-linear interpolation.
- Bond YTM uses periodic compounding at coupon frequency.
- Schedules use deterministic ACT/365-like year fractions with regular periods and no holiday calendar in this educational release. Settlement, day count, business-day rule, compounding, clean/dirty price, benchmark and interpolation are displayed.
- Accrued interest is computed from the current regular coupon period. Dirty price is clean price plus accrued.
- Z-spread is a constant continuously compounded spread applied to every benchmark discount factor and solved against dirty market price.
- G/I spread use the bond periodic YTM less an interpolated continuously compounded benchmark zero/par proxy at maturity; the UI names this convention and warns that vendor conventions differ.
- Benchmark DV01 and key-rate DV01 are full repricing losses for a +1bp curve bump. CS01 is the full repricing loss for a +1bp Z-spread bump.
- Asset-swap spread is the discounted benchmark value shortfall/excess per swap annuity, not yield minus swap rate.
- Carry/rolldown is a conditional unchanged-curve decomposition, never an expected or guaranteed return.

## Interaction model

One linked state powers five compact modes:

1. **Bond** — inputs, price anatomy, selectable cash-flow timeline, YTM versus zero-curve valuation.
2. **Spreads** — active benchmark, curve/spread overlay, G/I/Z comparison, decision map, ASW/swap spread.
3. **Risk** — primary rate × spread P&L heatmap, rate/spread decomposition, DV01/CS01/DTS and KRD.
4. **Curve & RV** — level/slope/curvature shocks, before/after curves, DV01-weighted trade ratio, comparable-bond view.
5. **Carry** — coupon, funding, curve roll, spread roll and total conditional holding-period contribution.

The first viewport contains a compact title, benchmark/model status, guided scenarios, mode controls, a dense input rail, one primary visualization and a compact metric/Quant Bateman interpretation rail. Secondary math, conventions, limitations and Academy links use progressive disclosure.

## Visual direction contract

**THESIS:** one bond, one active benchmark and one linked repricing state; refuse disconnected calculators and giant navy cards.

**OWN-WORLD:** inherit the platform's near-black analytical surfaces, warm neutral page surfaces, thin semantic borders, orange interaction accent, serif analytical headlines and monospaced measurements. Blue appears only when it encodes benchmark data.

**STORY:** inspect cash flows, choose the ruler, reconcile spread measures, separate rate and credit P&L, then test relative value and holding-period assumptions.

**FIRST VIEWPORT:** compact Analytics header above a full-width linked workbench; controls occupy a narrow left rail, the chosen primary visual owns the center, and exact measures plus contextual guidance form a restrained right/bottom rail. No decorative hero.

**FORM:** precise local extension of the established Analytics surface; user brief is the locked composition authority, so no alternative-direction round is required.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Error, accessibility and responsive behavior

- Validation and solver failures replace metrics with an explicit recoverable error; stale values are never retained.
- Heatmap cells are semantic buttons with rate shock, spread shock, new price and P&L; a numeric table is always available.
- Cash flows are keyboard-selectable and expose date/time, amount, discount factor and PV.
- Tabs use native buttons with selected state; details/summary provide progressive disclosure.
- At 768px the workbench stacks controls above the visual. At 375px metrics wrap, tables scroll within their container, and Quant Bateman remains the existing compact floating assistant without covering controls.
- Reduced motion disables nonessential transitions; no autoplay is required.

