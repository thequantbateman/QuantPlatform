import type { AcademyLesson, AcademyTrack } from "./types";
import { additionalVolatilityLessons } from "./volatilityTrackLessons";

const reviewed = "2026-08-12";

export const volatilityTrack: AcademyTrack = {
  id: "volatility",
  title: "Volatility",
  subtitle: "From observed dispersion to model dynamics",
  description: "A sequenced path through measurement, option-implied coordinates, surface construction, dynamics, calibration and hedge risk.",
  nodes: [
    { id: "volatility", title: "Realized volatility", stage: "Measurement and estimators", level: "foundation", href: "/learn/volatility/realized-volatility", academyLessonId: "vol-realized" },
    { id: "realized-implied", title: "Realized vs implied", stage: "Variance risk premium", level: "foundation", href: "/learn/volatility/realized-vs-implied", academyLessonId: "vol-realized-implied" },
    { id: "implied-volatility", title: "Black–Scholes implied volatility", stage: "Inversion", level: "intermediate", href: "/learn/volatility/implied-volatility", academyLessonId: "vol-implied" },
    { id: "smile", title: "Smile and skew", stage: "Strike geometry", level: "intermediate", href: "/learn/volatility/smile-and-skew", academyLessonId: "vol-smile" },
    { id: "term", title: "Term structure", stage: "Expiry geometry", level: "intermediate", href: "/learn/volatility/term-structure", academyLessonId: "vol-term" },
    { id: "surface", title: "Volatility surface", stage: "Flagship workbench", level: "front-office", href: "/learn/volatility/volatility-surface", academyLessonId: "vol-surface" },
    { id: "local-vol", title: "Local volatility", stage: "State-dependent diffusion", level: "advanced", href: "/learn/volatility/local-volatility", academyLessonId: "vol-local" },
    { id: "stochastic-vol", title: "Stochastic volatility", stage: "Random variance", level: "advanced", href: "/learn/volatility/stochastic-volatility", academyLessonId: "vol-stochastic" },
    { id: "heston", title: "Heston", stage: "Affine stochastic variance", level: "front-office", href: "/learn/volatility/heston-model", academyLessonId: "vol-heston" },
    { id: "sabr", title: "SABR", stage: "Forward smile dynamics", level: "front-office", href: "/learn/volatility/sabr", academyLessonId: "vol-sabr" },
    { id: "calibration", title: "Calibration", stage: "Fit, stability, governance", level: "front-office", href: "/learn/volatility/calibration", academyLessonId: "vol-calibration" },
    { id: "higher-order-risk", title: "Vega, vanna and volga", stage: "Hedge geometry", level: "front-office", href: "/learn/volatility/vega-vanna-volga", academyLessonId: "vol-higher-risk" },
  ],
};

const surfacePython = `from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from numpy.typing import NDArray

FloatArray = NDArray[np.float64]

@dataclass(frozen=True)
class SurfaceShape:
    atm: float = 0.20
    skew: float = -0.18
    curvature: float = 0.55
    term_slope: float = 0.025

def educational_surface(
    log_moneyness: FloatArray,
    maturity: FloatArray,
    shape: SurfaceShape,
) -> FloatArray:
    """Return a deterministic teaching surface; never market data."""
    if np.any(maturity <= 0.0):
        raise ValueError("maturity must be positive")
    vol = (
        shape.atm
        + shape.skew * log_moneyness
        + shape.curvature * log_moneyness**2
        + shape.term_slope * np.log1p(maturity)
    )
    return np.maximum(vol, 0.01)

tenors = np.array([7 / 365, 30 / 365, 0.25, 0.5, 1.0, 2.0])
moneyness = np.linspace(0.70, 1.30, 25)
k = np.log(moneyness)[None, :]
t = tenors[:, None]
surface = educational_surface(k, t, SurfaceShape())

assert surface.shape == (tenors.size, moneyness.size)
assert np.isfinite(surface).all() and np.all(surface > 0.0)
print(f"ATM 1Y: {surface[4, 12]:.2%}")`;

