# Quant Visualization

Reusable primitives live under `src/components/charts`. `LineChart` provides the shared grid, zero reference, crosshair, tooltip, series colors and number formatting. `SurfaceCanvas` provides a rotatable, zoomable volatility surface with point inspection and camera reset. The curve canvas supports draggable nodes and linked zero/forward outputs.

The grammar covers line, smile, term curve, surface, heatmap and sensitivity views. Payoff and distribution primitives should reuse the same axes, tooltips, reference lines and semantic colors.

Rates and volatility are decimal inputs; UI may display percent. Vega is per one volatility point, theta per day and rho per 100bp. Every chart identifies synthetic versus provider-backed data.
