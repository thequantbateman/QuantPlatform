import type { AcademyFormula, AcademyFormulaDepth, AcademyLesson, AcademyReference, AcademyTrack } from "./types";
import { additionalRatesLessons, ratesAdvancedTrackNodes } from "./ratesAdvancedLessons";
import { ratesOptionalityLesson, ratesOptionalityTrackNode } from "./ratesOptionalityLesson";

const reviewed = "2026-08-12";

const references: AcademyReference[] = [
  { sourceId: "grzelak-ir-xva", locator: "Interest-rate products, term structures and short-rate lectures", url: "https://github.com/LechGrzelak/FinancialEngineering_IR_xVA", note: "Research map for the rates progression and numerical experiments; all platform prose and code are original." },
  { sourceId: "grzelak-computational-finance", locator: "Stochastic processes, Monte Carlo and model-calibration lectures", url: "https://github.com/LechGrzelak/Computational-Finance-Course", note: "Mathematical cross-reference for stochastic dynamics and implementation checks." },
  { sourceId: "quantlib-upstream", locator: "Current term structures, indexes, rate helpers, instruments, engines and tests", url: "https://github.com/lballabio/QuantLib", note: "Implementation authority for production abstractions; Academy derives the mathematics before introducing library objects." },
];

type RateSeed = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  level: AcademyLesson["level"];
  minutes: number;
  legacyRoutes: string[];
  prerequisites: string[];
  objectives: string[];
  tags: string[];
  lead: string;
  points: string[];
  why: string;
  instruments: string[];
  quote: string;
  notation: string[];
  formulas: Array<Omit<AcademyFormula, "depth" | "analyticsHref">>;
  derivationTitle: string;
  derivationIntro: string;
  steps: AcademyLesson["derivation"]["steps"];
  conclusion: string;
  method: string;
  calibration: string;
  limitations: string[];
  python: AcademyLesson["implementation"]["pythonLab"];
  quantLib: string;
  lab: AcademyLesson["interactiveLabs"][number];
  deskQuote: string;
  inputs: string[];
  risk: string[];
  workflow: string[];
  productionIssues: string[];
  macro: AcademyLesson["macroConnections"][number];
  pitfalls: string[];
  related: string[];
};

type FormulaContract = {
  formulaDepths: AcademyFormulaDepth[];
  formulaAnalyticsHrefs: string[];
  derivationFormulaIndex: number;
  derivationDepth: 2 | 3;
};

const formulaContracts: Record<string, FormulaContract> = {
  "rate-discount": { formulaDepths: [1, 2, 2], formulaAnalyticsHrefs: ["/lab?lab=curve", "/lab?lab=curve", "/lab?lab=curve"], derivationFormulaIndex: 1, derivationDepth: 2 },
  "rate-zero-forward": { formulaDepths: [2, 2, 2], formulaAnalyticsHrefs: ["/lab?lab=curve", "/lab?lab=curve", "/lab?lab=curve"], derivationFormulaIndex: 1, derivationDepth: 2 },
  "rate-conventions": { formulaDepths: [1, 2, 1], formulaAnalyticsHrefs: ["/lab?lab=curve", "/lab?lab=curve", "/lab?lab=curve"], derivationFormulaIndex: 1, derivationDepth: 2 },
  "rate-ois": { formulaDepths: [2, 2, 1], formulaAnalyticsHrefs: ["/lab?lab=curve", "/lab?lab=curve", "/lab?lab=curve"], derivationFormulaIndex: 0, derivationDepth: 2 },
  "rate-fra-futures": { formulaDepths: [2, 2, 3], formulaAnalyticsHrefs: ["/lab?lab=curve", "/lab?lab=curve", "/lab?lab=curve"], derivationFormulaIndex: 1, derivationDepth: 2 },
  "rate-swaps": { formulaDepths: [1, 2, 2], formulaAnalyticsHrefs: ["/lab?lab=curve", "/lab?lab=curve", "/lab?lab=curve"], derivationFormulaIndex: 1, derivationDepth: 2 },
};