const impliedVolPython = `from __future__ import annotations

from math import exp, log, sqrt
from scipy.optimize import brentq
from scipy.stats import norm

def call_price(spot: float, strike: float, time: float, rate: float, vol: float) -> float:
    if min(spot, strike, time, vol) <= 0.0:
        raise ValueError("spot, strike, time and vol must be positive")
    root_t = sqrt(time)
    d1 = (log(spot / strike) + (rate + 0.5 * vol**2) * time) / (vol * root_t)
    d2 = d1 - vol * root_t
    return spot * norm.cdf(d1) - strike * exp(-rate * time) * norm.cdf(d2)

def implied_vol(price: float, spot: float, strike: float, time: float, rate: float) -> float:
    lower = max(0.0, spot - strike * exp(-rate * time))
    upper = spot
    if not lower <= price <= upper:
        raise ValueError("price violates no-arbitrage bounds")
    objective = lambda sigma: call_price(spot, strike, time, rate, sigma) - price
    return float(brentq(objective, 1e-8, 5.0, xtol=1e-12, rtol=1e-12))

target = call_price(100.0, 105.0, 0.75, 0.03, 0.27)
solved = implied_vol(target, 100.0, 105.0, 0.75, 0.03)
assert abs(solved - 0.27) < 1e-10
print(f"Implied volatility: {solved:.4%}")`;

