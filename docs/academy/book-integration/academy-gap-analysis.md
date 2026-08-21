# Academy gap analysis

Scores are based on current canonical content, rendered structure, formula/derivation depth, labs, and source traceability. Book depth measures how much the reference contributes, not how much the platform should reproduce.

| Domain | Current quality | Book depth | Gap | Action |
|---|:---:|:---:|:---:|---|
| Probability distributions and transforms | 4/5 | 5/5 | Low/medium | Canonical foundation integrated; moments/CFs linked to MC and COS |
| Brownian motion and stochastic integration | 4/5 | 5/5 | Low/medium | Canonical path, quadratic variation and Itô sequence integrated |
| Asset dynamics under P and Q | 4/5 | 4/5 | Low | Canonical GBM lesson separates estimation, drift, discounting and pricing measure |
| Black–Scholes pricing and hedging | 4/5 | 5/5 | Low/medium | Contract, replication, PDE, expectation, solution and hedge unified in one lesson |
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

1. **Resolved — repeated lesson rhythm:** canonical lessons now select from seven teaching profiles; legacy notes select from six archetypes, all with EN/ES headings.
2. **Resolved — generic advanced prerequisites:** advanced lessons now carry explicit topic dependencies, including the new stochastic-pricing spine.
3. **Resolved — shallow legacy collision:** probability, Brownian/Itô, P/Q dynamics and Black–Scholes routes resolve to four canonical foundations.
4. **Resolved for the new spine — generic Python:** the four new lessons use topic-specific deterministic code and framework-free invariant tests. Remaining generated advanced labs are tracked for family-by-family replacement.
5. **Resolved — generic legacy mathematics:** 64 generated notes now expose topic-specific, strict-KaTeX-validated formulas plus archetype-specific assumptions and desk interpretation.
6. **Still active — structure before expansion:** specialist gaps remain real, but jump/Lévy, SLV, hybrids, LMM and cross-currency content stays deferred until its prerequisite track is upgraded.