const seeds: RateSeed[] = [
  {
    id: "rate-discount", slug: "discount-factors", title: "Discount factors and present value", subtitle: "Making time value an observable curve object rather than a single-rate shortcut", level: "foundation", minutes: 48,
    legacyRoutes: ["/learn/rates/discount-factor"], prerequisites: ["Cash-flow timing", "Exponential functions", "No-arbitrage"], objectives: ["Define a discount factor as the price of a unit zero-coupon payoff.", "Convert consistently between discount factors and continuously compounded zero rates.", "Value deterministic cash-flow schedules on one valuation date.", "Explain why discount factors—not rates—are the primitive linear pricing weights."], tags: ["discount factor", "present value", "zero coupon", "numeraire"],
    lead: "A curve is a collection of prices across dates. The discount factor P(0,T) is the time-zero price of one currency unit paid at T; every quoted rate is a convention-dependent transform of that price.", points: ["Present value is linear in cash flows but nonlinear in quoted rates.", "P(0,0)=1 anchors the curve; positive discount factors are required even when rates are negative.", "The valuation date, settlement calendar and collateral agreement determine which curve applies."],
    why: "Every bond, swap, FRA, option and xVA exposure needs date-specific pricing weights. A flat rate can illustrate time value, but a desk marks and risks a full discount curve.", instruments: ["zero-coupon bonds", "OIS-discounted cash flows", "fixed-rate bonds", "collateralised derivatives"], quote: "Rates are decimal inputs. This track uses continuously compounded zero rates and ACT/365-like year fractions for educational examples; traded instruments retain their market-native conventions.",
    notation: ["P(t,T): discount factor from t to T", "r(0,T): continuously compounded zero rate", "C_i: cash flow at T_i", "V_0: present value on the curve date"], formulas: [
      { label: "Zero-coupon price", latex: "P(0,T)=e^{-r(0,T)T}", interpretation: "A zero rate is the constant continuous rate that reproduces one maturity-specific discount factor." },
      { label: "Cash-flow present value", latex: "V_0=\\sum_{i=1}^{n}C_iP(0,T_i)", interpretation: "Each dated cash flow receives its own linear pricing weight." },
      { label: "Discount-ratio return", latex: "\\frac{P(0,T_1)}{P(0,T_2)}=e^{f(0;T_1,T_2)(T_2-T_1)}", interpretation: "Ratios of discount factors determine forward accumulation between dates." },
    ], derivationTitle: "From no-arbitrage unit payoffs to present value", derivationIntro: "Replicate each deterministic payment with its matching zero-coupon claim, then add the replicated positions.", steps: [
      { title: "Define the unit payoff", body: "Let a zero-coupon claim pay exactly one currency unit at T. Its clean time-zero price is P(0,T).", latex: "1_{T}\\longleftrightarrow P(0,T)" },
      { title: "Scale each maturity claim", body: "A deterministic cash flow C_i at T_i is replicated by C_i units of that zero-coupon claim.", latex: "C_i\\,1_{T_i}\\longleftrightarrow C_iP(0,T_i)" },
      { title: "Use portfolio additivity", body: "Summing the maturity-matched claims gives the value of the whole cash-flow schedule.", latex: "V_0=\\sum_i C_iP(0,T_i)" },
      { title: "Transform only for reporting", body: "Convert P(0,T) to a rate after valuation, using one explicit compounding and year-fraction convention.", latex: "r(0,T)=-\\ln P(0,T)/T", check: "Reconstructing P from r must recover the original factor to numerical tolerance." },
    ], conclusion: "Discount factors are the curve’s pricing coordinates; rate conventions are reversible views only when date, basis and compounding are retained.", method: "Value cash flows directly on discount factors, then report rate-space diagnostics. Preserve valuation date, settlement date, currency and collateral regime with the curve snapshot.", calibration: "Infer discount factors from liquid collateral-consistent instruments. The direct exponential conversion in this lesson is educational, not an instrument bootstrap.", limitations: ["A deterministic curve does not model future rate uncertainty.", "Credit, funding and collateral terms can require different curves.", "Calendar and settlement choices can move cash-flow dates and PV."],
    python: { title: "Discount-factor inversion and cash-flow PV", objective: "Implement the primitive price-rate transform and verify inversion.", code: `from __future__ import annotations\n\nimport math\n\ndef discount(rate: float, time: float) -> float:\n    if not math.isfinite(rate) or not math.isfinite(time) or time < 0:\n        raise ValueError("finite rate and non-negative time required")\n    return math.exp(-rate * time)\n\ndef present_value(cashflows: list[tuple[float, float]], rate: float) -> float:\n    return sum(amount * discount(rate, time) for time, amount in cashflows)\n\nr, t = 0.0375, 7.25\np = discount(r, t)\nassert abs(-math.log(p) / t - r) < 1e-12\npv = present_value([(1.0, 4.0), (2.0, 4.0), (3.0, 104.0)], r)\nassert 0.0 < pv < 112.0\nprint(f"P(0,{t})={p:.8f} | PV={pv:.6f}")`, output: ["A reproducible discount factor and positive present value below undiscounted cash flows."], checks: ["Rate and time are finite.", "Time is non-negative.", "Rate-to-discount inversion holds to 1e-12."] },
    quantLib: "Use a YieldTermStructureHandle to pass discounting consistently into instruments and engines. Keep the evaluation date, settlement conventions and observer updates explicit; do not reconstruct discounting ad hoc inside each pricer.", lab: { id: "discounting", title: "Discount geometry laboratory", description: "Shift the curve regime and horizon; compare discount factors, zero rates and PV weights." },
    deskQuote: "The curve is a set of dated prices. Calling it ‘the rate’ hides the risk you actually own.", inputs: ["valuation and settlement dates", "currency and collateral regime", "dated discount nodes", "day-count basis", "cash-flow schedule"], risk: ["parallel DV01", "curve-shape risk", "collateral-basis risk", "settlement mismatch"], workflow: ["freeze curve snapshot", "validate dates and factors", "map cash flows", "discount by date", "reconcile PV and sensitivities"], productionIssues: ["stale evaluation date", "percent/decimal mismatch", "wrong collateral curve", "date moved without rebuilding schedule"],
    macro: { title: "Policy transmission through discounting", thesis: "Expected policy and term premia alter the price of future money, changing the present value of every distant cash flow.", nodes: [{ label: "Policy path", effect: "reprices overnight expectations" }, { label: "Discount curve", effect: "moves dated pricing weights" }, { label: "Present value", effect: "revalues future cash flows" }, { label: "Risk allocation", effect: "shifts duration demand" }] }, pitfalls: ["Using one scalar rate for a multi-date portfolio.", "Assuming discount factors must be below one in negative-rate regimes.", "Mixing compounding conventions during inversion.", "Ignoring collateral and settlement state."], related: ["rate-zero-forward", "rate-conventions"],
  },
  {
    id: "rate-zero-forward", slug: "zero-and-forward-rates", title: "Zero rates and forward rates", subtitle: "Reading curve slope as a sequence of no-arbitrage break-even rates—not forecasts by default", level: "foundation", minutes: 54,
    legacyRoutes: ["/learn/rates/zero-rates", "/learn/rates/forward-rates"], prerequisites: ["Discount factors", "Logarithms", "Forward contracts"], objectives: ["Recover zero and forward rates from discount factors.", "Distinguish instantaneous, continuously compounded and simple forwards.", "Derive a forward rate by comparing two zero-coupon strategies.", "Interpret an inverted or humped curve without equating forwards to expected future spot rates."], tags: ["zero rate", "forward rate", "term structure", "expectations"],
    lead: "A zero rate compresses one maturity’s discount factor; a forward rate describes the marginal price of money between two dates. The forward curve is fixed by today’s discount curve under no-arbitrage, while its interpretation as an expectation requires an additional model and risk-premium view.", points: ["Average zero rates and marginal forward rates contain different information.", "A smooth zero curve can imply unstable forwards if the interpolation is poorly chosen.", "Forward equals expected future short rate only under a specified measure and after accounting for convexity or term premium."],
    why: "Forwards drive FRA and swap projection, carry and roll-down, policy-path inference, and the hedge map between adjacent curve tenors.", instruments: ["zero-coupon bonds", "FRAs", "OIS forwards", "swaps and futures"], quote: "This lesson displays annualised continuous forwards unless labelled simple. Market contracts use their specified accrual basis and compounding.", notation: ["z(T): continuous zero rate", "f(0;T_1,T_2): interval forward", "f(0,T): instantaneous forward", "δ(T_1,T_2): accrual fraction"], formulas: [
      { label: "Interval continuous forward", latex: "f(0;T_1,T_2)=\\frac{\\ln P(0,T_1)-\\ln P(0,T_2)}{T_2-T_1}", interpretation: "The constant continuous rate implied for investing between two future dates." },
      { label: "Simple forward", latex: "L(0;T_1,T_2)=\\frac{P(0,T_1)/P(0,T_2)-1}{\\delta(T_1,T_2)}", interpretation: "The money-market-style forward compatible with an accrual-period payoff." },
      { label: "Instantaneous forward", latex: "f(0,T)=-\\partial_T\\ln P(0,T)", interpretation: "The local slope of log discount factors; interpolation determines its numerical behaviour." },
    ], derivationTitle: "Locking a future borrowing rate with zero-coupon claims", derivationIntro: "Compare investing to T₂ directly with investing to T₁ and rolling under a rate fixed today.", steps: [
      { title: "Buy a T₂ unit payoff", body: "Pay P(0,T₂) today to receive one unit at T₂." },
      { title: "Normalize at the forward start", body: "A claim costing P(0,T₂)/P(0,T₁) at T₁ has the same time-zero value after discounting to today.", latex: "P(0,T_1)\\frac{P(0,T_2)}{P(0,T_1)}=P(0,T_2)" },
      { title: "Invert the accumulation factor", body: "The simple forward accumulation from T₁ to T₂ is the reciprocal of that forward-start discount price.", latex: "1+\\delta L=\\frac{P(0,T_1)}{P(0,T_2)}" },
      { title: "Take the local limit", body: "With continuous compounding, shrink the interval to obtain the instantaneous forward as the derivative of log discount.", latex: "f(0,T)=-\\partial_T\\ln P(0,T)", check: "Integrating f from 0 to T must reconstruct -ln P(0,T)." },
    ], conclusion: "Forward rates are no-arbitrage coordinates of today’s curve; forecast interpretation is a separate economic claim.", method: "Construct forwards from one internally consistent discount representation and expose both interval and instantaneous diagnostics.", calibration: "Forwards inherit the fitted curve and interpolation. Validate quote repricing and inspect forwards between every pair of adjacent pillars.", limitations: ["Forward curves amplify node noise and interpolation artifacts.", "Credit-sensitive term rates are not interchangeable with overnight forwards.", "Risk premia and convexity separate forwards from expectations."],
    python: { title: "Zero-to-forward consistency", objective: "Compute interval forwards and reconstruct the terminal discount factor.", code: `from __future__ import annotations\n\nimport math\n\ndef forward(p1: float, p2: float, dt: float) -> float:\n    if min(p1, p2, dt) <= 0:\n        raise ValueError("positive discounts and interval required")\n    return math.log(p1 / p2) / dt\n\np1 = math.exp(-0.025 * 2.0)\np2 = math.exp(-0.034 * 5.0)\nf = forward(p1, p2, 3.0)\nreconstructed = p1 * math.exp(-f * 3.0)\nassert abs(reconstructed - p2) < 1e-12\nprint(f"2y5y continuous forward={f:.4%}")`, output: ["A forward rate whose compounded discount ratio exactly reproduces P(0,5)."], checks: ["Discount factors and interval are positive.", "Forward reconstruction matches the terminal node.", "Output is annualised continuous rate."] },
    quantLib: "Query zeroRate and forwardRate from the same YieldTermStructure instance with explicit compounding, frequency and day count. Never compare outputs without aligning those arguments.", lab: { id: "zero-forward-rates", title: "Zero/forward curve laboratory", description: "Switch normal, inverted and humped regimes; compare averages, marginal forwards and discount-factor reconstruction." },
    deskQuote: "A forward is what today’s curve locks—not an unqualified prediction of where fixing will print.", inputs: ["discount pillars", "interpolation rule", "compounding", "day-count basis", "forward interval"], risk: ["slope and butterfly risk", "interpolation risk", "forward-start basis", "convexity"], workflow: ["normalize discount factors", "derive zero view", "derive forwards", "inspect jumps", "reconstruct and reconcile"], productionIssues: ["mixed rate conventions", "negative year fraction", "node duplicates", "forward spikes hidden by zero-rate plot"],
    macro: { title: "Forward curves as priced policy paths", thesis: "Central-bank expectations move the front end, while term premia, inflation uncertainty and supply shape longer forwards.", nodes: [{ label: "Macro release", effect: "changes expected policy timing" }, { label: "Discount nodes", effect: "reprice by maturity" }, { label: "Forward curve", effect: "localises the move" }, { label: "Trade expression", effect: "selects level, slope or butterfly" }] }, pitfalls: ["Calling the forward curve a pure forecast.", "Comparing simple and continuous forwards directly.", "Using zero-rate interpolation without inspecting implied forwards.", "Dropping the accrual basis from a term-rate payoff."], related: ["rate-discount", "rate-conventions", "rate-curve-bootstrap"],
  },
  {
    id: "rate-conventions", slug: "conventions-calendars-schedules", title: "Rate conventions, calendars and schedules", subtitle: "Treating dates, accruals and quote syntax as executable valuation inputs", level: "foundation", minutes: 58,
    legacyRoutes: ["/learn/rates/day-count-conventions"], prerequisites: ["Discount factors", "Calendar arithmetic", "Simple interest"], objectives: ["Compute ACT/360, ACT/365F and 30/360 accrual factors.", "Separate business-day adjustment from the accrual-period definition.", "Translate simple, periodic and continuous compounding without changing economic value.", "Build a schedule whose stubs, lags and payment dates are auditable."], tags: ["day count", "calendar", "schedule", "compounding", "settlement"],
    lead: "Rates products are contracts on dates. A day-count basis, holiday calendar, roll rule, fixing lag and stub convention change cash flows before any pricing model is called.", points: ["The same two dates can produce different accrual factors under different bases.", "Adjusted payment dates and unadjusted accrual boundaries serve different contractual roles.", "Rate conversion is valid only when the horizon and accrual factor are held fixed."],
    why: "Schedule errors create deterministic P&L breaks, failed confirmations and unexplained basis risk across bonds, swaps, FRAs and floating coupons.", instruments: ["deposits", "bonds", "FRAs", "OIS and term swaps"], quote: "Every quote must carry currency, index, tenor, spot lag, day count, compounding, business-day convention and calendar set.", notation: ["δ_B(d_1,d_2): basis-specific year fraction", "N: periodic compounding frequency", "r_c: continuous rate", "r_s: simple rate"], formulas: [
      { label: "Simple accumulation", latex: "A(d_1,d_2)=1+r_s\\,\\delta_B(d_1,d_2)", interpretation: "Money-market coupons scale by the contract’s basis-specific accrual factor." },
      { label: "Periodic-to-continuous conversion", latex: "r_c=N\\ln\\left(1+\\frac{r_N}{N}\\right)", interpretation: "Equivalent rates preserve the accumulation factor over one year." },
      { label: "Stub coupon", latex: "C=N_{notional}\\,r\\,\\delta_B(d_{start},d_{end})", interpretation: "Irregular periods change cash amount through the actual contractual accrual." },
    ], derivationTitle: "Preserving one economic payoff across quote conventions", derivationIntro: "Equate accumulation factors rather than equating the displayed rate numbers.", steps: [
      { title: "Freeze the contractual dates", body: "Identify unadjusted accrual boundaries, adjusted payment date, fixing date and settlement date before computing time." },
      { title: "Apply the contractual basis", body: "Compute δ_B on the accrual boundaries. Do not substitute an ACT/365-like model clock for a coupon’s contractual ACT/360 basis." },
      { title: "Equate accumulation factors", body: "Set simple, periodic or continuous accumulation equal over the same horizon.", latex: "1+r_s\\delta=\\left(1+r_N/N\\right)^{N\\delta}=e^{r_c\\delta}" },
      { title: "Validate the schedule", body: "Check monotonic dates, expected period count, stub location and that every fixing precedes its payment under the index convention.", check: "Rebuild the final maturity independently from start date, tenor and roll rule." },
    ], conclusion: "Conventions are not labels around a model; they determine the model inputs and contractual cash flows.", method: "Represent dates and conventions as typed inputs, generate schedules once, then price from the resulting dated cash flows.", calibration: "Normalize market quotes to internal discount or forward representations only after instrument-specific helpers have reproduced every convention.", limitations: ["Holiday calendars change over time and require version control.", "Cross-currency products can combine calendars and settlement lags.", "Educational year fractions omit many market-specific edge cases."],
    python: { title: "Equivalent compounding conventions", objective: "Convert one simple rate to an economically equivalent continuous rate.", code: `from __future__ import annotations\n\nimport math\n\ndef simple_to_continuous(rate: float, accrual: float) -> float:\n    if accrual <= 0 or 1.0 + rate * accrual <= 0:\n        raise ValueError("invalid simple accumulation")\n    return math.log1p(rate * accrual) / accrual\n\nr_simple, accrual = 0.0425, 91.0 / 360.0\nr_cont = simple_to_continuous(r_simple, accrual)\nassert abs(math.exp(r_cont * accrual) - (1 + r_simple * accrual)) < 1e-12\nprint(f"simple={r_simple:.4%} | continuous={r_cont:.4%}")`, output: ["Two different rate numbers with identical period accumulation."], checks: ["Accrual factor is positive.", "Accumulation remains positive.", "Economic value is preserved after conversion."] },
    quantLib: "Compose Calendar, DayCounter, BusinessDayConvention, DateGeneration rule and Schedule explicitly. Use index objects for fixing conventions; avoid hand-built date arithmetic once production calendars matter.", lab: { id: "rate-conventions", title: "Convention translation laboratory", description: "Hold the payoff fixed while changing basis, accrual length and compounding; inspect rate and cash-flow differences." },
    deskQuote: "A one-day schedule break is not a rounding error; it is a different contract.", inputs: ["effective and maturity dates", "calendar set", "business-day rule", "day count", "stub and payment lag"], risk: ["schedule mismatch", "fixing risk", "settlement fail", "accrual-basis P&L"], workflow: ["parse term sheet", "generate schedule", "compare confirmation", "calculate accruals", "freeze dated cash flows"], productionIssues: ["calendar version drift", "adjusted boundary reused for accrual", "wrong end-of-month flag", "stub placed on wrong end"],
    macro: { title: "Operational plumbing around policy transmission", thesis: "Policy changes reach contracts through index fixings and payment schedules; lags determine when the economic shock enters realised cash flow.", nodes: [{ label: "Policy decision", effect: "changes overnight and term fixings" }, { label: "Index convention", effect: "sets observation timing" }, { label: "Schedule", effect: "maps fixing into cash flow" }, { label: "Realised P&L", effect: "arrives on contract dates" }] }, pitfalls: ["Using adjusted dates for every contractual purpose.", "Converting rates without preserving accumulation.", "Treating ACT/360 and ACT/365F as display formats.", "Ignoring fixing and payment lags."], related: ["rate-discount", "rate-ois", "rate-swaps"],
  },
  {
    id: "rate-ois", slug: "ois-compounding", title: "OIS and overnight compounding", subtitle: "Building collateral discounting from daily fixings, observation rules and policy expectations", level: "intermediate", minutes: 64,
    legacyRoutes: ["/learn/rates/ois"], prerequisites: ["Rate conventions", "Discount factors", "Floating coupons"], objectives: ["Derive an overnight compounded coupon from daily fixings.", "Explain lookback, lockout and observation-shift effects.", "Relate OIS par rates to collateral-consistent discount factors.", "Separate realised coupon accrual from the forward curve used before fixings occur."], tags: ["OIS", "overnight rate", "compounding", "collateral", "discounting"],
    lead: "An OIS floating leg compounds many overnight observations into one coupon. The observation schedule—not a single forecast rate—controls realised accrual, and collateralisation makes OIS instruments central to discount-curve construction.", points: ["Compounding uses a product of daily accumulation factors.", "Known fixings and projected future observations coexist inside a live coupon.", "Observation shifts and lockouts change which fixing is applied to which accrual day."],
    why: "OIS curves discount collateralised derivatives, express policy expectations and anchor the multi-curve framework.", instruments: ["overnight indexed swaps", "OIS futures", "collateralised swaps", "compounded overnight coupons"], quote: "State overnight index, payment frequency, day count, lookback or observation shift, lockout, payment lag and collateral currency.", notation: ["R_i: overnight fixing", "δ_i: daily accrual fraction", "A: coupon accrual fraction", "K: fixed OIS rate"], formulas: [
      { label: "Compounded overnight coupon", latex: "R_{comp}=\\frac{\\prod_{i=1}^{n}(1+R_i\\delta_i)-1}{A}", interpretation: "Daily simple accrual factors compound multiplicatively over the coupon period." },
      { label: "Spot-starting OIS par rate", latex: "K_{OIS}=\\frac{P(0,T_0)-P(0,T_n)}{\\sum_{j=1}^{n}\\alpha_jP(0,T_j)}", interpretation: "Under a single collateral curve, fixed and floating legs balance at inception." },
      { label: "Known/projected split", latex: "\\prod_i(1+R_i\\delta_i)=\\prod_{i\\le k}(1+R_i^{fix}\\delta_i)\\prod_{i>k}(1+R_i^{fwd}\\delta_i)", interpretation: "A live coupon combines realised observations and curve-projected future accrual." },
    ], derivationTitle: "From daily overnight loans to an OIS floating coupon", derivationIntro: "Roll one unit of notional through each overnight interval and retain every daily accumulation factor.", steps: [
      { title: "Accrue one overnight interval", body: "One unit becomes 1+R_iδ_i over the i-th business-day interval." },
      { title: "Reinvest through the period", body: "Each day starts from the accumulated prior balance, so factors multiply rather than rates add.", latex: "A_{0,n}=\\prod_i(1+R_i\\delta_i)" },
      { title: "Convert to a coupon rate", body: "Subtract principal and divide by the coupon accrual A to report an annualised compounded rate.", latex: "R_{comp}=(A_{0,n}-1)/A" },
      { title: "Price the swap", body: "Discount each fixed and floating payment on the collateral curve; at par, the difference between start and end discount factors balances the fixed annuity.", check: "At the computed par rate, fixed-leg PV minus floating-leg PV must be zero." },
    ], conclusion: "OIS pricing couples a precise overnight observation contract with collateral-consistent discounting.", method: "Build the observation schedule, splice known fixings with forwards, compound the coupon, then discount every payment on the collateral curve.", calibration: "Bootstrap short maturities from cash or futures-like OIS instruments and longer maturities from OIS swaps, repricing every helper after each pillar.", limitations: ["The par formula shown assumes one curve and no payment irregularities.", "Fallback and observation conventions differ across currencies.", "Holiday calendars create non-uniform daily accruals."],
    python: { title: "Daily overnight compounding", objective: "Compound irregular daily accruals and compare with an additive approximation.", code: `from __future__ import annotations\n\nimport math\n\ndef compounded_rate(fixings: list[float], accruals: list[float]) -> float:\n    if len(fixings) != len(accruals) or not fixings:\n        raise ValueError("aligned non-empty fixing path required")\n    factor = math.prod(1.0 + r * d for r, d in zip(fixings, accruals))\n    total = sum(accruals)\n    if total <= 0 or factor <= 0:\n        raise ValueError("invalid accrual path")\n    return (factor - 1.0) / total\n\nrates = [0.0410, 0.0411, 0.0412, 0.0412]\ndeltas = [1/360, 1/360, 3/360, 1/360]\nrate = compounded_rate(rates, deltas)\nassert rate > sum(r*d for r, d in zip(rates, deltas)) / sum(deltas)\nprint(f"compounded overnight={rate:.6%}")`, output: ["A compounded rate slightly above the day-weighted arithmetic average."], checks: ["Fixings and accruals align.", "Weekend accrual receives the correct day weight.", "Every accumulation factor remains positive."] },
    quantLib: "Use the currency-specific OvernightIndex and OvernightIndexedSwap abstractions with explicit telescopic-value-date and observation settings. Curve helpers must share the same index conventions as the priced trade.", lab: { id: "ois-compounding", title: "OIS policy-path laboratory", description: "Apply hikes, cuts and lockout rules to a daily path; compare realised compound, forward projection and par fixed rate." },
    deskQuote: "The front end is a calendar-weighted policy path, not a row of equally spaced dots.", inputs: ["overnight index fixings", "observation convention", "coupon schedule", "collateral curve", "payment lag"], risk: ["meeting-date DV01", "fixing exposure", "front-end basis", "calendar risk"], workflow: ["load fixings", "build observations", "splice projections", "compound coupon", "reprice and bucket risk"], productionIssues: ["missing fixing", "incorrect weekend weight", "wrong observation shift", "discount/projection curve confusion"],
    macro: { title: "Central-bank path into OIS", thesis: "Expected meeting outcomes reprice dated overnight forwards; realised decisions subsequently enter compounded coupons through fixings.", nodes: [{ label: "Meeting expectation", effect: "moves forward overnight segments" }, { label: "OIS curve", effect: "prices the policy path" }, { label: "Daily fixing", effect: "realises one path segment" }, { label: "Coupon / P&L", effect: "compounds the realised path" }] }, pitfalls: ["Averaging overnight rates instead of compounding.", "Treating observation shift and lookback as synonyms.", "Ignoring known-versus-projected fixing splits.", "Discounting collateralised cash flows on a credit-sensitive term curve."], related: ["rate-conventions", "rate-curve-bootstrap", "rate-multicurve"],
  },
  {
    id: "rate-fra-futures", slug: "fra-futures-convexity", title: "FRAs, rate futures and convexity", subtitle: "Locking a forward fixing while separating settlement timing and futures convexity", level: "intermediate", minutes: 62,
    legacyRoutes: ["/learn/rates/fras", "/learn/rates/interest-rate-futures"], prerequisites: ["Forward rates", "Accrual conventions", "Risk-neutral pricing"], objectives: ["Price an FRA from projected fixing and discounting.", "Derive the standard settlement-in-advance denominator.", "Explain why a daily-margined futures quote differs from a forward rate.", "Map front-end curve shocks into FRA and futures P&L."], tags: ["FRA", "rate futures", "convexity adjustment", "forward fixing"],
    lead: "A forward rate agreement exchanges the difference between a contracted rate and a future fixing. Futures trade a related exposure but settle variation margin daily, creating a covariance effect between rates and reinvestment.", points: ["FRA value needs both projection and discounting.", "Settlement timing changes the payoff denominator.", "Futures equals forward only when daily-margin covariance is negligible."],
    why: "FRAs and rate futures are the liquid building blocks for forward-curve construction, central-bank path trading and front-end hedging.", instruments: ["forward rate agreements", "three-month rate futures", "OIS futures", "forward-start swaps"], quote: "State index, fixing period, accrual basis, settlement timing and whether the market price is quoted as 100 minus rate.", notation: ["F: projected simple fixing", "K: contractual rate", "δ: accrual fraction", "D: settlement discount factor"], formulas: [
      { label: "End-settled FRA PV", latex: "V=N\\,D(0,T_2)\\,\\delta\\,[F(0;T_1,T_2)-K]", interpretation: "Projected coupon difference discounted from the payment date." },
      { label: "Start-settled FRA payoff", latex: "\\Pi_{T_1}=N\\frac{\\delta(L_{T_1}-K)}{1+\\delta L_{T_1}}", interpretation: "The end-period interest difference is discounted back to the fixing/start date." },
      { label: "Futures-forward adjustment", latex: "F_{fut}\\approx F_{fwd}+\\operatorname{ConvAdj}(\\sigma,\\rho,T_1,T_2)", interpretation: "Daily margining adds a model-dependent covariance correction." },
    ], derivationTitle: "From a future deposit to an FRA payoff", derivationIntro: "Compare the interest on a deposit struck at K with one struck at the future observed rate.", steps: [
      { title: "Define the accrual-period interest", body: "On notional N, the interest difference paid at T₂ is Nδ(L−K)." },
      { title: "Settle in advance if required", body: "Discount that difference from T₂ to T₁ using the realised deposit rate L.", latex: "\\Pi_{T_1}=N\\delta(L-K)/(1+\\delta L)" },
      { title: "Value before fixing", body: "Replace the unknown fixing with its projection under the appropriate curve and discount the resulting cash flow." },
      { title: "Separate futures margining", body: "Daily variation margin is reinvested at stochastic rates; estimate the covariance correction with a stated rate model.", check: "At K=F, a newly struck idealised FRA has zero PV." },
    ], conclusion: "FRA and futures quotes target similar forward exposure but differ through settlement mechanics and convexity.", method: "Project the index fixing, apply exact payoff timing and discounting, then add a separately governed futures-convexity adjustment when mapping exchange quotes.", calibration: "Use liquid futures with price, expiry, delivery period and convexity assumptions; repricing must be reported before and after the adjustment.", limitations: ["Convexity adjustment is model and volatility dependent.", "Exchange contract dates may not align with OTC tenors.", "Fallback index conventions can alter legacy FRA economics."],
    python: { title: "FRA zero-PV and settlement check", objective: "Verify the par condition and settlement-in-advance payoff.", code: `from __future__ import annotations\n\ndef fra_start_payoff(notional: float, fixing: float, strike: float, accrual: float) -> float:\n    denominator = 1.0 + accrual * fixing\n    if notional < 0 or accrual <= 0 or denominator <= 0:\n        raise ValueError("invalid FRA domain")\n    return notional * accrual * (fixing - strike) / denominator\n\nnotional, forward, accrual = 10_000_000.0, 0.0435, 0.25\nassert fra_start_payoff(notional, forward, forward, accrual) == 0.0\nup = fra_start_payoff(notional, forward + 0.0001, forward, accrual)\nassert 240.0 < up < 250.0\nprint(f"+1bp fixing payoff={up:.2f}")`, output: ["A positive near-250 currency-unit payoff for a +1bp fixing move on 10mm × 0.25y."], checks: ["Par FRA has zero payoff.", "Settlement denominator is positive.", "Bump direction matches receiver/payoff convention."] },
    quantLib: "Use the relevant IborIndex or overnight-index futures helper, contract-specific dates and a documented convexity adjustment. Keep futures price conversion separate from forward-rate projection.", lab: { id: "fra-futures", title: "FRA/futures convexity laboratory", description: "Move rate volatility, correlation and settlement timing; compare forward, futures and FRA PV." },
    deskQuote: "A futures strip is a policy view plus a margining convention plus a convexity assumption.", inputs: ["contract dates", "index curve", "discount curve", "accrual basis", "volatility/correlation adjustment"], risk: ["meeting-date risk", "convexity", "roll and delivery risk", "basis to OTC"], workflow: ["map exchange dates", "convert price to rate", "apply convexity", "bootstrap forward", "hedge residual basis"], productionIssues: ["wrong IMM date", "price/rate sign error", "silent zero convexity", "misaligned settlement timing"],
    macro: { title: "Policy surprises in futures strips", thesis: "A policy surprise reprices meeting-dated forward periods first; volatility and rate-level changes also alter the futures-forward convexity adjustment.", nodes: [{ label: "Policy surprise", effect: "shifts expected fixings" }, { label: "Futures strip", effect: "reprices meeting periods" }, { label: "Convexity mapping", effect: "translates futures to forwards" }, { label: "FRA / swap book", effect: "realises basis and hedge P&L" }] }, pitfalls: ["Reading 100-price with the wrong sign.", "Treating futures and forwards as identical.", "Omitting the settlement-in-advance denominator.", "Hedging OTC dates with exchange contracts without basis attribution."], related: ["rate-zero-forward", "rate-swaps", "rate-curve-bootstrap"],
  },
  {
    id: "rate-swaps", slug: "interest-rate-swaps", title: "Interest-rate swaps", subtitle: "Turning a strip of forwards and discount factors into par coupon, PV and curve risk", level: "intermediate", minutes: 68,
    legacyRoutes: ["/learn/rates/swaps", "/learn/rates/par-swap-rate"], prerequisites: ["OIS discounting", "Forward rates", "Cash-flow schedules"], objectives: ["Derive fixed- and floating-leg present values.", "Compute the par swap rate as floating PV divided by fixed annuity.", "Explain payer/receiver sign and clean/dirty PV.", "Map swap value to discount and projection curves."], tags: ["interest rate swap", "par rate", "annuity", "DV01"],
    lead: "A vanilla swap exchanges a fixed coupon schedule for a floating index schedule. The fixed leg is a discounted annuity; the floating leg is projected from forward fixings and discounted on the collateral curve.", points: ["Par rate is a ratio, not an average of forwards.", "In a single-curve spot-starting idealisation the floating leg telescopes; multi-curve projection generally does not.", "Payer-fixed gains when par rates rise, but bucketed curve moves determine actual P&L."],
    why: "Swaps are core instruments for duration transfer, curve construction, corporate hedging, asset-liability management and macro expression.", instruments: ["fixed-for-floating swaps", "forward-start swaps", "asset swaps", "swap spreads"], quote: "State currency, index, effective/maturity dates, fixed frequency and basis, floating basis, payment lags, collateral and payer/receiver direction.", notation: ["A(0): fixed-leg annuity", "K: contractual fixed rate", "S(0): par swap rate", "F_i: projected floating fixing"], formulas: [
      { label: "Fixed-leg annuity", latex: "A(0)=\\sum_{i=1}^{n}\\alpha_iP_d(0,T_i)", interpretation: "Present value of one unit of fixed coupon paid on the schedule." },
      { label: "Multi-curve par rate", latex: "S(0)=\\frac{\\sum_{j=1}^{m}\\delta_jP_d(0,U_j)F_p(0;U_{j-1},U_j)}{A(0)}", interpretation: "Projected floating coupons are discounted on the collateral curve and divided by the fixed annuity." },
      { label: "Receiver-fixed PV", latex: "V_{rec}=N\\,A(0)[K-S(0)]", interpretation: "The compact identity holds once S is computed on the same schedules and curves." },
    ], derivationTitle: "Balancing fixed and floating legs at par", derivationIntro: "Price both legs independently on their dated schedules, then solve the zero-PV coupon.", steps: [
      { title: "Build the fixed annuity", body: "Multiply each fixed accrual by its payment-date discount factor and sum." },
      { title: "Project floating coupons", body: "For each floating period, project the index fixing from its forwarding curve and multiply by accrual, notional and discount factor.", latex: "PV_{flt}=N\\sum_j\\delta_jP_d(0,U_j)F_p(0;U_{j-1},U_j)" },
      { title: "Solve the par condition", body: "Set NK A(0)=PV_flt and divide by N A(0).", latex: "S(0)=PV_{flt}/[N A(0)]" },
      { title: "Value an off-market trade", body: "Subtract the current par-equivalent leg from the contractual fixed leg using the chosen receiver/payer sign.", latex: "V_{rec}=NA(K-S)", check: "A swap struck at S must reprice to zero to the curve tolerance." },
    ], conclusion: "Swap PV is the discounted difference between one contractual coupon and the curve-implied par coupon on exact schedules.", method: "Generate both schedules, project each floating coupon, discount every payment, compute par coupon and return leg-level PV plus bucketed sensitivities.", calibration: "Use swaps as bootstrap helpers only after short-end instruments and conventions are fixed. Every input quote should reprice within its market tolerance.", limitations: ["The compact telescoping floating-leg formula is not generally multi-curve.", "Credit, funding and collateral optionality are omitted.", "Linear DV01 misses large-move convexity and curve-shape interaction."],
    python: { title: "Par coupon and receiver-fixed PV", objective: "Compute annuity, par rate and verify zero PV at inception.", code: `from __future__ import annotations\n\nimport math\n\ntimes = [1., 2., 3., 4., 5.]\nrate = 0.04\ndiscounts = [math.exp(-rate*t) for t in times]\nannuity = sum(discounts)\npar = (1.0 - discounts[-1]) / annuity\nreceiver_pv = 10_000_000.0 * annuity * (par - par)\nassert abs(receiver_pv) < 1e-10\nassert abs(par - (math.exp(rate) - 1.0)) < 1e-12\nprint(f"annuity={annuity:.8f} | par={par:.6%}")`, output: ["A positive annuity and a par coupon that gives zero initial PV."], checks: ["Discount factors are positive.", "Annuity uses fixed accrual weights.", "Par trade reprices to zero."] },
    quantLib: "Use VanillaSwap with separate forwarding and discounting handles, explicit Schedules and a DiscountingSwapEngine. Inspect leg NPVs and cash flows rather than accepting only the net NPV.", lab: { id: "interest-rate-swaps", title: "Swap par/PV laboratory", description: "Change level, slope and fixed coupon; inspect fixed annuity, floating PV, par rate and payer/receiver P&L." },
    deskQuote: "A swap is one headline rate wrapped around two schedules and two curve roles.", inputs: ["fixed/floating schedules", "projection curve", "discount curve", "notional and coupon", "payer/receiver direction"], risk: ["discount DV01", "forward DV01", "curve spread", "fixing and carry"], workflow: ["build schedules", "project float", "discount legs", "solve par/PV", "bucket and reconcile risk"], productionIssues: ["payer/receiver sign", "wrong index tenor", "schedule mismatch", "using par formula with inconsistent curves"],
    macro: { title: "Swap curves and the policy/term-premium split", thesis: "Front-end swaps react to the policy path, while longer maturities combine expected short rates, inflation risk, supply and term premium.", nodes: [{ label: "Macro regime", effect: "changes policy and inflation expectations" }, { label: "Forward path", effect: "moves projected coupons" }, { label: "Swap par rate", effect: "balances discounted legs" }, { label: "Duration book", effect: "realises level and curve P&L" }] }, pitfalls: ["Averaging projected forwards instead of annuity-weighting them.", "Applying the telescoping formula in a multi-curve setup.", "Reporting DV01 without direction and curve role.", "Ignoring accrued and already-fixed coupons."], related: ["rate-ois", "rate-curve-bootstrap", "rate-multicurve"],
  },
];

