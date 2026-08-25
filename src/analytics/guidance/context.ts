import type { AnalyticsAssistantContext, AnalyticsLabId, AnalyticsPrimitive } from "./types";

const ANALYTICS_LABS = new Set<AnalyticsLabId>([
  "vanilla",
  "black-scholes",
  "greeks",
  "volatility-surface",
  "yield-curve",
  "portfolio",
  "strategies",
  "market-making",
  "fixed-income",
]);

function primitiveMap(value: unknown): Record<string, AnalyticsPrimitive> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const entries: Array<[string, AnalyticsPrimitive]> = [];
  for (const [key, candidate] of Object.entries(value)) {
    if (entries.length >= 12) break;
    if (typeof candidate === "number" && Number.isFinite(candidate)) entries.push([key, candidate]);
    if (typeof candidate === "string" && candidate.length <= 120) entries.push([key, candidate]);
    if (typeof candidate === "boolean") entries.push([key, candidate]);
  }
  return Object.fromEntries(entries);
}

export function serializeAnalyticsContext(value: unknown): AnalyticsAssistantContext {
  if (typeof value !== "object" || value === null) throw new TypeError("Analytics context must be an object.");
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.labId !== "string" || !ANALYTICS_LABS.has(candidate.labId as AnalyticsLabId)) {
    throw new RangeError("Analytics context requires a known lab identifier.");
  }
  return {
    labId: candidate.labId as AnalyticsLabId,
    ...(typeof candidate.scenarioId === "string" && candidate.scenarioId.length <= 80 ? { scenarioId: candidate.scenarioId } : {}),
    ...(typeof candidate.model === "string" && candidate.model.length <= 120 ? { model: candidate.model } : {}),
    inputs: primitiveMap(candidate.inputs),
    metrics: primitiveMap(candidate.metrics),
  };
}
