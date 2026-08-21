# Academy gap analysis

Scores are based on current canonical content, rendered structure, formula/derivation depth, labs, and source traceability. Book depth measures how much the reference contributes, not how much the platform should reproduce.

| Domain | Current quality | Book depth | Gap | Action |
|---|:---:|:---:|:---:|---|
| Probability distributions and transforms | 2/5 | 5/5 | High | Add one compact canonical foundation; connect moments/CFs to MC and COS |
| Brownian motion and stochastic integration | 2/5 | 5/5 | High | Replace shallow legacy coverage with path, quadratic variation, Itô integral/lemma sequence |
| Asset dynamics under P and Q | 2/5 | 4/5 | High | Add GBM lesson separating estimation, drift, discounting, and pricing measure |
| Black–Scholes pricing and hedging | 2/5 | 5/5 | High | Unify contract, replication, PDE, expectation, solution, and hedge in one deep lesson |
| Filtrations and conditional expectation | 4/5 | 4/5 | Medium | Keep strong content; repair prerequisites and cross-links |
| Measure change, Girsanov, numeraires | 4/5 | 5/5 | Medium | Keep; route new P/Q lesson into this sequence |
| Implied/local/stochastic volatility | 4/5 | 5/5 | Low/medium | Keep; later audit derivation details and calibration failure modes |
| Heston and calibration | 4/5 | 5/5 | Low/medium | Keep; prerequisite graph currently starts too late and is repaired now |
| Monte Carlo and discretization | 4/5 | 5/5 | Medium | Keep; link to Brownian/GBM invariants and later improve error taxonomy |
| Fourier-COS | 3/5 | 5/5 | Medium | Keep; future phase should deepen truncation/error evidence |
| Jump/Lévy models | 1/5 | 5/5 | High but non-blocking | Defer; first complete PDE/CF numerical spine |
| Rates/curve construction | 4/5 | 4/5 | Low | Keep current post-crisis conventions and current APIs |
| HJM/Hull–White | 4/5 | 5/5 | Medium | Keep; later check derivation continuity and measure notation |
| LMM/advanced rates | 2/5 | 5/5 | Medium | Defer to dedicated rates phase |
| Exposure/xVA | 4/5 | 4/5 | Low/medium | Keep; current product is stronger and more current than the textbook on governance framing |
| Hybrid and cross-currency models | 1/5 | 5/5 | Medium | Defer until FX/rates base tracks are deepened |

## Cross-cutting weaknesses

1. **One repeated lesson rhythm:** all canonical lessons currently use the same visible headings even when the educational task differs. Add typed narrative profiles while preserving components.
2. **Generic advanced prerequisites:** 16 generated lessons repeat “Probability and calculus” and “Discounting and no-arbitrage.” Replace them with real dependency concepts.
3. **Shallow legacy collision:** probability, Brownian motion, Itô calculus, and Black–Scholes exist in the legacy catalog but do not meet the canonical lesson contract. Route their entry points to the four deep foundations.
4. **Generic generated Python:** part of the advanced family uses a mean-of-array template unrelated to the governing equation. New lessons must use topic-specific deterministic code; later phases should replace remaining generic labs one family at a time.
5. **Structure before expansion:** advanced gaps are real, but adding them now would perpetuate the weak prerequisite spine.
