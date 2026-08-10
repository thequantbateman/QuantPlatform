# Computations in Finance map

The channel was inspected directly on 10 August 2026. Entries below are current relevant videos exposed by the channel catalogue; descriptions are original summaries, not transcripts.

| Title / URL | Topics and mathematics | Python / interaction | TQB destination | Stage |
|---|---|---|---|---|
| [Deficiencies of Black–Scholes](https://www.youtube.com/watch?v=vhjEgQGnPuU) | Lognormal assumptions, smile, jumps, why a baseline survives | Compare constant vol with a smile | `/learn/equity/black-scholes` | MVP |
| [Challenges calculating implied volatility](https://www.youtube.com/watch?v=KTffxCRX2WE) | Nonlinear inversion, low vega, bounds, convergence | Brent diagnostics and impossible-price errors | Vanilla Pricer / IV | MVP |
| [Stochastic process vs random variable](https://www.youtube.com/watch?v=V2fXrxqnGr4) | Indexed random variables and paths | Path scrubber | Foundations / stochastic processes | MVP content |
| [ABM/GBM for stock modelling](https://www.youtube.com/watch?v=jHnVj1_Zj38) | Additive vs multiplicative diffusion, positivity | Process comparison | Monte Carlo lab | V0.5 |
| [Sanity checks for simulated stock](https://www.youtube.com/watch?v=vr4_ySb5DSo) | Martingale checks, moments, convergence | Diagnostic panel | Monte Carlo lab | V0.5 |
| [Weak and strong Monte Carlo convergence](https://www.youtube.com/watch?v=Px0bsAOtHHM) | Discretization orders and payoff bias | Log-log error plot | Monte Carlo lab | V0.5 |
| [Standard error](https://www.youtube.com/watch?v=YxyoJ4IPFog) | Estimator variance and confidence intervals | Paths/error slider | Monte Carlo lab | V0.5 |
| [Why Monte Carlo when FFT exists?](https://www.youtube.com/watch?v=w4U4iZzths8) | Dimensionality, path dependence, transform availability | Method decision tree | Numerical methods | V2.5 |
| [FFT benefits](https://www.youtube.com/watch?v=15yudWDJi-s) | Complexity and simultaneous strike grids | FFT vs quadrature benchmark | Fourier lab | V2.5 |
| [FFT/COS non-convergence](https://www.youtube.com/watch?v=UDiAt7axyE8) | Truncation domains and expansion terms | Convergence diagnostics | Fourier lab | V2.5 |
| [Characteristic function with jumps](https://www.youtube.com/watch?v=V_HbsItomaE) | Lévy exponent and compound Poisson terms | Complex-plane viewer | Jump diffusion | V2.5 |
| [Impact of jumps on implied volatility](https://www.youtube.com/watch?v=b13POBabci8) | Wing curvature and short-tenor smile | Jump sliders → smile | Jump diffusion | V3 |
| [Bates model](https://www.youtube.com/watch?v=0FK241v6uVE) | Heston plus jumps and characteristic functions | Surface comparison | Stochastic volatility | V3 |
| [Heston parameter interpretation](https://www.youtube.com/watch?v=J0_UbssKmPw) | Mean reversion, vol-of-vol, correlation, initial variance | Parameter-to-surface lab | Heston | V2 |
| [Implied-volatility term structure](https://www.youtube.com/watch?v=YzE-ddO8S3Q) | Expiry dimension and event risk | Term slice | Volatility Explorer | MVP |
| [How to calibrate a model](https://www.youtube.com/watch?v=0klI_v0F8Gs) | Objective functions, weights, local/global search | Residual heatmap | Calibration | V3 |
| [Which instruments calibrate a model?](https://www.youtube.com/watch?v=CjMbTb5DJZc) | Instrument selection and identifiability | Quote inclusion toggles | Calibration | V3 |
| [Pathwise sensitivity](https://www.youtube.com/watch?v=Rn7ubqzMx1k) | Differentiating expected payoffs | Analytical vs pathwise Greek | Monte Carlo Greeks | V1 |
| [Hedging jumps](https://www.youtube.com/watch?v=0MWYRL3ziZE) | Incompleteness and residual jump risk | Hedge P&L scenarios | Jump risk | V3 |
| [Feynman–Kac](https://www.youtube.com/watch?v=o7deOrWRC2I) | PDE–expectation connection | PDE / MC bridge | Mathematical foundations | V1 |

## Curriculum progression

Asset convention → payoff/no-arbitrage → stochastic process → risk-neutral measure → BSM/GK/Black-76 → Greeks → implied volatility → Monte Carlo → smile/surface → Heston/jumps → characteristic functions/COS/FFT → calibration. Each page should end with a model-manipulation task and a desk limitation.
