# Portfolio, Greeks & Hedging model contract

The workspace aggregates European calls, puts, and underlying positions through the existing Black–Scholes implementation. A position weight is

\[
w_i = \operatorname{sign}_i\,q_i\,m_i,
\]

where `q` is quantity and `m` is the contract multiplier. Price and every reported Greek are scaled exactly once by this signed weight.

## Desk units

- Delta: value change per one spot unit.
- Gamma: delta change per one spot unit.
- Vega: value change per one volatility percentage point.
- Theta: value change per calendar day.
- Rho: value change per 100 basis points.

Rates and volatilities enter the engine as decimals. Time is ACT/365-like and rates are continuously compounded.

## Scenario attribution

Full repricing is compared with the local approximation

\[
\Delta V \approx \Delta\,\Delta S + \tfrac12\Gamma(\Delta S)^2
  + \text{Vega}\frac{\Delta\sigma}{0.01}
  + \Theta\,\Delta d
  + \text{Rho}\frac{\Delta r}{0.01}.
\]

The residual is full-repricing P&L minus the sum of these buckets. It is approximation error, not an unexplained cash flow.

## Hedge proposals

A delta hedge adds underlying quantity `−portfolio delta`. Delta–gamma and delta–vega proposals first solve for the fractional number of one declared hedge-option contract required to offset the target Greek, preserving that option’s multiplier. An underlying ticket then restores delta neutrality. If the candidate option has an absolute target Greek below `1e-10`, the proposal is unavailable rather than numerically amplified.

Proposals are previews composed of ordinary positions. Applying one replaces the visible book explicitly; no hidden mutation occurs.

## Boundaries

Inputs are manual and synthetic educational data. The release does not model transaction costs, financing, discrete dividends, early exercise, smile dynamics, cross-Greeks, path-dependent hedging, or liquidity. Local Greek attribution is expected to diverge from full repricing as shocks grow.
