import type { AcademyLesson, AcademyTrackNode } from "./types";

export const ratesOptionalityLesson: AcademyLesson = {
  id: "rate-optionality",
  slug: "caps-floors-swaptions",
  title: "Caps, floors and swaptions",
  subtitle: "Pricing rate optionality from forwards, annuities and explicit volatility conventions",
  domain: "rates",
  assetClass: "IR",
  level: "front-office",
  prerequisites: ["Forward rates", "Interest-rate swaps", "Multi-curve valuation", "Black–76"],
  learningObjectives: [
    "Decompose caps and floors into discounted caplets and floorlets on exact accrual periods.",
    "Price European swaptions from the forward swap rate and fixed-leg annuity.",
    "Distinguish normal, lognormal and shifted-lognormal volatility conventions.",
    "Connect quote calibration, smile risk, negative rates and settlement conventions to desk P&L.",
  ],
  tags: ["cap", "floor", "swaption", "Black-76", "Bachelier", "annuity"],
  estimatedMinutes: 86,
  lastReviewed: "2026-08-13",
  intuition: {
    lead: "A rate option is an option on a future fixing or forward swap rate, but its cash value is carried by a discount factor or swap annuity. The quote is incomplete until the volatility coordinate and settlement convention are named.",
    points: [
      "A cap is a strip: every caplet has its own fixing date, accrual, forward and discount weight.",
      "A European swaption is economically an option on a par swap rate multiplied by the underlying fixed-leg annuity.",
      "Normal and lognormal volatilities are different coordinates; converting by reusing the same number is not valid.",
    ],
  },
  marketContext: {
    why: "Caps and swaptions supply liquid volatility coordinates for hedging, callable products and calibration of short-rate or market models.",
    instruments: ["caplets and floorlets", "caps and floors", "payer and receiver swaptions", "collars and callable structures"],
    quoteConvention: "State currency, index, expiry, tenor, strike, forward, annuity or discount weight, premium/vol quote, normal/lognormal/shifted convention, shift, settlement and collateral curves.",
  },
  mathematics: {
    notation: ["F_i: forward fixing", "K: strike", "A(0): swap annuity", "N: notional", "\\alpha_i: accrual fraction", "\\sigma_N,\\sigma_{LN}: normal/lognormal volatility"],
    formulas: [
      { label: "Caplet under Black–76", latex: "V_{caplet}=N\\alpha_iP(0,T_{i+1})[F_i\\Phi(d_1)-K\\Phi(d_2)]", interpretation: "The option value is a forward-option payoff weighted by the payment-date discount factor and accrual.", depth: 2, analyticsHref: "/lab?lab=curve" },
      { label: "European payer swaption", latex: "V_{pay}=NA(0)[S_0\\Phi(d_1)-K\\Phi(d_2)]", interpretation: "The fixed-leg annuity converts the option on the forward swap rate into currency PV.", depth: 3, analyticsHref: "/lab?lab=curve" },
      { label: "Normal-model payer value", latex: "V_{pay}^{N}=NA(0)[(S_0-K)\\Phi(z)+\\sigma_N\\sqrt{T}\\,\\phi(z)]", interpretation: "Bachelier remains defined through zero and negative forwards; its volatility is quoted in absolute rate units.", depth: 2, analyticsHref: "/lab?lab=curve" },
    ],
  },
  derivation: {
    formulaIndex: 1,
    depth: 3,
    title: "From swap exercise value to the annuity measure",
    introduction: "Write the exercise-date swap value, factor out its fixed-leg annuity and take the expectation under the annuity numeraire.",
    steps: [
      { title: "Value the underlying swap", body: "At expiry, a payer swap has value equal to the fixed-leg annuity times the excess of the par swap rate over strike.", latex: "V_{swap}(T)=NA(T)[S_T-K]" },
      { title: "Apply the option payoff", body: "The payer swaption retains only positive exercise value.", latex: "V_{pay}(T)=NA(T)(S_T-K)^+" },
      { title: "Choose the annuity numeraire", body: "Under the annuity measure, the forward swap rate is a martingale within the model assumptions.", latex: "V_{pay}(0)=NA(0)\\mathbb E^{Q^A}[(S_T-K)^+]" },
      { title: "Select the quote distribution", body: "Lognormal Black–76, shifted lognormal or normal Bachelier determines the option expectation and admissible rate domain." },
      { title: "Reprice the quoted premium", body: "Use the exact forward, annuity, settlement and strike associated with the market quote.", check: "Payer minus receiver PV must equal N A(0)(S_0-K), independently of volatility." },
    ],
    conclusion: "Rate-option pricing is a numeraire-weighted forward option; the convention and cash-flow geometry are as important as the closed-form formula.",
  },
  pricing: {
    method: "Build discount and projection curves, calculate forwards/annuities on exact schedules, apply the declared normal or (shifted) lognormal formula, and return premium plus point vega and parity diagnostics.",
    calibration: "Calibrate a surface by expiry, tenor and strike/delta with bid/ask-aware weights. Preserve quote convention, shift and interpolation policy; test residuals in both premium and quoted-volatility space.",
    limitations: ["Black and Bachelier prescribe different dynamics and tail shapes.", "A single volatility does not represent strike smile or term structure.", "Cash and physical settlement can use different annuity definitions and exercise mechanics."],
  },
  implementation: {
    architecture: ["Build schedules and curve weights before invoking the option kernel.", "Keep volatility convention and shift in typed inputs.", "Return parity, intrinsic/time value and point-vega diagnostics.", "Test zero-volatility, ATM, negative-rate and settlement boundaries."],
    quantLib: "Use Cap/Floor and Swaption instruments with explicit indexes, schedules, settlement and engines. Volatility structures must carry Normal, ShiftedLognormal or Lognormal type and displacement; calibration helpers must reproduce their own premiums.",
    pythonLab: {
      title: "Black and normal payer swaption comparison",
      objective: "Price one annuity-weighted payoff in two declared volatility coordinates and verify payer/receiver parity.",
      code: `from __future__ import annotations\n\nimport math\nfrom statistics import NormalDist\n\nN = NormalDist()\n\ndef black_option(f: float, k: float, t: float, vol: float, annuity: float, call: bool) -> float:\n    if min(f, k, t, vol, annuity) <= 0:\n        raise ValueError("positive Black inputs required")\n    sign = 1.0 if call else -1.0\n    root_t = math.sqrt(t)\n    d1 = (math.log(f/k) + 0.5*vol*vol*t)/(vol*root_t)\n    d2 = d1 - vol*root_t\n    return annuity*sign*(f*N.cdf(sign*d1)-k*N.cdf(sign*d2))\n\nf, k, t, vol, annuity = 0.032, 0.035, 2.0, 0.24, 4.35\npayer = black_option(f, k, t, vol, annuity, True)\nreceiver = black_option(f, k, t, vol, annuity, False)\nassert abs((payer-receiver)-annuity*(f-k)) < 1e-12\nprint(f"payer={payer:.8f} receiver={receiver:.8f}")`,
      output: ["Positive payer/receiver values satisfying annuity-weighted option parity."],
      checks: ["Black-domain inputs are positive.", "Annuity is expressed in PV units per unit coupon.", "Payer-receiver parity holds to numerical tolerance."],
    },
  },
  interactiveLabs: [{ id: "rate-optionality", title: "Rate-option convention laboratory", description: "Move expiry, strike, volatility regime and quote convention; compare premium, intrinsic value, annuity weight and point vega." }],
  frontOffice: {
    quote: "A swaption vol without expiry, tenor, strike, convention, shift and settlement is not a price coordinate.",
    inputs: ["discount/projection curves", "expiry and underlying schedule", "strike and forward", "annuity and settlement", "volatility convention/surface"],
    calibration: "Reprice each caplet or swaption helper in its native convention and premium; inspect residuals, parameter stability and excluded quotes.",
    risk: ["expiry/tenor vega", "smile and skew", "annuity/curve delta", "volga and model basis"],
    workflow: ["freeze curves and vol snapshot", "normalize quote conventions", "price and verify parity", "calibrate with diagnostics", "bucket risk and stress settlement"],
    productionIssues: ["normal/lognormal mix", "missing displacement", "cash-annuity mismatch", "stale forward or schedule"],
  },
  macroConnections: [{ title: "Policy uncertainty into rate optionality", thesis: "Uncertainty about the policy path and terminal rate redistributes volatility across option expiries and underlying swap tenors.", nodes: [{ label: "Policy uncertainty", effect: "moves expected fixing distribution" }, { label: "Cap/swaption surface", effect: "reprices expiry, tenor and strike" }, { label: "Model calibration", effect: "maps liquid quotes to dynamics" }, { label: "Callable book", effect: "changes exercise and convexity" }] }],
  pitfalls: ["Feeding a normal volatility into Black–76.", "Ignoring the annuity or payment-date discount weight.", "Calibrating to vols without repricing premiums.", "Treating cash and physical settlement as interchangeable."],
  references: [
    { sourceId: "grzelak-ir-xva", locator: "Caps, swaptions and interest-rate modelling lectures", url: "https://github.com/LechGrzelak/FinancialEngineering_IR_xVA", note: "Research map for rate-option numeraires and calibration; platform text and code are original." },
    { sourceId: "quantlib-upstream", locator: "Current cap/floor, swaption and volatility-structure tests", url: "https://github.com/lballabio/QuantLib", note: "Implementation authority for instrument, settlement and quote-convention boundaries." },
  ],
  relatedLessonIds: ["rate-swaps", "rate-multicurve", "rate-hull-white", "rate-hjm", "vol-sabr"],
};

export const ratesOptionalityTrackNode: AcademyTrackNode = {
  id: "optionality",
  title: "Caps, floors and swaptions",
  stage: "Rate optionality and calibration",
  level: "front-office",
  href: "/learn/rates/caps-floors-swaptions",
  academyLessonId: "rate-optionality",
};