const foundationalRatesLessons: AcademyLesson[] = seeds.map((seed) => {
  const formulaContract = formulaContracts[seed.id];
  return {
  id: seed.id,
  slug: seed.slug,
  title: seed.title,
  subtitle: seed.subtitle,
  domain: "rates",
  assetClass: "IR",
  level: seed.level,
  prerequisites: seed.prerequisites,
  learningObjectives: seed.objectives,
  tags: seed.tags,
  estimatedMinutes: seed.minutes,
  lastReviewed: reviewed,
  legacyRoutes: seed.legacyRoutes,
  intuition: { lead: seed.lead, points: seed.points },
  marketContext: { why: seed.why, instruments: seed.instruments, quoteConvention: seed.quote },
  mathematics: { notation: seed.notation, formulas: seed.formulas.map((formula, index) => ({ ...formula, depth: formulaContract.formulaDepths[index], analyticsHref: formulaContract.formulaAnalyticsHrefs[index] })) },
  derivation: { formulaIndex: formulaContract.derivationFormulaIndex, depth: formulaContract.derivationDepth, title: seed.derivationTitle, introduction: seed.derivationIntro, steps: seed.steps, conclusion: seed.conclusion },
  pricing: { method: seed.method, calibration: seed.calibration, limitations: seed.limitations },
  implementation: {
    architecture: ["Parse dated market inputs and conventions at the boundary.", "Build deterministic curve objects in the framework-free quant layer.", "Return PV, repricing residuals and sensitivities together.", "Test inversion, par conditions, monotonic dates and invalid domains."],
    quantLib: seed.quantLib,
    pythonLab: seed.python,
  },
  interactiveLabs: [seed.lab],
  frontOffice: { quote: seed.deskQuote, inputs: seed.inputs, calibration: seed.calibration, risk: seed.risk, workflow: seed.workflow, productionIssues: seed.productionIssues },
  macroConnections: [seed.macro],
  pitfalls: seed.pitfalls,
  references,
  relatedLessonIds: seed.related,
  };
});

