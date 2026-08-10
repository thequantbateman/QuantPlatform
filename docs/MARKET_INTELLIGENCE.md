# Market intelligence methodology

The local engine computes 1D/5D simple return, annualized sample realized volatility from log returns, rolling level z-score, range position and distance from the sample mean. FX absolute moves are shown in pips and rate moves in basis points.

Every metric uses only the displayed local series. Insufficient history returns `null`; no points are padded. These are descriptive diagnostics, not forecasts. Production use needs longer licensed histories, trading calendars, corporate-action handling and asset-specific freshness thresholds.
