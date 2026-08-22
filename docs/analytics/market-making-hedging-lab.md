# Market-making hedging laboratory

The laboratory is an educational dealer workflow built from synthetic market states. It separates client execution, dealer exposure, hedge execution and marked-wealth P&L so spread economics are never counted twice.

## Position and execution signs

A client buy creates a short dealer position; a client sell creates a long dealer position. Quantity remains positive and direction carries the sign. For signed dealer weight `w`, model reference price `Pmid` and execution price `Pexec`, the execution contribution is

\[
L = w(P_{mid}-P_{exec}).
\]

Client flow is executed at bid or ask and therefore begins with positive spread capture. Hedge trades cross their own spread and contribute negative liquidity P&L. The execution price is the sole carrier of this spread: no additional transaction-cost deduction is applied.

## Market and risk authority

Each synthetic underlying has spot, continuously compounded rate, dividend yield and an educational parametric volatility surface:

\[
\sigma(K,T)=\max\!\left(\sigma_{min},\sigma_{ATM}+a\log(K/S)+b\log^2(K/S)+c(T-T_0)\right).
\]

European options use the existing Black–Scholes authority. Risk is aggregated per underlying before whole-book totals. Vega is per one volatility point, theta per calendar day and rho per 100bp. Cross-Greeks use finite differences of the same price/Greek engine, so they are diagnostics rather than a second model.

## Hedge proposals

- Delta hedge: stock quantity offsets selected-underlying delta.
- Gamma or vega hedge: solve the theoretical option quantity, round to the declared lot size, then repair residual delta with stock.
- Preview: before/after risk and hedge friction are visible before execution.
- Undo: applied book changes remain explicit and reversible.

## Scenario and replay

Snapshots detach the book and market state. Scenario P&L reports full repricing as the authority and compares it with the local delta, gamma, vega, theta and rho approximation. The residual is finite-shock/model-dynamics error.

Replay uses deterministic spot, volatility, skew, rate and time events. A cash account accrues continuously; every market event and hedge execution records market, financing, liquidity, wealth-change and reconciliation fields. The comparator runs the same event path and automatically delta-hedges whenever absolute delta exceeds one unit.

## Boundaries

This is not an execution simulator or market-making recommendation. It excludes American exercise, calibrated smile dynamics, order-book queues, fill probability, adverse selection, market impact, margin and production financing. The attached workshop notes and spreadsheet informed workflow and example topology only; the typed platform engine is the numerical authority and workbook macros are not executed.