export const ratesLessons: AcademyLesson[] = [...foundationalRatesLessons, ratesOptionalityLesson, ...additionalRatesLessons];

export const ratesTrack: AcademyTrack = {
  id: "rates",
  title: "Rates & curves",
  subtitle: "From discount factors to stochastic term-structure dynamics",
  description: "A sequenced rates path through conventions, overnight compounding, products, curve construction, multi-curve valuation, risk and no-arbitrage dynamics.",
  nodes: [
    { id: "discount", title: "Discount factors", stage: "Present-value primitives", level: "foundation", href: "/learn/rates/discount-factors", academyLessonId: "rate-discount" },
    { id: "zero-forward", title: "Zero and forward rates", stage: "Curve coordinates", level: "foundation", href: "/learn/rates/zero-and-forward-rates", academyLessonId: "rate-zero-forward" },
    { id: "conventions", title: "Conventions and schedules", stage: "Executable contracts", level: "foundation", href: "/learn/rates/conventions-calendars-schedules", academyLessonId: "rate-conventions" },
    { id: "ois", title: "OIS compounding", stage: "Collateral and policy path", level: "intermediate", href: "/learn/rates/ois-compounding", academyLessonId: "rate-ois" },
    { id: "fra-futures", title: "FRAs and futures", stage: "Forward fixing and convexity", level: "intermediate", href: "/learn/rates/fra-futures-convexity", academyLessonId: "rate-fra-futures" },
    { id: "swaps", title: "Interest-rate swaps", stage: "Par rate and leg PV", level: "intermediate", href: "/learn/rates/interest-rate-swaps", academyLessonId: "rate-swaps" },
    ratesOptionalityTrackNode,
    ...ratesAdvancedTrackNodes,
  ],
};
