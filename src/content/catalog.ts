import type { AssetClass, ContentEntry, ContentType, Difficulty } from "./types";

type Seed = {
  assetClass: AssetClass;
  title: string;
  description: string;
  intuition: string;
  mathematics: string;
  marketUse: string;
  relatedTopics?: string[];
  difficulty?: Difficulty;
  type?: ContentType;
  assumptions?: string[];
  deskView?: string;
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function createEntry(seed: Seed): ContentEntry {
  const slug = slugify(seed.title);
  const type = seed.type ?? "concept";
  return {
    ...seed,
    slug,
    category: seed.assetClass === "Foundations" ? "Foundations" : seed.assetClass,
    difficulty: seed.difficulty ?? "foundation",
    type,
    prerequisites: seed.assetClass === "Foundations" ? [] : ["Risk-Neutral Pricing"],
    relatedTopics: seed.relatedTopics ?? [],
    labs: seed.title.includes("Curve") || seed.title.includes("Rate") || seed.title.includes("Discount") ? ["yield-curve"] : seed.assetClass === "EQ" || seed.assetClass === "FX" ? ["black-scholes", "greeks"] : [],
    tags: [seed.assetClass, seed.type ?? "concept", seed.difficulty ?? "foundation"],
    authors: ["TheQuantBateman Research"],
    lastReviewed: "2026-08-10",
    assumptions: seed.assumptions ?? assumptionsFor(type),
    deskView: seed.deskView ?? deskViewFor(seed.assetClass, type),
  };
}

function assumptionsFor(type: ContentType): string[] {
  if (type === "instrument") return [
    "Contract dates, calendars, settlement, notionals and payoff currency are part of the valuation input.",
    "Discounting and projection conventions must match the collateral and quotation framework.",
    "The displayed payoff omits legal terms and lifecycle events unless stated otherwise.",
  ];
  if (type === "model") return [
    "The state dynamics and valuation measure are stated independently of the calibration instruments.",
    "Parameters are treated as deterministic over the pricing run unless the model says otherwise.",
    "A calibration fit does not validate out-of-sample dynamics or hedge performance.",
  ];
  if (type === "method" || type === "lab") return [
    "The numerical target, discretization and stopping rule must be fixed before comparing outputs.",
    "Convergence is assessed against bias, variance or residual tolerances rather than visual smoothness.",
    "Finite precision, boundary treatment and input conditioning can dominate model error.",
  ];
  if (type === "market-note") return [
    "The venue, timestamp, executable side and data status are part of every market observation.",
    "Midpoints and derived probabilities are analytical coordinates, not guaranteed executable levels.",
    "Licensing, freshness and resolution rules determine how the observation may be used.",
  ];
  if (type === "research") return [
    "The proposed method is compared with an established baseline on held-out scenarios.",
    "Parameter uncertainty and extrapolation are reported rather than hidden by one fit metric.",
    "Production use requires independent validation, monitoring and a documented fallback.",
  ];
  return [
    "Definitions, units and information sets are fixed before the mathematical relationship is applied.",
    "Rates and volatilities use decimal units and time uses year fractions unless stated otherwise.",
    "The relationship is local to its stated assumptions and should not be extrapolated mechanically.",
  ];
}

function deskViewFor(assetClass: AssetClass, type: ContentType): string {
  if (type === "instrument") return `Reconcile the contractual payoff before reading the ${assetClass} risk. Small date or convention changes can move cash flows before any model parameter moves.`;
  if (type === "model") return `A good ${assetClass} calibration explains today's instruments; the hedge reveals whether the assumed dynamics survive tomorrow's move.`;
  if (type === "method" || type === "lab") return `Report the ${assetClass} number with its convergence evidence. A stable-looking output can still carry discretization bias or an ill-conditioned input.`;
  if (type === "market-note") return `Start from the executable side and timestamp. Derived ${assetClass} signals are only as reliable as the market state and resolution convention beneath them.`;
  if (type === "research") return `Keep an established ${assetClass} baseline beside the new method and define the scenario in which the fallback takes control.`;
  return `State the convention, identify the observable and ask which ${assetClass} risk remains after the proposed hedge.`;
}

const seeds: Seed[] = [
  { assetClass: "Foundations", title: "Random Variables", description: "Map uncertain outcomes to measurable numerical values.", intuition: "A random variable is a rule that assigns a number to each possible market outcome. The randomness is in the outcome, not in the rule.", mathematics: "X: \\Omega \\to \\mathbb{R}, \\quad F_X(x)=\\mathbb{P}[X\\le x]", marketUse: "P&L distributions, payoff definitions, risk measures and simulation all start here.", relatedTopics: ["Brownian Motion", "Risk-Neutral Pricing"] },
  { assetClass: "Foundations", title: "Brownian Motion", description: "The continuous-time noise behind classical diffusion models.", intuition: "Brownian motion accumulates independent, normally distributed shocks. Paths are continuous but nowhere differentiable.", mathematics: "W_0=0, \\quad W_t-W_s \\sim \\mathcal{N}(0,t-s)", marketUse: "It drives Black-Scholes diffusions and remains a baseline building block for stochastic models.", relatedTopics: ["Random Variables", "Black-Scholes"], difficulty: "practitioner" },
  { assetClass: "Foundations", title: "Risk-Neutral Pricing", description: "Value discounted payoffs under a measure that removes risk premia.", intuition: "Change the probability lens so tradable assets grow at the funding rate after carry. Then discount the expected payoff.", mathematics: "V_t=B_t\\,\\mathbb{E}^{\\mathbb{Q}}[B_T^{-1}X_T\\mid\\mathcal{F}_t]", marketUse: "This is the common pricing spine of derivatives desks, not a claim that investors are actually risk neutral.", relatedTopics: ["Black-Scholes", "Discount Factors"], difficulty: "practitioner" },
  { assetClass: "Foundations", title: "Bid Ask and Mid", description: "Separate executable sides from the midpoint used for analysis.", intuition: "Bid is where a buyer stands, ask is where a seller stands and mid is only their arithmetic centre. The spread is a cost and a liquidity signal.", mathematics: "m=\\tfrac12(bid+ask), \\quad spread=ask-bid", marketUse: "Quote validation, transaction-cost estimates, marking policy and model-versus-market comparisons.", relatedTopics: ["Market Price vs Model Price", "Streaming Quotes and Staleness"], type: "market-note" },
  { assetClass: "Foundations", title: "Market Price vs Model Price", description: "Keep observed quotes separate from calculated fair values.", intuition: "A market price is an observation with venue, timestamp and executable conditions. A model price is a conditional calculation under inputs and assumptions.", mathematics: "V_{model}=\\mathcal{M}(x,\\theta,c), \\quad P_{market}=\\text{observed quote}", marketUse: "Calibration, relative-value analysis and governance depend on never confusing the two.", relatedTopics: ["Bid Ask and Mid", "Risk-Neutral Pricing"], difficulty: "practitioner" },
  { assetClass: "Foundations", title: "Streaming Quotes and Staleness", description: "Treat market data as a timed state, not a timeless number.", intuition: "A stream changes a quote over time. Heartbeats, reconnects and freshness thresholds tell the interface when to stop calling the last value current.", mathematics: "age=t_{now}-t_{market}, \\quad stale=\\mathbf{1}_{age>\\tau}", marketUse: "Prevents stale values from silently driving risk, calibration or user decisions.", relatedTopics: ["Reference vs Real-Time Data", "Bid Ask and Mid"], type: "method", difficulty: "practitioner" },
  { assetClass: "Foundations", title: "Reference vs Real-Time Data", description: "Distinguish official observations, delayed feeds and executable streams.", intuition: "Reference data can be authoritative without being current. Real-time data can be current without carrying redistribution rights.", mathematics: "status\\in\\{LIVE,DELAYED,EOD,REFERENCE,DEMO\\}", marketUse: "Source selection, licensing, freshness labels and fallback behaviour.", relatedTopics: ["Streaming Quotes and Staleness", "Market Price vs Model Price"] },
  { assetClass: "Foundations", title: "Prediction Market Probabilities", description: "Interpret binary contract prices without treating them as certainty.", intuition: "A YES price resembles an implied probability, but liquidity, fees, risk preferences and market structure can separate it from a calibrated real-world forecast.", mathematics: "p_{implied}\\approx P_{YES}, \\quad P_{YES}+P_{NO}\\approx 1", marketUse: "Macro event monitoring and scenario weighting with explicit semantic caveats.", relatedTopics: ["Risk-Neutral Pricing", "Market Price vs Model Price"], type: "market-note", difficulty: "practitioner" },
  { assetClass: "Foundations", title: "Prediction Event Market Outcome and Token", description: "Keep event, market, outcome and CLOB token identifiers distinct.", intuition: "An event groups related questions. Each market defines a condition, each outcome names one possible payoff, and each outcome token is the asset that actually trades in the book.", mathematics: "event \\supset market \\supset \\{(outcome_i,token_i)\\}_{i=1}^{n}", marketUse: "Prevents broken joins, wrong subscriptions and accidental flattening of multi-market events.", relatedTopics: ["Prediction Market Probabilities", "Prediction Market Order Books"], type: "method", difficulty: "practitioner" },
  { assetClass: "Foundations", title: "Prediction Market Order Books", description: "Read bid, ask, midpoint, spread, depth and imbalance for outcome tokens.", intuition: "The headline probability hides executable sides and available size. The order book shows how much belief can actually trade near the displayed coordinate.", mathematics: "mid=(bid+ask)/2, \\quad imbalance=(D_b-D_a)/(D_b+D_a)", marketUse: "Liquidity diagnostics, event monitoring, transaction-cost context and stale-price detection.", relatedTopics: ["Bid Ask and Mid", "Prediction Market Probabilities"], type: "market-note", difficulty: "practitioner" },
  { assetClass: "Foundations", title: "Prediction Market Resolution and Negative Risk", description: "Connect settlement rules, oracle resolution and linked mutually exclusive markets.", intuition: "A contract is only as precise as its resolution rule. Negative-risk events link multiple mutually exclusive binary markets, so a single YES/NO label does not describe the full event.", mathematics: "\\sum_i p_i \\approx 1 \\text{ only under exhaustive, exclusive outcomes and market frictions}", marketUse: "Resolution-risk review, event aggregation and correct interpretation of multi-outcome structures.", relatedTopics: ["Prediction Event Market Outcome and Token", "Prediction Market Probabilities"], type: "market-note", difficulty: "front-office" },
  { assetClass: "Foundations", title: "Prediction Market Liquidity Open Interest and Volume", description: "Separate trading activity, outstanding exposure and available book depth.", intuition: "Volume measures turnover, open interest measures outstanding exposure, and liquidity describes the ability to trade without moving price. They answer different questions.", mathematics: "volume=\\sum |q_{trade}|, \\quad OI=\\text{outstanding exposure}, \\quad depth(\\epsilon)=\\sum_{|p-mid|\\le\\epsilon}q", marketUse: "Screening active events, qualifying probability signals and comparing market quality.", relatedTopics: ["Prediction Market Order Books", "Streaming Quotes and Staleness"], type: "market-note", difficulty: "practitioner" },
  { assetClass: "EQ", title: "Realized vs Implied Volatility", description: "Compare measured return dispersion with option-implied volatility.", intuition: "Realized volatility summarizes a historical return path. Implied volatility is solved from a current option price under a chosen model.", mathematics: "\\sigma_{real}=\\sqrt{A\\,Var(r_t)}, \\quad V_{BS}(\\sigma_{imp})=V_{market}", marketUse: "Volatility risk premia, option relative value, hedging review and model diagnostics.", relatedTopics: ["Realized Volatility", "Implied Volatility"], difficulty: "practitioner" },

  { assetClass: "EQ", title: "Equity Forward", description: "Lock a future equity purchase price after funding and dividends.", intuition: "Carry spot forward: financing raises the forward; dividends lower it.", mathematics: "F_{0,T}=S_0e^{(r-q)T}", marketUse: "Forward valuation, futures basis, option parity and dividend-implied analysis.", relatedTopics: ["Black-Scholes", "Implied Volatility"], type: "instrument" },
  { assetClass: "EQ", title: "Black-Scholes", description: "Closed-form European option pricing under lognormal diffusion.", intuition: "A continuously rebalanced hedge removes the diffusion shock, leaving a price pinned by no-arbitrage.", mathematics: "C=S_0e^{-qT}N(d_1)-Ke^{-rT}N(d_2)", marketUse: "Still the quoting and risk lingua franca even where richer models price exotics.", relatedTopics: ["Greeks", "Implied Volatility", "Risk-Neutral Pricing"], difficulty: "practitioner", type: "model" },
  { assetClass: "EQ", title: "Greeks", description: "Local sensitivities that translate model parameters into hedge language.", intuition: "Greeks are slopes and curvatures: how the option changes for a small controlled move.", mathematics: "\\Delta=\\partial_S V, \\quad \\Gamma=\\partial^2_{SS}V, \\quad \\nu=\\partial_\\sigma V", marketUse: "Hedge sizing, scenario interpretation and P&L attribution.", relatedTopics: ["Black-Scholes", "Implied Volatility"], difficulty: "practitioner" },
  { assetClass: "EQ", title: "Implied Volatility", description: "The volatility input that makes a model reproduce a market option price.", intuition: "Implied volatility is a quote coordinate, not a forecast delivered by the market.", mathematics: "\\sigma_{imp}: V_{BS}(\\sigma_{imp})=V_{mkt}", marketUse: "Normalises option prices across strikes, maturities and underlyings.", relatedTopics: ["Black-Scholes", "Volatility Smile"], difficulty: "practitioner" },
  { assetClass: "EQ", title: "Volatility Smile", description: "Strike-dependent implied volatility at a single expiry.", intuition: "Markets charge different volatility for different regions of the terminal distribution.", mathematics: "K \\mapsto \\sigma_{imp}(K,T)", marketUse: "Expresses skew, tail pricing and supply-demand effects.", relatedTopics: ["Implied Volatility", "Volatility Surface"], difficulty: "practitioner" },
  { assetClass: "EQ", title: "Volatility Surface", description: "Implied volatility across strike and maturity.", intuition: "Stack smiles through time and you obtain the market's option-price coordinate system.", mathematics: "(K,T) \\mapsto \\sigma_{imp}(K,T)", marketUse: "Interpolation, marking, scenario risk and exotic calibration inputs.", relatedTopics: ["Volatility Smile", "Local Volatility"], difficulty: "front-office" },

  { assetClass: "FX", title: "FX Spot", description: "The exchange rate for near-immediate delivery between two currencies.", intuition: "An FX rate is always one currency priced in another; the direction matters before any arithmetic begins.", mathematics: "S_t = \\text{units of domestic currency per unit of foreign currency}", marketUse: "Anchor for forwards, swaps, options and cross-currency exposures.", relatedTopics: ["FX Forward", "Garman-Kohlhagen"], type: "instrument" },
  { assetClass: "FX", title: "FX Forward", description: "A future exchange rate implied by two funding curves.", intuition: "Forward points compensate for the interest-rate differential, not an expected spot move.", mathematics: "F_{0,T}=S_0e^{(r_d-r_f)T}", marketUse: "Hedging, carry, basis analysis and option forwards.", relatedTopics: ["FX Spot", "FX Swap"], type: "instrument" },
  { assetClass: "FX", title: "FX Swap", description: "Exchange currencies now and reverse the exchange later.", intuition: "An FX swap moves funding across currencies while keeping most spot risk neutralised.", mathematics: "\\text{swap points}=F_{0,T}-S_0", marketUse: "Treasury funding, liquidity management and forward-curve construction.", relatedTopics: ["FX Forward", "FX Spot"], type: "instrument", difficulty: "practitioner" },
  { assetClass: "FX", title: "Garman-Kohlhagen", description: "Black-Scholes adapted to domestic and foreign interest rates.", intuition: "Treat the foreign currency like a dividend-paying asset whose yield is the foreign rate.", mathematics: "C=S_0e^{-r_fT}N(d_1)-Ke^{-r_dT}N(d_2)", marketUse: "Baseline European FX option valuation and Greeks.", relatedTopics: ["FX Delta Conventions", "FX Volatility Smile"], type: "model", difficulty: "practitioner" },
  { assetClass: "FX", title: "FX Delta Conventions", description: "Premium-adjusted, forward and spot delta quotation choices.", intuition: "The same option can carry different delta numbers under valid market conventions.", mathematics: "\\Delta_{spot}=e^{-r_fT}N(d_1), \\quad \\Delta_{fwd}=N(d_1)", marketUse: "Smile construction and strike inversion require the exact pair-specific convention.", relatedTopics: ["Garman-Kohlhagen", "Risk Reversal"], difficulty: "front-office" },
  { assetClass: "FX", title: "Risk Reversal", description: "Call-minus-put volatility at matched absolute delta.", intuition: "Risk reversal measures directional asymmetry in the smile.", mathematics: "RR_{\\Delta}=\\sigma_{call,\\Delta}-\\sigma_{put,\\Delta}", marketUse: "Quotes skew and packages directional convexity exposure.", relatedTopics: ["Butterfly", "FX Volatility Smile"], difficulty: "front-office", type: "instrument" },
  { assetClass: "FX", title: "Butterfly", description: "A convexity quote combining wing and ATM volatilities.", intuition: "Butterfly asks how expensive both wings are relative to the centre.", mathematics: "BF_{\\Delta}=\\tfrac12(\\sigma_{call,\\Delta}+\\sigma_{put,\\Delta})-\\sigma_{ATM}", marketUse: "Builds smile curvature alongside ATM and risk reversal quotes.", relatedTopics: ["Risk Reversal", "FX Volatility Smile"], difficulty: "front-office", type: "instrument" },
  { assetClass: "FX", title: "FX Volatility Smile", description: "Construct an FX smile from ATM, risk reversal and butterfly quotes.", intuition: "FX desks quote the centre, asymmetry and wing richness rather than every strike directly.", mathematics: "\\{ATM,RR_{25},BF_{25}\\} \\to \\sigma(K)", marketUse: "Vanilla marking, strike construction and exotic calibration.", relatedTopics: ["Risk Reversal", "Butterfly", "FX Delta Conventions"], difficulty: "front-office" },

  { assetClass: "IR", title: "Discount Factors", description: "Present value of one unit of currency paid at a future date.", intuition: "A discount factor is the price today of a future unit under the relevant collateral and currency rules.", mathematics: "P(0,T)=e^{-z(0,T)T}", marketUse: "Every cashflow PV and curve construction step depends on them.", relatedTopics: ["Zero Rates", "Yield Curves"] },
  { assetClass: "IR", title: "Zero Rates", description: "Single-period rates implied by discount factors.", intuition: "A zero rate compresses the discount to one maturity into an annualised number.", mathematics: "z(0,T)=-\\frac{\\ln P(0,T)}{T}", marketUse: "Curve display, scenario construction and model inputs.", relatedTopics: ["Discount Factors", "Forward Rates"] },
  { assetClass: "IR", title: "Forward Rates", description: "Rates implied today for borrowing over a future interval.", intuition: "A forward is the break-even rate between discounting directly and rolling through an intermediate date.", mathematics: "f(T_1,T_2)=\\frac{\\ln P(0,T_1)-\\ln P(0,T_2)}{T_2-T_1}", marketUse: "FRA valuation, swap cashflows and monetary-policy expectations under a chosen curve.", relatedTopics: ["Zero Rates", "FRAs"] },
  { assetClass: "IR", title: "Yield Curves", description: "Term structures linking maturity to discounting or yield.", intuition: "A curve is not one rate stretched through time; every tenor is a different market constraint.", mathematics: "T \\mapsto P(0,T), z(0,T), f(0,T)", marketUse: "Pricing, carry, rolldown, DV01 and scenario risk.", relatedTopics: ["Curve Bootstrapping", "Discount Factors"], difficulty: "practitioner" },
  { assetClass: "IR", title: "OIS", description: "Fixed-versus-compounded overnight indexed swaps.", intuition: "OIS exchanges a fixed rate for realised compounded overnight funding.", mathematics: "PV_{fixed}=PV_{compounded\\ overnight}", marketUse: "Core collateral discounting and overnight-rate exposure.", relatedTopics: ["Interest Rate Swaps", "Curve Bootstrapping"], type: "instrument", difficulty: "practitioner" },
  { assetClass: "IR", title: "FRAs", description: "Contracts fixing a future simple interest rate.", intuition: "An FRA settles the difference between a contracted rate and the fixing for a future accrual period.", mathematics: "PV=N\\delta P(0,T_2)(F-K)", marketUse: "Short-end rate hedging and forward-curve instruments.", relatedTopics: ["Forward Rates", "Interest Rate Swaps"], type: "instrument", difficulty: "practitioner" },
  { assetClass: "IR", title: "Interest Rate Swaps", description: "Exchange fixed coupons for floating-rate cashflows.", intuition: "The par swap rate makes the fixed leg equal the floating leg at inception.", mathematics: "K_{par}=\\frac{P(0,T_0)-P(0,T_n)}{\\sum_i \\delta_iP(0,T_i)}", marketUse: "Benchmark rate exposure, curve calibration and asset-liability hedging.", relatedTopics: ["OIS", "Curve Bootstrapping"], type: "instrument", difficulty: "practitioner" },
  { assetClass: "IR", title: "Curve Bootstrapping", description: "Solve discount factors sequentially from market instruments.", intuition: "Each liquid instrument pins another part of the curve once earlier cashflows are already known.", mathematics: "\\text{quotes} \\to \\{P(0,T_i)\\}_{i=1}^n", marketUse: "Produces internally consistent pricing curves from deposits, futures, OIS and swaps.", relatedTopics: ["Yield Curves", "Interest Rate Swaps"], type: "method", difficulty: "front-office" },

  { assetClass: "COMM", title: "Spot vs Futures", description: "Separate immediate physical value from exchange-traded future delivery.", intuition: "Storage, funding, convenience and delivery constraints connect spot and futures.", mathematics: "F_{0,T}=S_0e^{(r+u-y)T}", marketUse: "Basis analysis, hedging and curve interpretation.", relatedTopics: ["Forward Curves", "Convenience Yield"], type: "instrument" },
  { assetClass: "COMM", title: "Forward Curves", description: "Commodity delivery prices across maturities.", intuition: "Each point reflects inventory, seasonality, logistics and financing—not merely a price forecast.", mathematics: "T \\mapsto F(0,T)", marketUse: "Hedging programmes, storage economics and spread risk.", relatedTopics: ["Contango", "Backwardation"], difficulty: "practitioner" },
  { assetClass: "COMM", title: "Contango", description: "A forward curve whose later deliveries trade above nearby prices.", intuition: "Carry costs or abundant inventory can make deferred delivery more expensive.", mathematics: "F(0,T_2)>F(0,T_1), \\quad T_2>T_1", marketUse: "Roll yield, storage signals and calendar-spread positioning.", relatedTopics: ["Backwardation", "Convenience Yield"] },
  { assetClass: "COMM", title: "Backwardation", description: "A forward curve whose later deliveries trade below nearby prices.", intuition: "Scarcity and immediate utility can make prompt barrels or inventory unusually valuable.", mathematics: "F(0,T_2)<F(0,T_1), \\quad T_2>T_1", marketUse: "Inventory stress, positive roll and prompt-spread risk.", relatedTopics: ["Contango", "Convenience Yield"] },
  { assetClass: "COMM", title: "Convenience Yield", description: "The non-cash benefit of holding physical inventory.", intuition: "A physical unit can keep a refinery running or meet an unexpected order; that operational value behaves like a yield.", mathematics: "y=r+u-\\frac{1}{T}\\ln(F_{0,T}/S_0)", marketUse: "Explains basis behaviour and embeds scarcity in carry models.", relatedTopics: ["Spot vs Futures", "Forward Curves"], difficulty: "practitioner" },
  { assetClass: "COMM", title: "Black-76", description: "Option pricing on forwards under lognormal forward dynamics.", intuition: "Price the option on the forward and discount the expected payoff back to today.", mathematics: "C=e^{-rT}[FN(d_1)-KN(d_2)]", marketUse: "Common baseline for commodity, caplet and swaption quotation contexts.", relatedTopics: ["Asian Options", "Forward Curves"], type: "model", difficulty: "practitioner" },
  { assetClass: "COMM", title: "Asian Options", description: "Options whose payoff depends on an average price.", intuition: "Averaging dampens the impact of one extreme fixing and better matches gradual physical exposure.", mathematics: "\\max(\\frac1n\\sum_i S_{t_i}-K,0)", marketUse: "Commodity procurement, production and revenue hedging.", relatedTopics: ["Black-76", "Forward Curves"], type: "instrument", difficulty: "front-office" },

  { assetClass: "Frontier", title: "Rough Volatility", description: "Very low regularity volatility models aligned with observed short-scale behaviour.", intuition: "Volatility appears rougher than classical diffusions suggest, especially at short horizons.", mathematics: "H<\\tfrac12 \\text{ in fractional-volatility drivers}", marketUse: "Active research with growing calibration relevance; implementation and hedging remain specialised.", difficulty: "research", type: "research", relatedTopics: ["Neural SDEs", "Bayesian Calibration"] },
  { assetClass: "Frontier", title: "AAD", description: "Adjoint algorithmic differentiation for many sensitivities at near-constant reverse cost.", intuition: "Record the pricing computation, then propagate sensitivities backwards through it.", mathematics: "\\bar{x}_i=\\partial V/\\partial x_i", marketUse: "Industry-standard technique for large-scale Greeks where the implementation supports it.", difficulty: "front-office", type: "method", relatedTopics: ["Differentiable Pricing", "GPU Monte Carlo"] },
  { assetClass: "Frontier", title: "Differentiable Pricing", description: "Pricing systems designed for gradients across models and parameters.", intuition: "Treat calibration and risk as first-class derivatives of the pricing program.", mathematics: "\\nabla_\\theta V(\\theta)", marketUse: "Emerging infrastructure pattern spanning AAD, automatic differentiation and ML frameworks.", difficulty: "research", type: "research", relatedTopics: ["AAD", "Machine Learning Surrogates"] },
  { assetClass: "Frontier", title: "Machine Learning Surrogates", description: "Fast learned approximations to expensive pricing maps.", intuition: "Pay a training cost once, then approximate repeated model evaluations very quickly inside a controlled domain.", mathematics: "\\hat{V}_\\phi(x) \\approx V_{model}(x)", marketUse: "Active deployment area, but error control and extrapolation governance are essential.", difficulty: "research", type: "research", relatedTopics: ["Deep Hedging", "Differentiable Pricing"] },
  { assetClass: "Frontier", title: "Deep Hedging", description: "Learn hedging policies under frictions and non-quadratic objectives.", intuition: "Optimise the trading policy directly when transaction costs and constraints break textbook replication.", mathematics: "\\min_\\pi \\; \\rho(\\text{hedging P\\&L}_\\pi)", marketUse: "Active research and selective experimentation, not a universal replacement for desk risk systems.", difficulty: "research", type: "research", relatedTopics: ["Machine Learning Surrogates", "Neural SDEs"] },
  { assetClass: "Frontier", title: "Neural SDEs", description: "Stochastic differential equations with learned functional components.", intuition: "Keep continuous-time stochastic structure while learning flexible drift or diffusion maps from data.", mathematics: "dX_t=\\mu_\\theta(X_t,t)dt+\\sigma_\\theta(X_t,t)dW_t", marketUse: "Research-stage modelling with challenges in identifiability, stability and governance.", difficulty: "research", type: "research", relatedTopics: ["Rough Volatility", "Bayesian Calibration"] },
  { assetClass: "Frontier", title: "Bayesian Calibration", description: "Infer parameter distributions rather than one best-fit point.", intuition: "Calibration uncertainty is information; retain it instead of hiding it behind one optimiser output.", mathematics: "p(\\theta\\mid y)\\propto p(y\\mid\\theta)p(\\theta)", marketUse: "Research and specialist risk analysis, especially where parameter uncertainty matters.", difficulty: "research", type: "research", relatedTopics: ["Rough Volatility", "Machine Learning Surrogates"] },
  { assetClass: "Frontier", title: "GPU Monte Carlo", description: "Parallel simulation and payoff evaluation on graphics processors.", intuition: "Independent paths are naturally parallel, provided memory movement and branching are controlled.", mathematics: "V\\approx e^{-rT}N^{-1}\\sum_{i=1}^N g(X_T^{(i)})", marketUse: "Industry-standard acceleration in suitable large simulation workloads.", difficulty: "front-office", type: "method", relatedTopics: ["AAD", "Machine Learning Surrogates"] },
];

const expandedTopics: Record<Exclude<AssetClass, "Frontier">, string[]> = {
  Foundations: ["Conditional Expectation", "Martingales", "Change of Measure", "Itô Calculus", "Monte Carlo", "Variance Reduction", "Finite Differences", "PDE Methods", "Calibration Basics", "Interpolation Basics", "Numerical Stability"],
  EQ: ["Call-Put Parity", "Dividend Carry", "Historical Volatility", "Realized Volatility", "Term Structure", "Local Volatility", "Stochastic Volatility", "Heston", "SABR", "Gamma Scalping", "Variance Swaps", "Barrier Options", "Digital Options", "American Options", "Early Exercise", "Volatility Arbitrage"],
  FX: ["Forward Points", "ATM Conventions", "Premium-Adjusted Delta", "Smile Construction", "FX Digitals", "FX Barriers", "Dual-Currency Notes", "Quanto Effects", "Triangular Arbitrage", "Cross-Currency Basis"],
  IR: ["Day Count Conventions", "Compounding Conventions", "Multi-Curve Framework", "DV01", "Key-Rate Duration", "Carry and Rolldown", "Caps", "Floors", "Swaptions", "Short-Rate Models", "Hull-White", "LMM", "Convexity Adjustments", "Negative Rates"],
  COMM: ["Storage Costs", "Seasonality", "Roll Yield", "Calendar Spreads", "Commodity Swaps", "Commodity Options", "Mean Reversion", "Spread Options", "Swing Options", "Weather Derivatives", "Crack Spreads", "Spark Spreads", "Real Options"],
};

const topicDescriptions: Record<string, string> = {
  "Conditional Expectation": "Update expected values using the information currently available.", Martingales: "Processes whose conditional future value equals their current value.", "Change of Measure": "Reweight probabilities to move between pricing numeraires.", "Itô Calculus": "Differential calculus for stochastic processes with quadratic variation.", "Monte Carlo": "Estimate prices and risk by simulating many model paths.", "Variance Reduction": "Improve simulation precision without merely adding paths.", "Finite Differences": "Approximate derivatives and solve pricing PDEs on a grid.", "PDE Methods": "Translate no-arbitrage dynamics into boundary-value problems.", "Calibration Basics": "Choose parameters that reconcile a model with observed instruments.", "Interpolation Basics": "Estimate values between liquid market pillars without inventing arbitrage.", "Numerical Stability": "Keep computed outputs reliable under finite precision and difficult inputs.",
  "Call-Put Parity": "Connect European calls, puts, forwards and discounting by no-arbitrage.", "Dividend Carry": "Separate funding and distributions in equity forward value.", "Historical Volatility": "Estimate dispersion from a time series of past returns.", "Realized Volatility": "Measure variance accumulated over an observed period.", "Term Structure": "Track implied volatility across option maturities.", "Local Volatility": "Infer state-dependent instantaneous variance from a vanilla surface.", "Stochastic Volatility": "Model volatility itself as a random process.", Heston: "Model variance as a mean-reverting square-root diffusion.", SABR: "Model forward and volatility jointly for smile dynamics.", "Gamma Scalping": "Monetise convexity through repeated delta rebalancing.", "Variance Swaps": "Trade future realised variance against a fixed strike.", "Barrier Options": "Activate or extinguish payoff when an underlying crosses a level.", "Digital Options": "Pay a fixed amount when a terminal condition is met.", "American Options": "Allow exercise before expiry and introduce an optimal stopping problem.", "Early Exercise": "Compare continuation value with immediate exercise value.", "Volatility Arbitrage": "Express relative-value views across implied and realised volatility.",
  "Forward Points": "Quote the forward-minus-spot adjustment implied by two currencies.", "ATM Conventions": "Define where at-the-money sits under pair-specific FX rules.", "Premium-Adjusted Delta": "Account for option premium in the hedge-ratio convention.", "Smile Construction": "Turn market quote coordinates into a strike-volatility curve.", "FX Digitals": "Price fixed cashflows conditional on an exchange-rate event.", "FX Barriers": "Add path-dependent trigger levels to FX option payoffs.", "Dual-Currency Notes": "Combine fixed-income cashflows with embedded FX optionality.", "Quanto Effects": "Value an asset payoff translated at a fixed exchange rate.", "Triangular Arbitrage": "Enforce consistency across three quoted currency pairs.", "Cross-Currency Basis": "Measure funding dislocations not explained by covered interest parity.",
  "Day Count Conventions": "Convert calendar dates into contractual accrual fractions.", "Compounding Conventions": "Translate rates consistently across simple, periodic and continuous forms.", "Multi-Curve Framework": "Separate discounting from tenor-specific projection curves.", DV01: "Measure value change for a one-basis-point rate shift.", "Key-Rate Duration": "Allocate curve sensitivity to selected maturity nodes.", "Carry and Rolldown": "Decompose expected horizon P&L with an unchanged curve.", Caps: "Limit floating-rate payments through a strip of caplets.", Floors: "Protect minimum floating-rate receipts through floorlets.", Swaptions: "Grant the right to enter an interest-rate swap.", "Short-Rate Models": "Model the instantaneous funding rate to generate a term structure.", "Hull-White": "Use a mean-reverting Gaussian short rate fitted to today’s curve.", LMM: "Model a family of market forward rates under linked measures.", "Convexity Adjustments": "Correct linear forward intuition when payoff and discounting are nonlinear.", "Negative Rates": "Handle rate distributions and quotation when strikes can cross zero.",
  "Storage Costs": "Embed physical warehousing, insurance and financing in commodity carry.", Seasonality: "Model recurring calendar patterns in supply, demand and forward prices.", "Roll Yield": "Measure the return from moving exposure along a forward curve.", "Calendar Spreads": "Trade relative value between delivery months.", "Commodity Swaps": "Exchange floating commodity prices for fixed contractual levels.", "Commodity Options": "Attach optionality to forwards, futures or physical indices.", "Mean Reversion": "Model commodity prices returning toward an equilibrium level.", "Spread Options": "Option the difference between related prices.", "Swing Options": "Optimise repeated exercise volumes under operational constraints.", "Weather Derivatives": "Link payoffs to temperature or other weather indices.", "Crack Spreads": "Track refinery margin between crude and products.", "Spark Spreads": "Track power-generation margin between electricity and fuel.", "Real Options": "Value operational flexibility using option-pricing logic.",
};

const topicMathematics: Record<string, string> = {
  "Conditional Expectation": "\\mathbb{E}[X\\mid\\mathcal{G}]\\;\\text{ is }\\mathcal{G}\\text{-measurable and }\\;\\mathbb{E}[\\mathbf{1}_A\\mathbb{E}[X\\mid\\mathcal{G}]]=\\mathbb{E}[\\mathbf{1}_A X]",
  Martingales: "\\mathbb{E}[M_t\\mid\\mathcal{F}_s]=M_s,\\qquad 0\\le s\\le t",
  "Change of Measure": "\\mathbb{E}^{\\mathbb{Q}}[X]=\\mathbb{E}^{\\mathbb{P}}[Z_T X],\\qquad Z_T=\\frac{d\\mathbb{Q}}{d\\mathbb{P}}\\bigg|_{\\mathcal{F}_T}",
  "Itô Calculus": "df(t,X_t)=\\left(\\partial_t f+\\mu\\partial_x f+\\tfrac12\\sigma^2\\partial_{xx}f\\right)dt+\\sigma\\partial_x f\\,dW_t",
  "Monte Carlo": "\\widehat V_0=e^{-rT}\\frac{1}{N}\\sum_{i=1}^{N}g(X_T^{(i)}),\\qquad \\operatorname{SE}(\\widehat V_0)=O(N^{-1/2})",
  "Variance Reduction": "\\widehat\\mu_{cv}=\\overline X-\\beta(\\overline Y-\\mathbb{E}[Y]),\\qquad \\beta^*=\\frac{\\operatorname{Cov}(X,Y)}{\\operatorname{Var}(Y)}",
  "Finite Differences": "\\partial_{SS}V(S_i,t)\\approx\\frac{V_{i+1}-2V_i+V_{i-1}}{(\\Delta S)^2}",
  "PDE Methods": "\\partial_tV+(r-q)S\\partial_SV+\\tfrac12\\sigma^2S^2\\partial_{SS}V-rV=0",
  "Calibration Basics": "\\theta^*=\\arg\\min_{\\theta\\in\\Theta}\\sum_{i=1}^{m}w_i\\left(V_i^{model}(\\theta)-V_i^{market}\\right)^2",
  "Interpolation Basics": "y(T)=(1-\\lambda)y(T_i)+\\lambda y(T_{i+1}),\\qquad \\lambda=\\frac{T-T_i}{T_{i+1}-T_i}",
  "Numerical Stability": "\\kappa(A)=\\lVert A\\rVert\\,\\lVert A^{-1}\\rVert,\\qquad \\frac{\\lVert\\delta x\\rVert}{\\lVert x\\rVert}\\lesssim\\kappa(A)\\frac{\\lVert\\delta b\\rVert}{\\lVert b\\rVert}",
  "Call-Put Parity": "C_0-P_0=S_0e^{-qT}-Ke^{-rT}",
  "Dividend Carry": "F_{0,T}=S_0e^{(r-q)T}",
  "Historical Volatility": "\\widehat\\sigma_{hist}=\\sqrt{A\\,\\frac{1}{n-1}\\sum_{i=1}^{n}(r_i-\\overline r)^2}",
  "Realized Volatility": "\\sigma_{real}=\\sqrt{A\\sum_{i=1}^{n}r_i^2/n}",
  "Term Structure": "T\\longmapsto\\sigma_{imp}(K,T)",
  "Local Volatility": "\\sigma_{loc}^2(K,T)=\\frac{\\partial_TC+(r-q)K\\partial_KC+qC}{\\tfrac12K^2\\partial_{KK}C}",
  "Stochastic Volatility": "dS_t=(r-q)S_tdt+\\sqrt{v_t}S_t\\,dW_t^S,\\qquad dv_t=a(v_t)dt+b(v_t)dW_t^v",
  Heston: "dv_t=\\kappa(\\theta-v_t)dt+\\xi\\sqrt{v_t}\\,dW_t^v,\\qquad d\\langle W^S,W^v\\rangle_t=\\rho\\,dt",
  SABR: "dF_t=\\alpha_tF_t^{\\beta}dW_t^F,\\qquad d\\alpha_t=\\nu\\alpha_t dW_t^{\\alpha},\\qquad d\\langle W^F,W^{\\alpha}\\rangle_t=\\rho\\,dt",
  "Gamma Scalping": "d\\Pi\\approx\\tfrac12\\Gamma S^2(\\sigma_{real}^2-\\sigma_{imp}^2)dt-\\text{costs}",
  "Variance Swaps": "K_{var}^2=\\frac{2e^{rT}}{T}\\left(\\int_0^{F_0}\\frac{P(K)}{K^2}dK+\\int_{F_0}^{\\infty}\\frac{C(K)}{K^2}dK\\right)",
  "Barrier Options": "X_T=(S_T-K)^+\\mathbf{1}_{\\{\\max_{0\\le t\\le T}S_t<H\\}}",
  "Digital Options": "X_T=Q\\,\\mathbf{1}_{\\{S_T>K\\}},\\qquad V_0=Qe^{-rT}N(d_2)",
  "American Options": "V_t=\\operatorname*{ess\\,sup}_{\\tau\\in[t,T]}\\mathbb{E}^{\\mathbb{Q}}[e^{-r(\\tau-t)}g(S_\\tau)\\mid\\mathcal{F}_t]",
  "Early Exercise": "V(t,S)=\\max\\{g(S),\\,C(t,S)\\}",
  "Volatility Arbitrage": "\\operatorname{PnL}_{hedged}\\approx\\tfrac12\\int_0^T\\Gamma_tS_t^2(\\sigma_{real,t}^2-\\sigma_{imp,t}^2)dt-\\text{costs}",
  "Forward Points": "\\operatorname{points}_{0,T}=F_{0,T}-S_0=S_0\\left(e^{(r_d-r_f)T}-1\\right)",
  "ATM Conventions": "K_{ATM}\\in\\left\\{F_{0,T},\\;S_0e^{(r_d-r_f)T+\\frac12\\sigma^2T},\\;K_{\\Delta call+\\Delta put=0}\\right\\}",
  "Premium-Adjusted Delta": "\\Delta_{pa,call}=\\Delta_{spot}-\\frac{C}{S_0}=\\frac{K}{S_0}e^{-r_dT}N(d_2)",
  "Smile Construction": "\\{\\sigma_{ATM},RR_{\\Delta},BF_{\\Delta}\\}\\longrightarrow\\{K_i,\\sigma_i\\}\\longrightarrow\\sigma(K,T)",
  "FX Digitals": "V_0^{dom}=Q_de^{-r_dT}N(d_2)",
  "FX Barriers": "X_T=g(S_T)\\mathbf{1}_{\\{\\tau_H>T\\}},\\qquad \\tau_H=\\inf\\{t:S_t=H\\}",
  "Dual-Currency Notes": "X_T=N_d\\mathbf{1}_{\\{S_T\\ge K\\}}+N_fS_T\\mathbf{1}_{\\{S_T<K\\}}",
  "Quanto Effects": "\\mu_{quanto}=\\mu-\\rho_{S,X}\\sigma_S\\sigma_X",
  "Triangular Arbitrage": "S_{A/C}=S_{A/B}S_{B/C}",
  "Cross-Currency Basis": "F_{0,T}=S_0\\frac{P_f(0,T)}{P_d(0,T)}e^{b_{xccy}T}",
  "Day Count Conventions": "\\alpha(t_1,t_2)=\\frac{\\operatorname{dayCount}(t_1,t_2)}{\\operatorname{basis}}",
  "Compounding Conventions": "1+R_sT=\\left(1+\\frac{R_m}{m}\\right)^{mT}=e^{R_cT}",
  "Multi-Curve Framework": "F_x(T_{i-1},T_i)=\\frac{1}{\\delta_i}\\left(\\frac{P_x(0,T_{i-1})}{P_x(0,T_i)}-1\\right),\\qquad PV\\text{ discounted with }P_d",
  DV01: "DV01=V(y-10^{-4})-V(y)",
  "Key-Rate Duration": "KRD_j=-\\frac{1}{V}\\frac{\\partial V}{\\partial y_j}",
  "Carry and Rolldown": "\\operatorname{PnL}_{h}\\approx\\operatorname{carry}_{h}+\\operatorname{rolldown}_{h}+\\sum_j DV01_j\\,\\Delta y_j",
  Caps: "V_{cap}=\\sum_iN\\delta_iP(0,T_i)\\operatorname{Black76}(F_i,K,\\sigma_i,T_{i-1})",
  Floors: "V_{floor}=\\sum_iN\\delta_iP(0,T_i)\\operatorname{Black76Put}(F_i,K,\\sigma_i,T_{i-1})",
  Swaptions: "V_0=A(0)\\left[F_SN(d_1)-KN(d_2)\\right]",
  "Short-Rate Models": "dr_t=\\mu(t,r_t)dt+\\sigma(t,r_t)dW_t,\\qquad P(t,T)=\\mathbb{E}^{\\mathbb{Q}}[e^{-\\int_t^Tr_sds}\\mid\\mathcal{F}_t]",
  "Hull-White": "dr_t=[\\theta(t)-ar_t]dt+\\sigma dW_t",
  LMM: "dL_i(t)=\\mu_i^{\\mathbb{Q}}(t)dt+L_i(t)\\sigma_i(t)dW_t^{\\mathbb{Q}}",
  "Convexity Adjustments": "\\mathbb{E}[f(X)]\\approx f(\\mathbb{E}[X])+\\tfrac12f''(\\mathbb{E}[X])\\operatorname{Var}(X)",
  "Negative Rates": "F_t+s>0,\\qquad dF_t=\\sigma(F_t+s)dW_t",
  "Storage Costs": "F_{0,T}=S_0e^{(r+u-y)T}",
  Seasonality: "\\log F(0,T)=m(T)+\\sum_{k=1}^{K}\\left[a_k\\cos(2\\pi kT)+b_k\\sin(2\\pi kT)\\right]",
  "Roll Yield": "\\operatorname{roll}_{t\\to t+h}\\approx F(t,T-h)-F(t,T)",
  "Calendar Spreads": "X_T=F(T,T_2)-F(T,T_1)",
  "Commodity Swaps": "PV=N\\sum_i\\delta_iP(0,T_i)\\left(F(0,T_i)-K\\right)",
  "Commodity Options": "C_0=P(0,T)\\left[F_0N(d_1)-KN(d_2)\\right]",
  "Mean Reversion": "dX_t=\\kappa(\\theta-X_t)dt+\\sigma dW_t",
  "Spread Options": "X_T=(S_T^{(1)}-\\lambda S_T^{(2)}-K)^+",
  "Swing Options": "V_0=\\sup_{q_i\\in\\mathcal{A}}\\mathbb{E}^{\\mathbb{Q}}\\left[\\sum_iP(0,T_i)q_i(S_{T_i}-K)\\right]",
  "Weather Derivatives": "\\operatorname{HDD}=\\sum_d(T_{base}-T_d)^+,\\qquad X_T=N(\\operatorname{HDD}-K)^+",
  "Crack Spreads": "\\operatorname{crack}=\\sum_jw_jP_j-\\lambda P_{crude}",
  "Spark Spreads": "\\operatorname{spark}=P_{power}-hP_{fuel}-eP_{carbon}",
  "Real Options": "V(t,x)=\\sup_{u\\in\\mathcal{A}}\\mathbb{E}^{\\mathbb{Q}}\\left[\\int_t^Te^{-r(s-t)}\\pi(X_s,u_s)ds+e^{-r(T-t)}G(X_T)\\right]",
};

const modelTopics = new Set(["Local Volatility", "Stochastic Volatility", "Heston", "SABR", "Short-Rate Models", "Hull-White", "LMM", "Mean Reversion"]);
const instrumentTopics = new Set(["Variance Swaps", "Barrier Options", "Digital Options", "American Options", "FX Digitals", "FX Barriers", "Dual-Currency Notes", "Caps", "Floors", "Swaptions", "Calendar Spreads", "Commodity Swaps", "Commodity Options", "Spread Options", "Swing Options", "Weather Derivatives", "Real Options"]);
const methodTopics = new Set(["Monte Carlo", "Variance Reduction", "Finite Differences", "PDE Methods", "Calibration Basics", "Interpolation Basics", "Numerical Stability", "Smile Construction", "Gamma Scalping"]);

function expandedType(title: string): ContentType {
  if (modelTopics.has(title)) return "model";
  if (instrumentTopics.has(title)) return "instrument";
  if (methodTopics.has(title)) return "method";
  return "concept";
}

function expandedIntuition(title: string, type: ContentType): string {
  const description = topicDescriptions[title];
  if (type === "instrument") return `Start from the payoff, fixing schedule and settlement currency. ${description} The valuation method comes after the contractual exposure is unambiguous.`;
  if (type === "model") return `Separate state variables, dynamics and valuation measure before looking at a calibration. ${description} A fitted surface is evidence about today's prices, not proof of tomorrow's dynamics.`;
  if (type === "method") return `Treat the method as an approximation with a measurable error budget. ${description} Inputs, convergence checks and failure conditions belong beside the output.`;
  return `${description} Fix the information set, units and market convention before using the relationship in pricing or risk.`;
}

function expandedMarketUse(title: string, assetClass: Exclude<AssetClass, "Frontier">, type: ContentType): string {
  if (type === "instrument") return `${title} enters ${assetClass} valuation through its contractual cash flows, quotation and lifecycle. Scenario analysis should separate market moves from convention or settlement changes.`;
  if (type === "model") return `${title} is used to translate liquid ${assetClass} calibration instruments into prices and sensitivities. Residuals, parameter stability and hedge behaviour must be reviewed together.`;
  if (type === "method") return `${title} supports ${assetClass} pricing or risk when the numerical target, tolerance and benchmark are explicit. Production use requires convergence evidence and reproducible inputs.`;
  return `${title} connects an observable ${assetClass} quantity to valuation, scenario analysis or hedge interpretation. The desk view depends on units, timestamp and quotation convention.`;
}

const expandedSeeds: Seed[] = Object.entries(expandedTopics).flatMap(([assetClass, titles]) => titles.map((title) => ({
  assetClass: assetClass as Exclude<AssetClass, "Frontier">,
  title,
  description: topicDescriptions[title],
  intuition: expandedIntuition(title, expandedType(title)),
  mathematics: topicMathematics[title],
  marketUse: expandedMarketUse(title, assetClass as Exclude<AssetClass, "Frontier">, expandedType(title)),
  difficulty: title.includes("Basics") || ["Call-Put Parity", "Historical Volatility", "Forward Points", "Day Count Conventions", "Storage Costs"].includes(title) ? "foundation" : title.includes("Heston") || title.includes("SABR") || title.includes("LMM") || title.includes("Swing") ? "front-office" : "practitioner",
  type: expandedType(title),
}))) as Seed[];

export const contentCatalog = [...seeds, ...expandedSeeds].map(createEntry);

export function assetPath(assetClass: AssetClass): string {
  return ({ Foundations: "foundations", EQ: "equity", FX: "fx", IR: "rates", COMM: "commodities", Frontier: "frontier" } as const)[assetClass];
}

export function findContent(asset: string, slug: string): ContentEntry | undefined {
  return contentCatalog.find((entry) => assetPath(entry.assetClass) === asset && entry.slug === slug);
}

export function findByTitle(title: string): ContentEntry | undefined {
  return contentCatalog.find((entry) => entry.title === title);
}
