# Academy source registry

Reviewed 12 August 2026. The runtime registry lives in `src/content/academy/sources.ts` and is rendered by `SourceReferences`.

| ID | Source | Authority | License | Use |
|---|---|---|---|---|
| `grzelak-computational-finance` | LechGrzelak/Computational-Finance-Course | Teaching/research | BSD-3-Clause | Volatility progression, numerical experiments, Heston path |
| `grzelak-ir-xva` | LechGrzelak/FinancialEngineering_IR_xVA | Teaching/research | BSD-3-Clause | Future rates, curves and xVA dependency map |
| `grzelak-quantlib-fork` | LechGrzelak/QuantLib | Historical reference only | QuantLib permissive | Architecture context; not current API authority |
| `quantlib-upstream` | lballabio/QuantLib | Current implementation authority | QuantLib permissive | Current release, source architecture and tests |

## Review findings

- Computational Finance Course organizes implied volatility, stochastic volatility and Heston simulation as distinct progressive lectures.
- Financial Engineering IR/xVA is the appropriate source map for the next rates/curves and later xVA tracks, not a reason to shallowly add those topics now.
- LechGrzelak/QuantLib is a fork and is explicitly classified as historical.
- Current upstream QuantLib release `v1.42.1` is pinned for this review. The `1.42` release added `PiecewiseBlackVarianceSurface` for ragged grids; the upstream volatility tree contains current smile-section, SABR and ZABR structures.

No third-party code is copied into Academy V2. Concepts and algorithms are independently expressed and implemented. Licenses remain linked for auditability.
