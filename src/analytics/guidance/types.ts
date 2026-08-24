export type AnalyticsLabId =
  | "vanilla"
  | "black-scholes"
  | "greeks"
  | "volatility-surface"
  | "yield-curve"
  | "portfolio"
  | "strategies"
  | "market-making";

export interface LocalizedText {
  en: string;
  es: string;
}

export type AnalyticsDifficulty = "foundation" | "practitioner" | "front-office";

export interface AnalyticsScenario<TInputs extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  labId: AnalyticsLabId;
  sourceId?: string;
  name: LocalizedText;
  description: LocalizedText;
  learningObjective: LocalizedText;
  initialInputs: TInputs;
  expectedObservation: LocalizedText;
  suggestedInteractions: readonly LocalizedText[];
  explanation: LocalizedText;
  modelBoundary: LocalizedText;
  difficulty: AnalyticsDifficulty;
  academyHref?: string;
}

export type AnalyticsEventKind =
  | "scenario-loaded"
  | "parameter-edited"
  | "threshold-crossed"
  | "hedge-applied"
  | "comparison-created"
  | "invalid-state"
  | "reset";

export type AnalyticsPrimitive = number | string | boolean;

export interface AnalyticsEvent {
  labId: AnalyticsLabId;
  kind: AnalyticsEventKind;
  scenarioId?: string;
  inputs: Readonly<Record<string, AnalyticsPrimitive>>;
  metrics: Readonly<Record<string, AnalyticsPrimitive>>;
  timestamp: number;
  authoredInsight?: {
    title: LocalizedText;
    message: LocalizedText;
    contextSummary?: LocalizedText;
  };
}

export interface AnalyticsInsight {
  labId: AnalyticsLabId;
  priority: "low" | "medium" | "high";
  dedupeKey: string;
  state: "talking" | "success" | "warning";
  title: LocalizedText;
  message: LocalizedText;
  contextSummary: LocalizedText;
}

export interface AnalyticsAssistantContext {
  labId: AnalyticsLabId;
  scenarioId?: string;
  model?: string;
  inputs: Record<string, AnalyticsPrimitive>;
  metrics: Record<string, AnalyticsPrimitive>;
}

export const localizedText = (en: string, es: string): LocalizedText => ({ en, es });

