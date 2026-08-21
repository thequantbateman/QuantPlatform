# Textbook integration overview

## Reference

- **Book:** *Mathematical Modeling and Computation in Finance: With Exercises and Python and MATLAB Computer Codes*
- **Authors:** Cornelis W. Oosterlee and Lech A. Grzelak
- **Publisher / year:** World Scientific, 2020
- **ISBN:** 978-1-78634-794-7 (ebook), 978-1-78634-805-0 (paperback)
- **PDF inspected:** 1,310 pages: front matter, 15 chapters, references/index, and a 735-page code supplement

The PDF is a private, copyrighted academic reference. It is not committed or served by the application. The Academy uses original prose, original diagrams, modern implementations, and standard mathematical results with lesson-level attribution.

## Structural extraction

The PDF outline was parsed before implementation. It contains 15 main chapters, 66 chapter-level sections, 149 nested subsections, 15 exercise sets, references, index, and code supplements linked back to 222 book pages. The code supplement contains both Python and MATLAB examples; it is treated only as an algorithm inventory because its APIs and pedagogical style are not the production contract.

## Book arc

1. probability, stochastic processes, martingales, and stochastic integration;
2. asset dynamics, Itô calculus, and physical/risk-neutral coordinates;
3. Black–Scholes through replication, PDE, expectation, and hedging;
4–5. local volatility and jump/Lévy extensions;
6. Fourier-COS valuation;
7. multidimensional SDEs, measure change, and affine processes;
8–10. stochastic volatility, Monte Carlo, forward starts, and stochastic-local volatility;
11–14. short rates, HJM/Hull–White, rate derivatives, xVA, hybrid models, LMM, and multi-curve valuation;
15. FX and cross-currency hybrid models.

## Integration policy

- Upgrade existing canonical lessons before adding new ones.
- Add a lesson only when it closes a prerequisite gap and can connect to an existing lab or workflow.
- Keep advanced/niche book topics in the coverage ledger until the preceding learning path is complete.
- Validate temporal conventions and software APIs against current authoritative sources rather than trusting a 2020 implementation example blindly.
- Preserve EN/ES parity and the existing compact formula/disclosure experience.

## Current release

The first integration phase repairs the stochastic-pricing spine: distributions and transforms; Brownian motion and Itô calculus; GBM under P and Q; Black–Scholes replication/PDE/Feynman–Kac/hedging. Existing measure-change, volatility, numerical, rates, and risk lessons remain in place and receive narrative/prerequisite improvements where touched.
