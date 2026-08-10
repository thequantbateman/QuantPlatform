# Quant conventions · TQB-QUANT-2026-08

- Rates and volatilities are decimals; `0.05` means 5%.
- Time is an ACT/365-like year fraction in V0.
- Rates are continuously compounded; discount factor is `exp(-rT)`.
- BSM spot is units of quote currency per underlying share/unit; dividend yield is continuous.
- FX spot is domestic currency per one unit of foreign currency. `rate` is domestic, `foreign_rate` is foreign; forward is `S exp((rd-rf)T)`.
- Black-76 takes an observed forward/futures level and a separate discount rate.
- Option type is call or put. Prices and monetary Greeks are per unit, then multiplied by positive notional.
- Delta is per one underlying unit; gamma per underlying-unit squared.
- Vega is reported per one volatility point (`raw vega × 0.01`).
- Theta is per calendar day (`annual theta / 365`).
- Rho is per 100bp (`raw rho × 0.01`). FX additionally exposes domestic and foreign rho.
- Intrinsic value uses current spot for BSM/GK and discounted forward intrinsic for Black-76.
- Volatility is USER input until a licensed option-volatility source or calibrated surface exists.
