# Textbook integration progress

Last updated: 2026-08-21

| Phase | Status | Evidence / next action |
|---|---|---|
| Repository and Academy audit | Complete | Baseline: 41 canonical lessons, 6 tracks, 114 legacy entries; current formula/lab/i18n architecture inspected |
| PDF structural extraction | Complete | 1,310 pages; 15 chapters; 66 sections; 149 nested subsections; 735-page code supplement |
| Book taxonomy | Complete | Foundations → derivatives → volatility/models → numerics → rates/xVA → hybrids/FX |
| Academy mapping | Complete | Chapter and section mappings recorded in `book-coverage.md` and `source-map.md` |
| Gap analysis | Complete | P0 foundation gaps selected; advanced additions explicitly deferred |
| Source registry | Complete | `oosterlee-grzelak-2020` registered as research-only copyrighted material with original-prose policy and narrow locators |
| Narrative profiles | Complete | Seven canonical and six legacy EN/ES teaching profiles vary the journey by lesson archetype |
| Foundation content | Complete | Four canonical bilingual lessons added; Academy now has 45 lessons and 121 formulas |
| Numerical invariants | Complete | Distribution, Brownian, GBM and discounted-total-return helpers added to framework-free `src/quant` with deterministic tests |
| Legacy overlap cleanup | Complete | Five shallow stochastic-pricing routes resolve to canonical lessons; 64 generated topics now use topic-specific formulas and archetype-aware explanations |
| Integration validation | Complete | Typecheck, lint, 98-key EN/ES audit, 109 TypeScript tests, 9 Python tests, 11 rendered-route tests, five-stage production build and Cloudflare preflight pass; responsive EN/ES QA passed at 375, 768, 1280 and 1440px |

## Decision log

- The book is reference input, never a production asset.
- Four foundation lessons are the minimum coherent addition; chapter-by-chapter page creation is rejected.
- Existing labs and engines are reused.
- Jump/Lévy, SLV, hybrid, LMM, and cross-currency additions are deferred.
- Merge, push, and production deployment require explicit approval after validation.

## Implemented foundation sequence

1. `foundation-distributions` — distributions, moments, cumulants and characteristic functions.
2. `foundation-brownian-ito` — Brownian paths, quadratic variation and Itô calculus.
3. `foundation-gbm-dynamics` — exact GBM dynamics under physical and pricing measures.
4. `foundation-black-scholes` — replication, PDE, expectation, closed form and hedge interpretation.
5. Existing filtration, expectation, measure-change, Girsanov and forward-measure lessons continue the sequence.

The legacy catalog remains searchable, but overlapping entry points resolve to the canonical lesson. Non-overlapping legacy notes retain their routes and now expose specific mathematics rather than a shared placeholder.
