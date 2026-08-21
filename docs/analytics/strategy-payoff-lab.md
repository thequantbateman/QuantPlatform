# Options Strategy & Payoff workspace

The workspace keeps three objects separate: terminal payoff, terminal profit after signed entry cash flows, and current Black–Scholes mark-to-market value. Presets are deterministic educational starting books; after loading, every leg is editable and becomes authoritative.

Exact breakevens and finite or unlimited gain/loss bounds are derived from the piecewise-linear intervals in `src/quant/strategies/payoff.ts`. The chart samples those exact functions only for display and is never the source of terminal metrics. Each interval exposes its domain, active legs and equation `aS + b`.

Option premiums are non-negative per-unit inputs. Long premium is a debit; short premium is a credit. Quantity, direction and contract multiplier are applied once through the shared portfolio position contract. Terminal classification requires one common option expiry. Mixed expiries leave the editor and mark-to-market risk available but disable exact terminal metrics.

The settlement inspector decomposes payoff, signed entry cash flow and profit by leg. The scenario-Greeks section is explicitly mark-to-market: it shocks calendar time and volatility while retaining the current Black–Scholes boundary. It is not a forecast or a terminal payoff classification.

“Open in Portfolio Lab” writes one validated, versioned payload to session storage and navigates to `/analytics/portfolio?from=strategy`. The Portfolio workspace consumes and deletes only that documented key after successful validation. No raw book is written to the assistant context.
