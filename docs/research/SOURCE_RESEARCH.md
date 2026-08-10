# Source research

Reviewed 10 August 2026. This research separates code, teaching media, documentation and data rights.

## Sources inspected

| Source | Material inspected | Legal classification | Product decision |
|---|---|---|---|
| Computations in Finance | Current channel catalogue and 29 current video pages/titles | Educational video; no code/content licence inferred | Synthesize original explanations and cite individual videos/channel; no transcripts or slides copied |
| QuantFinanceBook | Repository tree, all 15 Python chapter folders, representative BSM/Greeks, IV, MC, Heston, COS, local-vol and calibration scripts, README and LICENSE | BSD-3-Clause code repository plus separately copyrighted book | Reference algorithms and reimplement typed production code; do not import monolithic scripts |
| FinancialEngineering_IR_xVA | 14 lecture folders, material tree, multi-curve, Hull–White exposure and hybrid FX scripts, README and LICENSE | BSD-3-Clause code repository plus educational lectures/book references | Use as an architecture roadmap; no rates/xVA code enters V0 |
| LechGrzelak/QuantLib | Fork structure, `ql/instruments`, pricing engines, processes, term structures, tests and LICENSE | QuantLib permissive licence | Reference only |
| Official QuantLib | Current repository, reference docs, European/vanilla options, Black calculators/formulae, processes, volatility/yield term structures, tests and licence | QuantLib permissive licence | Optional validation engine, isolated from normal startup |
| Market providers | Official pricing, API and licensing pages for Twelve Data, Finnhub, Alpha Vantage and ECB Data Portal | API output and market data subject to provider/exchange rights | ECB public reference data plus explicit demo fallback; commercial quote feeds remain server-only and opt-in |

## Actionable conclusions

1. Transparent BSM, Garman–Kohlhagen and Black–76 implementations belong in our domain engine; QuantLib is a reference, not the explanatory core.
2. Robust implied-volatility inversion must validate bounds and use a bracketed solver. The book's Newton examples are useful teaching references but not safe production defaults.
3. Scenario requests are matrices, not per-cell calls. The Python endpoint builds one array result.
4. Market status and two timestamps are part of the quote type, not UI decoration.
5. The public site cannot display Twelve Data/Finnhub/Alpha Vantage free-plan quotes as though redistribution were granted. Demo and ECB reference states remain visibly distinct.
6. The interest-rate/xVA material defines a dependency sequence: probability → curves → rates products → volatility → exposure → xVA.

## Reuse classification

- **REUSE:** no third-party source code copied into the product.
- **ADAPT:** no line-level adaptations.
- **REIMPLEMENT:** analytical formulae, bound checks, bracketed inversion, vectorized scenario architecture and teaching progression were independently implemented.
- **REFERENCE ONLY:** repository examples, YouTube teaching, QuantLib APIs/tests and all advanced model material.
