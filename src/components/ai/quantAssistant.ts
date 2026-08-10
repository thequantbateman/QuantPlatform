export interface QuantContext {
  currentPage: string;
  assetClass?: string;
  topic?: string;
  difficulty: "foundation" | "practitioner" | "front-office" | "research";
  lab?: Record<string, number | string>;
}

export type TutorMode = "ask" | "simpler" | "deeper" | "mathematics" | "desk";

export interface QuantAssistantRequest {
  question: string;
  mode: TutorMode;
  context: QuantContext;
}

export interface QuantAssistantProvider {
  answer(request: QuantAssistantRequest): Promise<string>;
}

const responses = {
  gamma: {
    simpler: "Gamma measures how quickly delta changes. Near expiry, an at-the-money option has very little time left to decide whether it finishes in or out of the money, so delta flips across a narrower spot range. Narrower transition means steeper slope: more gamma.",
    mathematics: "For Black–Scholes, Γ = e^(−qT) φ(d₁) / (S σ √T). Near ATM, φ(d₁) remains material while √T shrinks, so gamma grows. Away from ATM, φ(d₁) can collapse faster than the denominator.",
    desk: "Long gamma means re-hedging into moves: sell delta after rallies, buy after falls. The invoice is theta. Near expiry, execution, jumps and discrete hedging matter more precisely when the analytical gamma looks most attractive.",
    deeper: "The concentration is distributional. As terminal uncertainty shrinks, the digital-like exercise boundary becomes sharper. Gamma approximates the density-weighted curvature around strike; it does not explode uniformly across spot.",
  },
  vega: {
    simpler: "Being long vega means the option usually gains when the volatility input rises, holding other inputs fixed.",
    mathematics: "Black–Scholes vega is ν = S e^(−qT) φ(d₁) √T. It is positive for vanilla calls and puts and is often quoted per one volatility point, so the raw derivative is multiplied by 0.01.",
    desk: "A vega number is incomplete without tenor and surface location. A desk hedges buckets and smile dynamics, not one parallel volatility knob.",
    deeper: "Model vega is a local derivative under a chosen volatility coordinate. Sticky-strike, sticky-delta and recalibrated-model scenarios produce different realised P&L for the same headline vega.",
  },
  fx: {
    simpler: "FX desks quote a smile using three ideas: the centre (ATM), direction (risk reversal) and wing richness (butterfly). Together they reconstruct call and put wing volatilities.",
    mathematics: "RR_Δ = σ_call,Δ − σ_put,Δ and BF_Δ = ½(σ_call,Δ + σ_put,Δ) − σ_ATM. Strike inversion also requires spot/forward and premium-adjusted delta conventions.",
    desk: "Before comparing two FX smiles, reconcile delta, ATM, premium and settlement conventions. Otherwise the apparent relative value may be a formatting difference with excellent posture.",
    deeper: "RR and BF are quote coordinates, not a unique arbitrage-free interpolation. The construction must solve for strikes consistently and control calendar and butterfly arbitrage across the surface.",
  },
  curve: {
    simpler: "A 1bp bump raises a selected market quote by 0.01 percentage points. The bootstrap then propagates that move into discount factors, zero rates and forwards.",
    mathematics: "For continuous compounding, P(0,T)=e^(−zT), so ∂P/∂z=−T P. A 1bp zero-rate bump gives approximately ΔP≈−T P×10⁻⁴.",
    desk: "Bump the actual calibration instrument, rebuild the curve, then reprice. Bumping a displayed zero rate is not generally the same risk as bumping its market quote.",
    deeper: "Local curve risk depends on bootstrap dependency, interpolation and multi-curve architecture. A quote bump can move several forward intervals even when the displayed zero node looks isolated.",
  },
};

export class MockQuantAssistantProvider implements QuantAssistantProvider {
  async answer(request: QuantAssistantRequest): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 650));
    const text = request.question.toLowerCase();
    const topic = text.includes("gamma") ? responses.gamma : text.includes("vega") ? responses.vega : text.includes("rr") || text.includes("butterfly") || text.includes("fx smile") ? responses.fx : text.includes("curve") || text.includes("1bp") || text.includes("bump") ? responses.curve : null;
    if (!topic) return `Start by naming the state variable, convention and measure. For “${request.context.topic ?? request.question}”, separate the payoff, model dynamics, calibration inputs and hedge outputs. This demo tutor is intentionally local; a production provider can retrieve the full knowledge graph and call typed quant tools.`;
    const mode = request.mode === "ask" ? "simpler" : request.mode;
    return topic[mode];
  }
}
