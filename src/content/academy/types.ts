import type { AssetClass } from "@/src/content/types";

export type AcademyLevel = "foundation" | "intermediate" | "advanced" | "front-office";
export type AcademyDomain = "foundations" | "derivatives" | "volatility" | "rates" | "numerical-finance" | "risk" | "xva" | "macro" | "front-office";
export type AcademyLabId = AcademyLesson["interactiveLabs"][number]["id"];
export type AcademyFormulaDepth = 1 | 2 | 3;

export interface AcademyFormula {
  label: string;
  latex: string;
  interpretation: string;
  depth: AcademyFormulaDepth;
  analyticsHref?: string;
}

export interface AcademyDerivationStep {
  title: string;
  body: string;
  latex?: string;
  check?: string;
}

export interface AcademyDerivation {
  formulaIndex: number;
  depth: 2 | 3;
  title: string;
  introduction: string;
  steps: AcademyDerivationStep[];
  conclusion: string;
}

export interface AcademyPythonLab {
  title: string;
  objective: string;
  code: string;
  output: string[];
  checks: string[];
}

export interface AcademyReference {
  sourceId: string;
  locator: string;
  url: string;
  note: string;
}

export interface DeskSection {
  quote: string;
  inputs: string[];
  calibration: string;
  risk: string[];
  workflow: string[];
  productionIssues: string[];
}

export interface MacroConnection {
  title: string;
  thesis: string;
  nodes: Array<{ label: string; effect: string }>;
}

export interface AcademyLesson {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  domain: AcademyDomain;
  assetClass: AssetClass;
  level: AcademyLevel;
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  estimatedMinutes: number;
  lastReviewed: string;
  legacyRoutes?: string[];
  intuition: { lead: string; points: string[] };
  marketContext: { why: string; instruments: string[]; quoteConvention: string };
  mathematics: { notation: string[]; formulas: AcademyFormula[] };
  derivation: AcademyDerivation;
  pricing: { method: string; calibration: string; limitations: string[] };
  implementation: { architecture: string[]; quantLib?: string; pythonLab: AcademyPythonLab };
  interactiveLabs: Array<{
    id:
      | "realized-volatility"
      | "variance-risk-premium"
      | "implied-volatility"
      | "smile-skew"
      | "term-structure"
      | "vol-surface"
      | "local-volatility"
      | "stochastic-volatility"
      | "heston"
      | "sabr"
      | "calibration"
      | "higher-order-risk"
      | "discounting"
      | "zero-forward-rates"
      | "rate-conventions"
      | "ois-compounding"
      | "fra-futures"
      | "interest-rate-swaps"
      | "curve-bootstrapping"
      | "curve-interpolation"
      | "multi-curve"
      | "curve-risk"
      | "hull-white"
      | "rate-optionality"
      | "hjm"
      | "filtration-explorer"
      | "conditional-expectation"
      | "measure-change"
      | "girsanov"
      | "forward-measures"
      | "monte-carlo"
      | "simulation-schemes"
      | "variance-reduction"
      | "fourier-cos"
      | "first-order-greeks"
      | "higher-order-greeks"
      | "hedging-pnl"
      | "exposure-profile"
      | "xva-adjustments"
      | "var-es"
      | "model-risk";
    title: string;
    description: string;
  }>;
  frontOffice: DeskSection;
  macroConnections: MacroConnection[];
  pitfalls: string[];
  references: AcademyReference[];
  relatedLessonIds: string[];
  localized?: { es: Partial<AcademyLesson> };
}

export interface AcademyTrackNode {
  id: string;
  title: string;
  stage: string;
  level: AcademyLevel;
  href: string;
  academyLessonId?: string;
}

export interface AcademyTrack {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  nodes: AcademyTrackNode[];
  localized?: { es: Partial<AcademyTrack> };
}

export interface AcademySource {
  id: string;
  name: string;
  author: string;
  repository: string;
  license: string;
  licenseUrl: string;
  url: string;
  ref: string;
  reviewed: string;
  role: "research" | "implementation-reference" | "historical-reference";
  usePolicy: string;
}
