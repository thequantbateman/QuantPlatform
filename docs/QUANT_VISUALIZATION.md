# Quant Visualization

Reusable primitives live under `src/components/charts`. `LineChart` provides the shared grid, zero reference, crosshair, tooltip, series colors and number formatting. The canonical volatility workbench owns its domain-specific heatmap, slices and rotatable `VolSurfaceCanvas` under `src/components/academy`; every view consumes the same validated grid from `src/quant/volatility/volSurface.ts`. The curve canvas supports draggable nodes and linked zero/forward outputs.

The grammar covers line, smile, term curve, surface, heatmap, sensitivity, portfolio P&L and option-payoff views. Aggregate and leg series reuse the shared axis, keyboard readout, tooltip, legend and numeric-table contract. Portfolio scenario heatmaps always label spot, volatility and P&L units and provide a complete numeric alternative.

The market-making laboratory adds signed dealer blotters, per-underlying risk tables, vega topology, exact-versus-local scenario attribution and a marked-wealth replay. Replay charts are backed by a complete cash/liquidity ledger, while the delta-band comparator is calculated from the same deterministic event path and pricing authority.

Terminal payoff charts distinguish payoff from profit after signed entry cash flows. The exact piecewise engine—not the sampled line—owns breakevens and finite/unlimited bounds. Zero P&L, breakevens and any expected zone are financial reference objects; an expected zone is explanatory context, never a recommendation. Mark-to-market series are named separately and must not be presented as terminal outcomes.

Rates and volatility are decimal inputs; UI may display percent. Vega is per one volatility point, theta per day and rho per 100bp. Portfolio values and terminal profit include quantity, direction and multiplier exactly once. Every chart identifies synthetic versus provider-backed data.
