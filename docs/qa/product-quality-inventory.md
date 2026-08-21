# Product quality inventory

**Baseline:** `953751ceb1388a235ddce5bb731159342d15027a`
**Purpose:** Characterize the approved refinement scope before implementation. This is an inventory, not a behavioral change.

## Academy

| Inventory | Current quantity | Decision | Characterization |
| --- | ---: | --- | --- |
| Academy tracks | 6 | RESTRUCTURE | Preserve all routes and content; reorganize the canonical renderer around essentials, then progressively reveal depth. |
| Canonical deep lessons | 41 | REFINE | Retain every lesson and calculation; compact presentation, notation and cross-links. |
| Canonical lesson renderer (`AcademyLessonPage`) | 1 | RESTRUCTURE | Replace the fixed, long section rhythm with the approved progressive-disclosure rhythm. |
| Legacy `ConceptArticle` path | 114 concepts | SIMPLIFY | Retain legacy routes and localized content; avoid parallel presentation evolution where a canonical lesson exists. |

### Canonical lesson routes

| Track | Decision | Lessons (all KEEP) |
| --- | --- | --- |
| Foundations | RESTRUCTURE | Filtrations & adapted processes; Conditional expectations & martingales; Equivalent measures & Radon–Nikodym densities; Girsanov theorem & risk-neutral pricing; Numeraires & forward measures |
| Volatility | REFINE | Realized volatility; Realized versus implied volatility; Implied volatility; Volatility smile and skew; Volatility term structure; Volatility surface; Local volatility; Stochastic volatility; Heston model; SABR; Volatility-model calibration; Vega, vanna and volga |
| Rates | REFINE | Discount factors and present value; Zero rates and forward rates; Rate conventions, calendars and schedules; OIS and overnight compounding; FRAs, rate futures and convexity; Interest-rate swaps; Caps, floors and swaptions; Curve construction and bootstrapping; Curve interpolation, extrapolation and arbitrage; Multi-curve valuation and basis; Curve risk, carry and roll-down; Hull–White one-factor model; HJM and market-model dynamics |
| Numerical finance | REFINE | Monte Carlo estimation; Euler, Milstein & exact schemes; Variance reduction & convergence; Fourier & COS pricing |
| Greeks & hedging | REFINE | First-order Greeks; Gamma, vanna & volga; Hedging & P&L attribution |
| Risk & xVA | REFINE | Exposure: EE, EPE & PFE; CVA, DVA & FVA; VaR & Expected Shortfall; Model risk & governance |

## Analytics and visualization

| Inventory | Decision | Characterization |
| --- | --- | --- |
| European option pricer (`/lab?lab=vanilla`) | KEEP | Existing calculator and route remain. |
| Greeks dashboard (`/lab?lab=greeks`) | SIMPLIFY | Keep the calculator; compact the workspace to controls, primary output and optional detail. |
| Volatility surface workbench (`/analytics/volatility`) | COMBINE | Preserve the route and linked state while consolidating compatible implementations. |
| Yield-curve engine (`/lab?lab=curve`) | REFINE | Keep calculations and route; improve compactness, labels and accessible fallback. |
| `syntheticSurface.ts` kernel and `SurfaceCanvas` renderer | COMBINE | Consolidate with the Academy surface only behind one framework-free shared model where behavior is compatible. |
| `volSurface.ts` kernel and `VolSurfaceCanvas` renderer | COMBINE | Preserve its linked grid, scenarios and accessible table while becoming the other input to the shared surface model. |
| `LineChart` | REFINE | Keep shared chart behavior; standardize financial axes, ticks, grid and tooltip formatting. |
| Heatmaps | REFINE | Keep as the legible 2D fallback; standardize color scale and numeric/tabular access. |
| Curve Canvas | REFINE | Keep current curve diagnostics while applying shared formatting and accessible alternatives. |
| Greek matrix | SIMPLIFY | Retain desk-unit outputs; reduce competing visual weight. |
| 3D surface | REFINE | Retain rotation and zoom on capable displays; use the existing 2D treatment when it is not legible. |

## Shared product surfaces

| Inventory | Decision | Characterization |
| --- | --- | --- |
| Homepage | RESTRUCTURE | Replace the poster composition with editorial discovery and a map of existing destinations. |
| Global search | FIX | Include canonical Academy lessons and verified existing destinations without duplicate legacy aliases. |
| i18n | KEEP | Preserve EN/ES and device-local locale behavior; add all new UI strings to both dictionaries. |
| Global CSS tokens | RESTRUCTURE | Consolidate touched Academy, formula, code, chart and semantic-state tokens while preserving the warm off-white, near-black and oxblood base. |

## Measured baseline and release exclusions

- The repository has six Academy tracks, 41 canonical deep lessons, 114 legacy concepts, 108 canonical lesson formulas and 182 derivation steps.
- Representative production lessons render between roughly **8,000 and 10,700 pixels** high.
- The Learn landing page exceeds **15,000 pixels** and presents more than **200 similarly weighted content elements**.
- Excluded: new curriculum topics, tracks or lessons; new Analytics calculators or market-data providers; account, mastery, collaboration or saved-scenario backends; proprietary competitor content, terminal emulation or licensed-data redistribution; a second math renderer or heavyweight graph dependency without proven necessity; unrelated infrastructure or assistant-character redesign.

## Final disposition

The refinement retained the full inventory and resolved the release-scoped structural defects:

- All 6 tracks, 41 canonical lessons, 114 legacy concepts and 108 canonical formulas remain reachable. Formula depth is now explicit (29 definition, 46 short-derivation and 33 full-derivation formulas), with all 41 lesson derivations bound to their intended formula.
- Canonical lessons now keep intuition, market context, formulas, labs and desk interpretation visible while placing derivations, notation, assumptions, code and references behind same-page native disclosures. At 1280px, representative heights fell from the 8,000–10,700px baseline to 4,770px (Girsanov), 6,177px (Heston) and 5,409px (interest-rate swaps).
- The Learn landing retains all canonical and legacy destinations while reducing its measured height from more than 15,000px to 13,030px with track stages closed by default.
- The two volatility-surface implementations were combined behind the canonical framework-free model. `/analytics/volatility`, `/lab?lab=surface` and the Academy surface lesson now use the same validated grid, controls, scenarios, heatmap, 3D view and numeric fallback; the duplicate kernel and renderer were removed.
- Financial charts now share validated domains, explicit financial-unit formatters, theme tokens, keyboard inspection and numeric alternatives. Greek matrices expose semantic cells and desk units.
- The homepage now discovers real platform capabilities through a 10-node, 21-edge, keyboard-accessible knowledge map. Global search includes all 41 canonical lessons and 6 tracks through an on-demand Academy index, with EN/ES ranking and route deduplication.
- The touched Academy, formula, code, chart and analytical surfaces now share one dark token owner and one light override. EN/ES interface dictionaries contain 98 aligned keys; the reviewed authored-localization boundary is recorded in `docs/i18n-audit.md`.

No new track, lesson, calculator, provider, runtime dependency or public route was introduced.
