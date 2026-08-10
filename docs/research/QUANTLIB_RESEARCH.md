# QuantLib research

Both the LechGrzelak fork and current official QuantLib repository/documentation were inspected.

## Architecture observed

- Instruments (`EuropeanOption`, `VanillaOption`) own exercise/payoff contracts and delegate valuation to engines.
- Market state enters through handles to quotes, yield term structures and volatility term structures.
- `BlackScholesMertonProcess` composes spot, dividend curve, risk-free curve and Black volatility.
- `BlackCalculator`/Black formulae provide forward-measure analytics used across product engines.
- Implied volatility is inversion around a pricing engine, with solver bounds and evaluation limits.
- Tests separate instrument invariants, formula references, term structures and engine comparisons.

## TQB strategy

Our V0 remains small, readable and formula-transparent. QuantLib is optional in a separate validation environment; it must not be required for web or API startup. Later professional products may adapt a QuantLib-backed provider behind the same pricing contract.

Validation target: BSM/GK can be represented with `EuropeanOption` + `AnalyticEuropeanEngine` + `BlackScholesMertonProcess`; Black-76 can be checked with `BlackCalculator`/`blackFormula`. Compare PV and Greeks using convention-aligned tolerances, especially vega per 1 vol point, theta per day and rho per 100bp.

## Licence

QuantLib uses a permissive, non-copyleft licence permitting source/binary redistribution with retained notices and no endorsement. No QuantLib code is shipped in this iteration.