const flagshipVolatilityLessons: AcademyLesson[] = [
  {
    id: "vol-implied",
    slug: "implied-volatility",
    title: "Implied volatility",
    subtitle: "An option price expressed in the coordinate system of a chosen model",
    domain: "volatility",
    assetClass: "EQ",
    level: "intermediate",
    prerequisites: ["Black-Scholes", "Risk-Neutral Pricing", "Greeks"],
    learningObjectives: [
      "Separate an observed option premium from the volatility inferred through Black–Scholes.",
      "Derive the scalar root problem and explain why vega controls conditioning.",
      "Implement a bracketed inversion with price-bound and residual checks.",
      "Identify when stale inputs, conventions or near-zero vega make an implied quote unreliable.",
    ],
    tags: ["implied volatility", "Black–Scholes", "root finding", "vega", "option quotes"],
    estimatedMinutes: 38,
    lastReviewed: reviewed,
    intuition: {
      lead: "Implied volatility is not measured from returns. It is the volatility input that forces a specified pricing model to reproduce an observed option premium. It is therefore a model-dependent quote coordinate, not a direct forecast.",
      points: [
        "One premium becomes one implied volatility only after spot, strike, time, rates, dividends, payoff and settlement conventions are fixed.",
        "Different strikes normally return different implied volatilities; that failure of a constant-volatility model is useful market information.",
        "Low vega makes the inverse unstable: a small price error can become a large volatility error.",
      ],
    },
    marketContext: {
      why: "Volatility normalizes premiums across strikes and expiries, allowing desks to compare relative richness, build surfaces and communicate risk in a familiar unit.",
      instruments: ["European calls and puts", "listed equity options", "FX vanilla options", "caps, floors and swaptions under their own conventions"],
      quoteConvention: "Equity volatility is commonly displayed in annualized percentage points. FX and rates require explicit delta, ATM, premium, normal/lognormal and settlement conventions before values are comparable.",
    },
    mathematics: {
      notation: ["C_mkt: observed call premium", "C_BS(σ): Black–Scholes call value", "ν = ∂C/∂σ: raw vega", "T: ACT/365-like year fraction in this lesson"],
      formulas: [
        { label: "Inverse definition", latex: "f(\\sigma)=C_{BS}(S,K,T,r,q,\\sigma)-C_{mkt}=0", interpretation: "Implied volatility is the root of a monotone scalar equation when vanilla no-arbitrage bounds hold." },
        { label: "Black–Scholes call", latex: "C_{BS}=Se^{-qT}N(d_1)-Ke^{-rT}N(d_2)", interpretation: "The inverse depends on every state variable and convention used by the forward pricing model." },
        { label: "Conditioning", latex: "\\frac{d\\sigma_{imp}}{dC}=\\frac{1}{\\nu},\\qquad \\nu=Se^{-qT}\\phi(d_1)\\sqrt{T}", interpretation: "When vega approaches zero, premium noise is magnified in volatility space." },
      ],
    },
    derivation: {
      title: "From premium to a stable volatility root",
      introduction: "The derivation is an inverse-function argument, followed by a numerical method that respects the financial domain.",
      steps: [
        { title: "Fix the pricing state", body: "Hold spot, strike, expiry, curves, dividends and payoff convention fixed. Only volatility is unknown.", latex: "C_{mkt}=C_{BS}(\\sigma)" },
        { title: "Establish feasible bounds", body: "For a non-dividend call, discounted intrinsic value is the lower bound and spot is the upper bound. Reject premiums outside these bounds before solving.", latex: "\\max(0,S-Ke^{-rT})\\le C_{mkt}\\le S", check: "Bounds change with dividends and product conventions; use the exact model contract." },
        { title: "Use monotonicity", body: "European vanilla vega is positive away from degenerate limits, so the Black–Scholes price rises with volatility and the root is unique.", latex: "\\partial_{\\sigma}C_{BS}=\\nu>0" },
        { title: "Bracket, then solve", body: "A bracketed method such as Brent combines reliability with fast convergence. Newton can be fast but may leave the domain when vega is small.", latex: "\\sigma_{n+1}=\\sigma_n-\\frac{f(\\sigma_n)}{\\nu(\\sigma_n)}", check: "Return the residual, iteration count and convergence state—not only the root." },
        { title: "Interpret the inverse sensitivity", body: "Implicit differentiation converts price error into volatility error. This is why deep in/out-of-the-money short-dated quotes can be numerically fragile.", latex: "d\\sigma_{imp}\\approx \\frac{dC}{\\nu}" },
      ],
      conclusion: "A reliable implied-volatility quote is a validated inversion result with complete state and convention lineage.",
    },
    pricing: {
      method: "Compute the model premium for candidate volatility and solve the residual inside a positive bracket. Use parity or the more liquid option side where desk convention calls for it.",
      calibration: "Implied-vol inversion is pointwise calibration. Surface calibration begins only after those points are normalized into a consistent coordinate system.",
      limitations: ["No constant volatility fits the full strike-expiry grid.", "The value is model and convention dependent.", "Wide spreads and low vega produce unstable implied quotes."],
    },
    implementation: {
      architecture: ["Validate financial bounds before numerical work.", "Use a bracketed solver with explicit tolerances.", "Return diagnostics and preserve source timestamps.", "Test inversion against analytical prices and boundary cases."],
      quantLib: "Current QuantLib represents market state through quote and term-structure handles and exposes implied-volatility inversion around a pricing engine. The library manages plumbing; it does not remove the need to understand bounds, conventions and conditioning.",
      pythonLab: {
        title: "Bracketed Black–Scholes inversion",
        objective: "Recover a known volatility from a generated premium and reject impossible prices.",
        code: impliedVolPython,
        output: ["Implied volatility: 27.0000%"],
        checks: ["Known-vol round trip is accurate to 1e-10.", "No-arbitrage bounds are validated before solving.", "The bracket is positive and finite."],
      },
    },
    interactiveLabs: [{ id: "implied-volatility", title: "Implied-volatility inversion", description: "Move premium and state inputs through a bracketed inverse with residual and vega diagnostics." }],
    frontOffice: {
      quote: "Volatility is the desk language; premium remains the cash value.",
      inputs: ["bid/offer premium", "spot or forward", "discount and carry curves", "expiry and settlement", "strike/delta convention"],
      calibration: "Invert bid, mid and offer consistently. Preserve the premium spread rather than presenting mid volatility as executable truth.",
      risk: ["vega and volga", "spot-vol cross sensitivity", "calendar and dividend jumps", "surface interpolation risk"],
      workflow: ["clean quotes", "normalize conventions", "solve implied vols", "flag low-vega points", "fit and validate the surface"],
      productionIssues: ["stale spot paired with fresh options", "wrong dividend or foreign curve", "calendar mismatch", "silent percent/decimal conversion", "solver success with a poor residual"],
    },
    macroConnections: [{ title: "Macro uncertainty enters option prices", thesis: "Policy and event risk change forward distributions and demand for convex protection; the effect is visible in both the level and shape of implied volatility.", nodes: [{ label: "Policy/event shock", effect: "widens distribution of possible outcomes" }, { label: "Hedging demand", effect: "moves wing premiums and skew" }, { label: "Implied volatility", effect: "translates premiums into comparable coordinates" }] }],
    pitfalls: ["Calling implied volatility a forecast without qualification.", "Solving against a mid from asynchronous market inputs.", "Using Newton without a bracket or vega guard.", "Comparing values built under different quote conventions."],
    references: [
      { sourceId: "grzelak-computational-finance", locator: "Lecture 04 — Implied Volatility", url: "https://github.com/LechGrzelak/Computational-Finance-Course/tree/main/Lecture%2004-%20Implied%20Volatility", note: "Research map for inversion, smile and numerical interpretation; explanation and code are original." },
      { sourceId: "quantlib-upstream", locator: "Current instrument/process/volatility architecture", url: "https://github.com/lballabio/QuantLib", note: "Implementation reference for professional library abstractions." },
    ],
    relatedLessonIds: ["vol-surface", "vol-heston"],
  },
  {
    id: "vol-surface",
    slug: "volatility-surface",
    title: "Volatility surface",
    subtitle: "A market-consistent map across strike and maturity—and a hypothesis about everything between the quotes",
    domain: "volatility",
    assetClass: "EQ",
    level: "front-office",
    prerequisites: ["Implied Volatility", "Volatility Smile", "Term Structure", "Interpolation Basics"],
    learningObjectives: [
      "Read a surface as linked smile and term slices rather than a decorative 3D object.",
      "Distinguish quoted nodes, interpolation choices and model-generated dynamics.",
      "Use total variance and option-price checks to reason about static arbitrage.",
      "Connect the surface to vanilla marking, local volatility, stochastic volatility and hedge behavior.",
    ],
    tags: ["surface", "smile", "skew", "term structure", "local volatility", "calibration"],
    estimatedMinutes: 62,
    lastReviewed: reviewed,
    intuition: {
      lead: "A volatility surface stacks option-implied volatility across strike and expiry. Every visible point is a compact encoding of an option price under a stated convention; every gap between liquid points is a modelling decision.",
      points: [
        "A smile slice answers how downside, ATM and upside options differ at one expiry.",
        "A term slice answers how the market distributes uncertainty and event risk through time.",
        "The fitted surface marks vanilla books today. A dynamics model determines how it moves tomorrow.",
      ],
    },
    marketContext: {
      why: "Desks need continuous values for marking, interpolation, scenario risk and calibration even though only a sparse set of options trades reliably.",
      instruments: ["listed or OTC vanilla grids", "variance-sensitive products", "barriers and digitals", "forward-start and cliquet structures"],
      quoteConvention: "This lesson uses spot moneyness K/S and ACT/365-like maturity for education. Production equity, FX and rates surfaces require their native forward, delta, premium, ATM and normal/lognormal conventions.",
    },
    mathematics: {
      notation: ["k = log(K/F_T): log-forward moneyness", "w(k,T) = σ_imp²(k,T)T: total implied variance", "C(K,T): call-price surface", "σ_loc(K,T): local volatility"],
      formulas: [
        { label: "Surface coordinate", latex: "(k,T)\\mapsto \\sigma_{imp}(k,T),\\qquad k=\\log(K/F_T)", interpretation: "Forward log-moneyness makes strike geometry comparable across maturities." },
        { label: "Total variance", latex: "w(k,T)=\\sigma_{imp}^2(k,T)T", interpretation: "Many no-arbitrage and interpolation questions are more naturally expressed in total variance than volatility." },
        { label: "Risk-neutral density", latex: "\\partial_{KK}C(K,T)=D(0,T)\\,f_{S_T}^{\\mathbb Q}(K)\\ge 0", interpretation: "Convex call prices imply a non-negative risk-neutral terminal density." },
        { label: "Dupire local variance", latex: "\\sigma_{loc}^2(K,T)=\\frac{\\partial_T C+(r-q)K\\partial_K C+qC}{\\tfrac12K^2\\partial_{KK}C}", interpretation: "A sufficiently smooth arbitrage-consistent vanilla surface identifies one local-volatility diffusion." },
      ],
    },
    derivation: {
      title: "From a call-price surface to local volatility",
      introduction: "Dupire’s result is an inversion of the forward equation. It shows why surface smoothness and convexity are numerical requirements, not styling preferences.",
      steps: [
        { title: "Assume risk-neutral local dynamics", body: "Let instantaneous volatility depend on state and time while the drift remains risk-neutral.", latex: "dS_t=(r-q)S_tdt+\\sigma_{loc}(S_t,t)S_tdW_t" },
        { title: "Write the forward density equation", body: "The transition density evolves under the Fokker–Planck equation associated with the diffusion.", latex: "\\partial_T p=-\\partial_S((r-q)Sp)+\\tfrac12\\partial_{SS}(\\sigma_{loc}^2S^2p)" },
        { title: "Differentiate option prices by strike", body: "Breeden–Litzenberger links the strike curvature of call prices to the discounted risk-neutral density.", latex: "\\partial_{KK}C=D(0,T)p(K,T)" },
        { title: "Differentiate by maturity", body: "Insert the forward density evolution into the maturity derivative of the call payoff integral and integrate by parts.", latex: "C(K,T)=D(0,T)\\int_K^{\\infty}(S-K)p(S,T)dS" },
        { title: "Isolate local variance", body: "Rearrange the resulting forward PDE. A non-positive denominator or noisy derivative makes the inferred local variance unstable.", latex: "\\sigma_{loc}^2=\\frac{\\partial_T C+(r-q)K\\partial_K C+qC}{\\tfrac12K^2\\partial_{KK}C}", check: "This is a theoretical identity; production implementations require smooth arbitrage-aware interpolation and boundary handling." },
      ],
      conclusion: "A surface is simultaneously market data, an interpolation object and an input to dynamics. Those roles should never be silently conflated.",
    },
    pricing: {
      method: "Normalize option quotes, infer implied volatilities, choose a stable coordinate system, fit each slice, connect maturities and validate reconstructed premiums and static-arbitrage diagnostics.",
      calibration: "The educational workbench exposes level, skew, curvature and term slope directly. Production calibration minimizes weighted premium or volatility errors subject to stability, liquidity and no-arbitrage constraints.",
      limitations: ["Sparse wings force extrapolation choices.", "A perfect static fit does not guarantee realistic forward dynamics.", "Volatility-space interpolation can hide option-price arbitrage."],
    },
    implementation: {
      architecture: ["Store source quotes and fitted state separately.", "Evaluate one deterministic grid in the framework-free quant layer.", "Drive heatmap, smile, term and 3D views from the same values.", "Always provide exact readouts and a 2D/table alternative to 3D."],
      quantLib: "Current QuantLib 1.42 introduced PiecewiseBlackVarianceSurface for ragged grids and provides Black variance surfaces, smile sections and SABR structures. A library supplies tested representations; the user must still choose conventions, quotes, interpolation and extrapolation deliberately.",
      pythonLab: {
        title: "Vectorized educational surface",
        objective: "Build one deterministic surface grid with explicit parameters, units and sanity checks.",
        code: surfacePython,
        output: ["ATM 1Y: 21.73%", "shape: 6 maturities × 25 moneyness nodes"],
        checks: ["All maturities are positive.", "Every output is finite and positive.", "The result is explicitly synthetic and not a calibration."],
      },
    },
    interactiveLabs: [{ id: "vol-surface", title: "Volatility Surface Workbench", description: "Compare 3D, heatmap, smile and term views; shock level and shape; animate controlled educational scenarios." }],
    frontOffice: {
      quote: "The mark is a surface. The hedge is a view about how that surface moves.",
      inputs: ["bid/offer vanilla grid", "spot and forwards", "discount/dividend curves", "corporate-action calendar", "expiry/settlement conventions"],
      calibration: "Fit liquid nodes more strongly, preserve bid/offer awareness and inspect residuals in premium as well as volatility space.",
      risk: ["vega buckets", "vanna and volga", "skew/term scenarios", "spot-vol correlation", "calendar roll"],
      workflow: ["ingest and timestamp quotes", "normalize strikes/deltas", "clean crossed or stale nodes", "fit", "reprice quotes", "publish surface and risk", "monitor drift"],
      productionIssues: ["stale spot or forward", "calendar-arbitrage from interpolation", "wing extrapolation instability", "quote holes", "parameter jumps across recalibrations", "cache and version mismatch"],
    },
    macroConnections: [{ title: "A surface is a map of event pricing", thesis: "Macro regimes affect the level, asymmetry and timing of protection demand rather than moving every option uniformly.", nodes: [{ label: "Inflation / growth surprise", effect: "changes policy and earnings distribution" }, { label: "Rates and forward", effect: "move carry and moneyness coordinates" }, { label: "Risk sentiment", effect: "changes downside protection demand" }, { label: "Surface", effect: "reprices level, skew and term structure" }] }],
    pitfalls: ["Treating a smooth plot as proof of no arbitrage.", "Mixing spot and forward moneyness.", "Fitting mid quotes without spreads or liquidity weights.", "Using a static surface as a claim about future smile dynamics.", "Showing synthetic scenarios as market observations."],
    references: [
      { sourceId: "grzelak-computational-finance", locator: "Lectures 04 and 07 — implied and stochastic volatility", url: "https://github.com/LechGrzelak/Computational-Finance-Course", note: "Research path for the volatility progression; all explanations and implementation are original." },
      { sourceId: "quantlib-upstream", locator: "ql/termstructures/volatility and QuantLib 1.42 release notes", url: "https://github.com/lballabio/QuantLib/tree/master/ql/termstructures/volatility", note: "Current implementation reference for smile sections, SABR and variance-surface representations." },
    ],
    relatedLessonIds: ["vol-implied", "vol-heston"],
  },
  {
    id: "vol-heston",
    slug: "heston-model",
    title: "Heston model",
    subtitle: "Mean-reverting stochastic variance with price–variance correlation",
    domain: "volatility",
    assetClass: "EQ",
    level: "front-office",
    prerequisites: ["Stochastic Volatility", "Itô Calculus", "Characteristic Functions", "Volatility Surface"],
    learningObjectives: ["Interpret each Heston parameter through surface shape and dynamics.", "State the variance positivity and Feller-condition nuance.", "Separate pricing-engine selection from calibration-objective design.", "Recognize parameter degeneracy and recalibration instability."],
    tags: ["Heston", "stochastic variance", "affine model", "Fourier pricing", "calibration"],
    estimatedMinutes: 55,
    lastReviewed: reviewed,
    intuition: {
      lead: "Heston replaces constant volatility with a random, mean-reverting variance process. Negative price–variance correlation creates equity-like downside skew; vol-of-vol controls smile curvature; mean reversion governs how quickly the variance state forgets shocks.",
      points: ["v₀ anchors short-dated variance.", "θ anchors the long-run variance level.", "κ controls mean-reversion speed, σᵥ the variance-of-variance and ρ the leverage channel."],
    },
    marketContext: {
      why: "One parameter set can generate a full surface and richer dynamics than Black–Scholes, making Heston a durable benchmark for exotics, calibration studies and model comparison.",
      instruments: ["vanilla option calibration grids", "barriers and forward-starts", "variance-sensitive exotics"],
      quoteConvention: "Calibration inputs must first be normalized under the asset class’s actual quote and forward conventions. Heston parameters are not portable across inconsistent surfaces.",
    },
    mathematics: {
      notation: ["vₜ: instantaneous variance", "κ: mean-reversion speed", "θ: long-run variance", "σᵥ: vol-of-vol", "ρ: Brownian correlation"],
      formulas: [
        { label: "Risk-neutral dynamics", latex: "dS_t=(r-q)S_tdt+\\sqrt{v_t}S_tdW_t^S", interpretation: "Spot diffusion uses the stochastic variance state." },
        { label: "Variance process", latex: "dv_t=\\kappa(\\theta-v_t)dt+\\sigma_v\\sqrt{v_t}dW_t^v", interpretation: "CIR-style mean reversion supports a non-negative variance state under suitable schemes." },
        { label: "Leverage correlation", latex: "d\\langle W^S,W^v\\rangle_t=\\rho\\,dt", interpretation: "Negative correlation links spot selloffs to variance shocks and generates downside skew." },
        { label: "Feller condition", latex: "2\\kappa\\theta\\ge\\sigma_v^2", interpretation: "A sufficient condition for the continuous-time variance process to stay strictly positive; market calibrations can violate it, demanding careful numerics." },
      ],
    },
    derivation: {
      title: "Why the Heston characteristic function is affine",
      introduction: "Fourier pricing is practical because the log-price/variance transform has an exponential-affine form.",
      steps: [
        { title: "Transform the state", body: "Use log spot x = log S so the diffusion generator is polynomial-affine in variance.", latex: "x_t=\\log S_t" },
        { title: "Propose an affine transform", body: "Conditioned on the current state, assume the characteristic function is exponential-affine in log spot and variance.", latex: "\\phi(u,\\tau)=\\exp(C(u,\\tau)+D(u,\\tau)v_t+iux_t)" },
        { title: "Insert into the backward equation", body: "Matching constant and variance coefficients produces coupled Riccati ordinary differential equations for C and D.", latex: "\\partial_\\tau D=a(u)+b(u)D+cD^2" },
        { title: "Solve and integrate", body: "The closed transform is inserted into a stable Fourier inversion or COS method to recover vanilla prices.", latex: "C(K,T)=\\mathcal F^{-1}[\\phi(u,T)]", check: "Implementation must manage branch choices, integration domains and numerical cancellation." },
      ],
      conclusion: "Affine structure makes Heston computationally tractable; it does not make calibration uniquely identified or hedging dynamics correct by construction.",
    },
    pricing: {
      method: "Use an analytical characteristic-function engine, COS/Fourier inversion, PDE or a validated Monte Carlo scheme depending on payoff and required sensitivities.",
      calibration: "Minimize weighted premium or volatility residuals across a selected grid. Constrain parameters, use multiple initial guesses and report parameter stability alongside fit error.",
      limitations: ["Five parameters can be weakly identified on sparse grids.", "A good vanilla fit does not guarantee exotic hedge performance.", "Naive Euler variance discretization can become negative."],
    },
    implementation: {
      architecture: ["Separate the Heston process from pricing engines.", "Validate parameter domains and correlation.", "Benchmark analytical, numerical and Monte Carlo prices.", "Track fit error and parameter drift through calibration runs."],
      quantLib: "Current QuantLib exposes HestonProcess, HestonModel and several engines. The process/model/engine separation is valuable, but API use comes after convention alignment and numerical validation.",
      pythonLab: {
        title: "Full-truncation Heston paths",
        objective: "Simulate a stable educational path set with deterministic randomness and non-negative variance in diffusion terms.",
        code: `from __future__ import annotations\n\nimport numpy as np\n\ndef heston_paths(*, paths: int = 20_000, steps: int = 252, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:\n    rng = np.random.default_rng(seed)\n    dt = 1.0 / steps\n    spot = np.full(paths, 100.0)\n    variance = np.full(paths, 0.04)\n    kappa, theta, vol_of_vol, rho, rate = 2.0, 0.04, 0.45, -0.70, 0.03\n    for _ in range(steps):\n        z1 = rng.standard_normal(paths)\n        z2 = rho * z1 + np.sqrt(1.0 - rho**2) * rng.standard_normal(paths)\n        v_pos = np.maximum(variance, 0.0)\n        spot *= np.exp((rate - 0.5 * v_pos) * dt + np.sqrt(v_pos * dt) * z1)\n        variance += kappa * (theta - v_pos) * dt + vol_of_vol * np.sqrt(v_pos * dt) * z2\n    return spot, np.maximum(variance, 0.0)\n\nspot_t, variance_t = heston_paths()\nassert np.isfinite(spot_t).all() and np.all(spot_t > 0.0)\nassert np.isfinite(variance_t).all() and np.all(variance_t >= 0.0)\nprint(round(float(spot_t.mean()), 4), round(float(variance_t.mean()), 6))`,
        output: ["Deterministic terminal spot and variance summary for seed 7."],
        checks: ["Spot remains positive under the log update.", "Diffusion uses truncated non-negative variance.", "A deterministic seed makes regression checks repeatable."],
      },
    },
    interactiveLabs: [{ id: "heston", title: "Heston dynamics lab", description: "Move mean reversion, long-run variance, vol-of-vol and correlation; inspect variance persistence and smile response." }],
    frontOffice: {
      quote: "Calibration error is visible. Parameter instability is often more expensive.",
      inputs: ["clean vanilla surface", "curves and forwards", "calibration weights", "parameter bounds", "engine tolerances"],
      calibration: "Use liquid strikes, multiple starts and stable parameter transforms. Evaluate premium residuals, bid/offer coverage and day-over-day parameter movement.",
      risk: ["surface-vega buckets", "spot/variance correlation", "vol-of-vol exposure", "forward smile dynamics", "calibration jump risk"],
      workflow: ["freeze market snapshot", "select instruments", "calibrate", "validate repricing", "compare parameters", "run exotic risk", "approve or fall back"],
      productionIssues: ["local optimizer traps", "characteristic-function branch errors", "bad variance discretization", "unstable finite-difference Greeks", "parameters pinned at constraints"],
    },
    macroConnections: [{ title: "Leverage and variance regimes", thesis: "Risk-off moves often combine falling spot, higher variance and stronger downside skew—the channel represented by negative spot–variance correlation.", nodes: [{ label: "Risk-off shock", effect: "spot falls and protection demand rises" }, { label: "Variance state", effect: "jumps above long-run mean" }, { label: "Mean reversion", effect: "controls decay of the shock" }, { label: "Option surface", effect: "level and skew reprice" }] }],
    pitfalls: ["Reading calibrated parameters as directly observable economic constants.", "Ignoring Feller violations in simulation choices.", "Comparing fits without the same quote weights.", "Using one calibration start and declaring uniqueness."],
    references: [
      { sourceId: "grzelak-computational-finance", locator: "Lectures 07 and 10 — stochastic volatility and Heston Monte Carlo", url: "https://github.com/LechGrzelak/Computational-Finance-Course", note: "Research source for model progression and numerical experiments; text and code are independently implemented." },
      { sourceId: "quantlib-upstream", locator: "Heston process, model, engines and test suite", url: "https://github.com/lballabio/QuantLib", note: "Current implementation reference and validation architecture." },
    ],
    relatedLessonIds: ["vol-surface", "vol-implied"],
  },
];

const trackOrder = volatilityTrack.nodes.map((node) => node.academyLessonId);
export const volatilityLessons: AcademyLesson[] = [...flagshipVolatilityLessons, ...additionalVolatilityLessons]
  .sort((left, right) => trackOrder.indexOf(left.id) - trackOrder.indexOf(right.id));
