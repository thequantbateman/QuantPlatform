# Book coverage ledger

Classification: **A** covered well; **B** needs mathematical depth; **C** explanation needs clarity; **D** lacks useful interaction; **E** lacks desk interpretation; **F** partial; **G** important missing concept; **H** mapped reference, not currently worth adding.

| Ch. | PDF pages | Topic and main sections | Current Academy match | Class | Priority | Integration status |
|---:|---:|---|---|:---:|:---:|---|
| Front matter | 8–19 | Preface, curriculum intent, code/exercise usage | Product pedagogy and content architecture | A | P2 | Reviewed; policy captured |
| 1 | 20–45 | Random variables; density, expectation, variance; characteristic functions; cumulants/moments; stochastic processes; Wiener process; martingales; tower property; elementary processes; Itô integral/isometry; representation theorem | Canonical distributions and Brownian/Itô lessons; deep filtrations and conditional expectation | A/F | P0 | Integrated and tested |
| 2 | 46–69 | GBM; Itô processes/lemma; lognormal law; dividends; time-dependent volatility; martingales; P/Q prices; parameter estimation | Canonical GBM P/Q lesson plus measure-change sequence | A/F | P0 | Integrated and tested |
| 3 | 70–99 | Option contracts; replication and PDE; martingale pricing; Feynman–Kac; closed form; Green/characteristic functions; volatility variants; delta hedging | Canonical Black–Scholes lesson plus deep Greeks and hedging | A/F | P0 | Integrated and tested |
| 4 | 100–139 | Implied volatility; prices/densities; smiles; variance swaps; local volatility; no-arbitrage interpolation; simulation | Deep implied vol, smile, surface, local vol, calibration | A/B | P1 | Covered; later targeted derivation audit |
| 5 | 140–181 | Jump diffusion; Itô with jumps; PIDE; Merton; Lévy triplet; VG/CGMY/NIG; jump hedging | Legacy jump diffusion only | G | P2 | Mapped; defer until PDE/transform spine is complete |
| 6 | 182–211 | COS density expansion; pricing; payoff coefficients; Greeks; error analysis; integration range; GBM/CGMY/VG results | Deep Fourier-COS and Monte Carlo lessons | B | P1 | Existing lesson; improve convergence explanation later |
| 7 | 212–241 | Multi-D SDEs; Cholesky; vector Itô/Feynman–Kac; Radon–Nikodym; Girsanov; numeraires; P→Q; affine diffusions/jumps | Deep measure change, Girsanov, forward measures; partial affine coverage in Heston | A/F | P1 | Strong core; prerequisites repaired in this phase |
| 8 | 242–275 | CIR/SZ/Heston; Heston PDE; parameter study; calibration; affine characteristic function; COS; piecewise parameters; Bates | Deep stochastic vol, Heston, calibration, surfaces | A/B | P1 | Strong; retain and cross-link foundations |
| 9 | 276–327 | MC integration; SDE paths; Euler/Milstein; CIR exact/QE; Heston simulation; MC Greeks; variance improvements | Deep MC, schemes, variance reduction, Greeks | A/B | P1 | Strong; foundations improve entry path |
| 10 | 328–357 | Forward starts; local vs stochastic vol; stochastic-local vol; conditional expectation and AES simulation | Surface/local/stochastic vol lessons, no dedicated SLV/forward-start lesson | F/G | P2 | Mapped; defer specialist addition |
| 11 | 358–385 | Bonds; HJM; short-rate/Hull–White/CIR dynamics; T-forward measure; bond options | Deep discounting, HJM, Hull–White, forward measures, optionality | A/B | P1 | Strong; later equation audit |
| 12 | 386–423 | Libor/FRA/FRN/swaps/curves; caps/floors/swaptions; unilateral/bilateral CVA; netting | Deep rates, curve construction, optionality, exposure/xVA | A/B | P1 | Strong; benchmark terminology remains modernized |
| 13 | 424–463 | BSHW/SZHW/Heston-HW hybrids; measure change; simulation; hybrid derivative; CVA exposure profiles | Deep exposure/xVA, Heston/HW separately; hybrids absent | F/H | P3 | Mapped; defer until base models are mastered |
| 14 | 464–507 | LMM under HJM/terminal/spot measures; convexity correction; CEV/displaced/SV-LMM; negative rates; multi-curve | Deep multi-curve/HJM/rate optionality; LMM/CEV partial legacy | F | P2 | Mapped; future rates phase |
| 15 | 508–543 | FX market/forwards/options; FX-HHW; FX-HLMM; FX-swap CVA | Legacy FX track plus rates/xVA foundations | F | P2 | Mapped; future FX phase |
| References/index | 544–575 | Source bibliography and topic index | Academy source registry | A | P2 | Reviewed for source navigation |
| Code supplement | 576–1310 | 735 pages of MATLAB/Python examples tied to 222 book pages | Existing Python labs and quant engines | H | P2 | Reviewed as algorithm inventory; no source copied |

## Chapter 1–3 section disposition

| Section | Academy target | Action |
|---|---|---|
| 1.1.1–1.1.3 distributions, expectation, characteristic function, moments | `foundation-distributions` | Integrated as one combined canonical lesson; cross-linked to COS |
| 1.2 Wiener, martingale, tower property | `foundation-brownian-ito`, `foundation-conditional-expectation` | Brownian foundation integrated; existing expectation lesson retained |
| 1.3 Itô integral/isometry/representation | `foundation-brownian-ito` | Construction, quadratic variation and Itô lemma integrated; representation theorem kept as optional depth |
| 2.1 GBM and Itô lemma | `foundation-gbm-dynamics` | Exact solution and lognormal diagnostics integrated |
| 2.2 dividends/time-dependent vol | `foundation-gbm-dynamics`, volatility track | Included as assumptions/extensions rather than a duplicate lesson |
| 2.3 P/Q dynamics and estimation | `foundation-gbm-dynamics`, measure-change track | Statistical and pricing drifts explicitly separated |
| 3.1 option/PDE/martingale | `foundation-black-scholes` | Classical replication/PDE derivation integrated |
| 3.2 Feynman–Kac/closed form | `foundation-black-scholes` | Expectation, closed form and checks integrated inline |
| 3.3 delta hedging | `foundation-black-scholes`, `hedging-pnl` | Existing hedge lab linked from the theory lesson |
