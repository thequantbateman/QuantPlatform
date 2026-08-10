# QuantFinanceBook Python code map

The complete `PythonCodes` tree (15 chapters) was inspected. The repository is BSD-3-Clause; this application uses original implementations and references the teaching code.

## Chapter map

| Chapter | Observed implementation themes | Representative files | Decision |
|---|---|---|---|
| 01–03 | ABM/GBM paths, distributions, empirical market data | `Ch01/Fig01_05.py`, `Ch02/MarketData.py`, `Ch03/Tab03_01.py` | Reference |
| 04 | BSM, Greeks, implied vol, COS/Bates, SABR calibration | `Fig04_01.py`, `Exa4_1_2.py`, `Fig04_03.py`, `Fig04_09.py` | Reimplement V0; reference SABR |
| 05 | Poisson/Merton jumps and implied smile | `Fig05_01.py`, `Fig05_04.py`, `Fig05_05.py` | Future reference |
| 06–07 | COS density/payoff coefficients, correlated Brownian motion | `Tab06_05.py`, `Fig07_01.py` | Future reference |
| 08 | Bates characteristic function and implied vols | `Fig08_06.py` | Future reference |
| 09 | Monte Carlo schemes, Heston Euler/AES, pathwise/LR Greeks | `Tab09_01.py`, `Tab09_02.py`, `Fig09_16.py`, `Fig09_19.py` | V0.5/V1 reference |
| 10 | Heston-derived local vol and stochastic-local-vol | `Fig10_02.py`, `Fig10_06.py` | V1.5 reference |
| 11–12 | CIR/Hull–White paths and numerical rate material | `Fig11_05.py`, `Fig11_06.py`, `Fig12_04.py` | V3+ reference |
| 13 | Hybrid stochastic-rate equity models and calibration | `Exe13_11.py`, `Exe13_12.py`, `Tab13_01.py` | Cross-asset future |
| 14–15 | Advanced hybrid/FX-HHW simulation and calibration | `Fig15_02.py`, `Tab15_03.py` | V6 reference |

## Useful script records

| Source | Purpose / inputs / outputs | Method / dependencies | Reusability | Value |
|---|---|---|---|---|
| `Chapter 04/Fig04_01.py` | BSM call/put and delta/gamma/vega over spot/time | Analytical formulae; NumPy/SciPy/Matplotlib | Reimplement | Core V0 and risk geometry |
| `Chapter 04/Exa4_1_2.py` | Infer sigma from option PV | Unbounded Newton with vega | Reference only | Shows why V0 uses bound checks + Brent |
| `Chapter 04/Fig04_03.py` | COS pricing and Bates smile | Characteristic function/COS | Reference | Fourier roadmap |
| `Chapter 04/Fig04_09.py` | SABR parameter fit to IVs | Global/local numerical optimization | Reference | Vol calibration roadmap |
| `Chapter 05/Fig05_05.py` | Merton price and IV | Poisson mixture + root solve | Reference | Jump-diffusion roadmap |
| `Chapter 08/Fig08_06.py` | Bates prices and IV response | Heston+jump characteristic function/COS | Reference | V3 |
| `Chapter 09/Tab09_01.py` | European MC under GBM | Euler/Milstein, discounted payoffs | Reimplement later | V0.5 validation |
| `Chapter 09/Tab09_02.py` | Heston Euler vs almost-exact scheme | CIR sampling, COS benchmark | Reference | V2 validation design |
| `Chapter 09/Fig09_16.py` | Pathwise delta/vega | Differentiated path estimator | Reference | MC Greeks |
| `Chapter 09/Fig09_19.py` | Likelihood-ratio Greeks | Score estimator | Reference | Non-smooth payoff Greeks |
| `Chapter 10/Fig10_02.py` | Local vol from Heston-implied prices | COS, IV inversion, MC | Reference | V1.5 |
| `Chapter 13/Tab13_01.py` | SZHW calibration | COS and global/local search | Reference | Cross-asset calibration |
| `Chapter 15/Tab15_03.py` | FX-HHW MC vs COS | Four-factor correlated simulation | Reference | V6 |

## Production conversion rules

No plotting, global parameters, print diagnostics or notebook-style execution enters the engine. Domain functions accept typed scalar/vector requests, validate financial domains, expose conventions, return structured diagnostics and are tested independently from UI.
