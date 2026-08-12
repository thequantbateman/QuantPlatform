# Interactive visualisation QA inventory

Reviewed: 2026-08-13  
Scope: `/analytics`, `/analytics/volatility`, `/lab`, Academy volatility and rates lessons.  
Data mode: all checked visualisations use deterministic educational inputs unless a page explicitly labels an external provider.

## Analytics and shared Quant Lab

| Surface | Controls exercised | Linked outputs | Quantitative checks | Status |
| --- | --- | --- | --- | --- |
| European option pricer | asset/model, call/put, spot, strike, time, rates, volatility, scenarios | premium, Greeks, spot/vol matrix, smile and convergence | BSM parity/reference values; Black–76 and GK finite positive prices; unit conventions displayed | Pass |
| Black–Scholes lab | call/put, six numeric/range inputs, ITM/ATM/OTM, time animation | price, delta, gamma, point-vega, daily theta, 100bp rho, value curve | analytical reference, parity and short-time/low-vol boundaries covered by `tests/quant.test.ts` | Pass |
| Greeks dashboard | Greek selector, state controls, scenario presets | 1D risk curve, 2D risk geometry, live metrics | position notional scaling and finite scenario matrix covered by tests | Pass |
| Volatility explorer | slice/surface views, level/skew/curvature/term controls | smile, term and surface canvases | positive finite deterministic grids and scenario deformation covered by tests | Pass |
| Yield-curve explorer | draggable quote nodes, exact ranges, reset, +25bp, steepen, flatten, +1bp | quote, zero, discount and forward table/canvas | zero/discount inversion, forward consistency, par swap, interpolation and invalid-domain tests | Pass |

## Volatility surface workbench

| View/control | Expected dependency | Browser result | Status |
| --- | --- | --- | --- |
| Heatmap node selection | selected maturity, strike/moneyness, implied vol and scenario spot update together | Exact node values and accessible cell labels update | Pass |
| 3D surface | same grid as other views; height and heat colour encode implied volatility | Dense heat-coloured mesh, legend, node selection and camera controls render | Pass |
| Smile slice | maturity buttons change the K/S slice | Canvas redraws from the same surface state | Pass |
| Term slice | selected moneyness changes the maturity slice | Canvas redraws from the same surface state | Pass |
| Spot/ATM/skew/curvature/term parameters | regenerate grid and every linked view | Values remain finite and positive across declared ranges | Pass |
| Crash/spike/inversion/skew/normalisation scenarios | deform only the documented dimensions; playback controls phase | Crash lowers scenario spot and raises front/downside volatility; inversion raises front ATM over long ATM | Pass |
| Accessibility fallback | numerical table exposes the complete surface | Expandable grid present; canvas has descriptive accessible names | Pass |

Corrections made during this audit:

- Localised Analytics tool descriptions and volatility surface readout/slice labels for EN/ES.
- Converted slice-chart volatility series from decimal to percentage points and labelled the y-axis with `%`.
- Retained the heatmap and exact-value table as the primary accessible alternative to the 3D projection.

## Academy rates track

Every rate lesson exposes one deterministic scenario lab. The audit covered discounting, zero/forward rates, conventions, OIS, FRA/futures convexity, swaps, curve construction, interpolation, multi-curve, curve risk, Hull–White and HJM. Controls update their series and summary metrics from one state object; rate inputs remain decimals and rate charts declare annualised units.

The final coverage review added an explicit caps/floors/swaptions stage because optionality had previously appeared only as model context. The new lab compares normal, lognormal and shifted-lognormal regimes and exposes forward, premium and quote-volatility units.

## Responsive and runtime checks

- Desktop: 1440×900, no page-level horizontal overflow on Academy or Analytics workbenches.
- Mobile target: 390×844; workbenches stack and wide numerical tables scroll inside their own containers.
- Motion: scenario playback respects `prefers-reduced-motion`; static state and manual time control remain available.
- Runtime: no browser console errors during tab/view traversal.

## Remaining boundaries

- Synthetic surfaces are illustrative shapes, not calibrated market surfaces or forecasts.
- The curve workbench uses an explicitly labelled educational zero-quote bootstrap; instrument-calibrated helpers remain lesson material rather than live market infrastructure.
- Canvas tooltips are pointer/touch enhancements; exact values remain available through readouts and tables.
