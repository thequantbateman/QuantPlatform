# Interest rates and xVA engine roadmap

The repository's 14 lectures and material folders were inspected. Key observed assets include HJM, CIR/Ho–Lee/Hull–White paths and ZCBs, caplets, swaps, multi-curve construction, Jamshidian decomposition, shifted lognormal models, hybrid FX/IR, market-model convexity, netted exposures, historical VaR and Monte Carlo VaR.

| Version | Domain | Required foundations | Representative research material | Deliverable gate |
|---|---|---|---|---|
| V0 | Vanilla options | Measures, discounting, robust numerics | Lecture 02 martingale/measure material | Current BSM/GK/Black-76 |
| V1 | Monte Carlo | RNG, convergence, confidence intervals | `Martingale.py`, book Ch09 | Analytical consistency |
| V2 | Volatility | Surface conventions/calibration | Hybrid lecture IV scripts | Arbitrage diagnostics |
| V3 | Curves | Instruments, calendars, interpolation, discount/forecast split | `MultiCurveBuild.py`, `YieldCurveBuildGreeks.py` | Reprice inputs and bump risk |
| V4 | Rates products | FRA/swap cashflows and schedules | `Swaps_HW.py`, caplet/ZCB option scripts | Par identities |
| V5 | IR volatility | Normal/shifted lognormal, HW, swaptions | `JamshidianTrick.py`, `ShiftedLognormal.py` | Market quote conventions |
| V6 | Cross-asset | Domestic/foreign curves and correlations | `H1_HW_COS_vs_MC_FX.py` | Measure-consistent FX forwards |
| V7 | Exposure | Pathwise portfolio valuation, netting, collateral | `Exposures_HW_Netting.py` | Exposure profile invariants |
| V8 | xVA | Default curves, funding, wrong-way risk | Lecture 12 xVA | CVA/DVA/FVA reconciliation |

The current engine must not add V3+ abstractions prematurely. The stable seam is a model-neutral request/analytics schema plus explicit market-data lineage.
