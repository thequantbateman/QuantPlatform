# Academy visual labs

## VolSurfaceLab contract

`VolSurfaceLab` owns interaction. `src/quant/volatility/volSurface.ts` owns values.

Inputs:

- spot
- ATM volatility
- log-moneyness skew
- curvature
- term slope
- controlled scenario and phase

Outputs:

- heatmap: default 2D analytical view with numeric cells
- 3D: canvas projection with rotate, zoom, hover and point selection
- smile: selected maturity slice
- term structure: selected moneyness slice
- exact selected-node readout
- accessible numeric table

## Scenario semantics

`spot-crash`, `vol-spike`, `term-inversion`, `skew-steepening` and `normalization` are deterministic deformations. They are educational simulations, never observations or predictions. The visible UI states this twice.

## Accessibility

- Heatmap buttons expose maturity, strike, moneyness and volatility as accessible names.
- Numeric cell values remain visible without relying on color.
- 3D is optional, never the only representation.
- The underlying grid is available as a table.
- Controls have labels and keyboard-operable native inputs.
- Playback stops instead of starting when `prefers-reduced-motion` is enabled.
- Mobile defaults remain usable with horizontally scrollable matrix/table regions and stacked controls.

## Performance

The lab is loaded as a client leaf with `React.lazy` and `Suspense`. The Academy landing and static lesson content do not load the canvas workbench. No global chart or WebGL bundle was added.

## Advanced concept lab contract

`AdvancedConceptLab` routes a lesson lab ID to one of five bounded workspaces:

- information: filtration reveal and conditional expectation;
- measure: P, Q and T-forward measure state plus Girsanov density;
- numerical: shared-shock exact/Euler/Milstein paths, Monte Carlo error, variance reduction and transform diagnostics;
- Greeks: analytical desk-unit risk, higher-order finite differences and discrete hedge P&L;
- portfolio risk: EE/PFE/collateral, simplified CVA, VaR/ES and governance thresholds.

Every workspace uses native labelled controls, deterministic state, exact metric readouts, a chart or timeline, a linked `QuantFlow`, and an explicit model boundary. New numerical logic is tested in framework-free modules rather than embedded in React.

## Visual direction

The workbench uses the platform’s neutral, theme-aware interactive hierarchy: warm editorial paper, espresso analytical surfaces, fine scientific grids, orange/oxblood emphasis and concise monospace annotations. Blue, cyan and heat colors remain available only for quantitative encodings. The supplied handwritten-equation and surface screenshots informed composition, not branding or copied assets.
