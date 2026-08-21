# Textbook source map

The locators below use the book’s printed chapter/section numbering and PDF page numbers. Classification follows the coverage ledger. “Deferred” means traceable and intentionally not incorporated in this release.

| Book locator | Concepts | Academy destination(s) | Class | Release action |
|---|---|---|:---:|---|
| Ch. 1 §§1.1–1.1.3, PDF 20–27 | density, expectation, variance, CF, cumulants, moments | `foundation-distributions`, `numerical-fourier-cos` | G/F | Add foundation; cross-link COS |
| Ch. 1 §§1.2–1.2.3, PDF 28–32 | processes, Wiener, martingale, tower | `foundation-brownian-ito`, `foundation-filtrations`, `foundation-conditional-expectation` | F | Add Brownian; retain deep measure lessons |
| Ch. 1 §1.3, PDF 33–43 | elementary integrands, Itô integral/isometry, representation | `foundation-brownian-ito` | G | Add optional mathematical depth |
| Ch. 2 §§2.1–2.3, PDF 46–67 | GBM, Itô lemma, lognormal law, dividends, P/Q, estimation | `foundation-gbm-dynamics`, `foundation-measure-change`, `foundation-girsanov` | G/F | Add GBM; repair prerequisites |
| Ch. 3 §§3.1–3.3, PDF 70–96 | contracts, replication, PDE, martingale price, Feynman–Kac, closed form, hedge | `foundation-black-scholes`, `greeks-first-order`, `hedging-pnl` | G/F | Add classical foundation and deep links |
| Ch. 4 §§4.1–4.3, PDF 100–135 | implied/local vol, density, variance swaps, interpolation, simulation | `vol-implied`, `vol-smile`, `vol-surface`, `vol-local`, `vol-realized-implied` | A/B | No new lesson; later derivation audit |
| Ch. 5 §§5.1–5.5, PDF 140–177 | jump diffusion, PIDE, Merton, Lévy/VG/CGMY/NIG | legacy jump diffusion; `numerical-fourier-cos` | G | Deferred specialist model phase |
| Ch. 6 §§6.1–6.3, PDF 182–207 | COS density/pricing/Greeks/error/range | `numerical-fourier-cos` | B | Existing lesson; later convergence upgrade |
| Ch. 7 §§7.1–7.3, PDF 212–237 | multi-D SDE, Cholesky, Girsanov, numeraires, affine processes | `foundation-measure-change`, `foundation-girsanov`, `foundation-forward-measures`, `vol-heston` | A/F | Strengthen prerequisites only |
| Ch. 8 §§8.1–8.4, PDF 242–273 | CIR/SZ/Heston, PDE, calibration, CF, COS, Bates | `vol-stochastic`, `vol-heston`, `vol-calibration` | A/B | Retain; foundation cross-links |
| Ch. 9 §§9.1–9.5, PDF 276–324 | MC, Euler/Milstein, CIR/Heston simulation, MC Greeks | `numerical-monte-carlo`, `numerical-schemes`, `numerical-variance-reduction`, Greeks track | A/B | Retain; add foundation invariants |
| Ch. 10 §§10.1–10.2, PDF 328–354 | forward starts, local vs SV, SLV/AES | volatility track | F/G | Deferred specialist lesson |
| Ch. 11 §§11.1–11.4, PDF 358–383 | bonds, HJM, Hull–White/CIR, forward measure, bond options | rates track, `foundation-forward-measures` | A/B | Retain; later rates audit |
| Ch. 12 §§12.1–12.3, PDF 386–418 | FRA/FRN/swaps/curve, caps/floors/swaptions, CVA/BCVA/netting | rates and risk/xVA tracks | A/B | Retain current terminology and workflows |
| Ch. 13 §§13.1–13.3, PDF 424–457 | BSHW/SZHW/HHW hybrids, simulation, exposure | Heston, Hull–White, exposure/xVA lessons | F/H | Deferred hybrid phase |
| Ch. 14 §§14.1–14.4, PDF 464–504 | LMM, measures, convexity, CEV/displaced/SV-LMM, negative rates, multi-curve | HJM, rate optionality, multi-curve; legacy LMM | F | Deferred rates expansion |
| Ch. 15 §§15.1–15.3, PDF 508–540 | FX forwards/options, FX-HHW/HLMM, FX-swap CVA | legacy FX, rates and xVA tracks | F | Deferred FX phase |

## Citation rule for modified lessons

Substantial book-validated lessons include `oosterlee-grzelak-2020` in `references` with a narrow chapter/section/page locator. The visible lesson reference is concise. This development map retains the broader reasoning and disposition.
