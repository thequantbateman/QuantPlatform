import type { BlackScholesInput, OptionType } from "@/src/quant/models/blackScholes";
import type { CurveNode } from "@/src/quant/curves/rates";
import type { VanillaInput, VanillaMode } from "@/src/quant/pricing/vanilla";
import type { AnalyticsPrimitive, AnalyticsScenario } from "./types";

const optionTypes = new Set<OptionType>(["call", "put"]);
const vanillaModes = new Set<VanillaMode>(["equity", "fx", "forward"]);
export type GuidedGreek = "delta" | "gamma" | "vega" | "theta";
const guidedGreeks = new Set<GuidedGreek>(["delta", "gamma", "vega", "theta"]);

function finite(source: Record<string, unknown>, key: string, fallback: number): number {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionType(source: Record<string, unknown>, fallback: OptionType): OptionType {
  const value = source.optionType;
  return typeof value === "string" && optionTypes.has(value as OptionType) ? value as OptionType : fallback;
}

export function vanillaInputFromScenario(scenario: AnalyticsScenario, current: VanillaInput): VanillaInput {
  const source = scenario.initialInputs;
  const candidateMode = source.mode;
  const mode = typeof candidateMode === "string" && vanillaModes.has(candidateMode as VanillaMode) ? candidateMode as VanillaMode : current.mode;
  return {
    ...current,
    mode,
    spot: finite(source, "spot", current.spot),
    forward: finite(source, "forward", current.forward),
    strike: finite(source, "strike", current.strike),
    time: finite(source, "time", current.time),
    rate: finite(source, "domesticRate", finite(source, "rate", current.rate)),
    foreignRate: finite(source, "foreignRate", finite(source, "dividend", current.foreignRate)),
    volatility: finite(source, "volatility", current.volatility),
    type: optionType(source, current.type),
  };
}

export function blackScholesInputFromScenario(scenario: AnalyticsScenario, current: BlackScholesInput): BlackScholesInput {
  const source = scenario.initialInputs;
  return {
    spot: finite(source, "spot", current.spot),
    strike: finite(source, "strike", current.strike),
    time: finite(source, "time", current.time),
    rate: finite(source, "rate", current.rate),
    dividend: finite(source, "dividend", current.dividend),
    volatility: finite(source, "volatility", current.volatility),
    type: optionType(source, current.type),
  };
}

export function greeksStateFromScenario(
  scenario: AnalyticsScenario,
  current: BlackScholesInput,
  currentGreek: GuidedGreek,
): { input: BlackScholesInput; selectedGreek: GuidedGreek } {
  const candidate = scenario.initialInputs.selectedGreek;
  return {
    input: blackScholesInputFromScenario(scenario, current),
    selectedGreek: typeof candidate === "string" && guidedGreeks.has(candidate as GuidedGreek) ? candidate as GuidedGreek : currentGreek,
  };
}

function tenorFromMaturity(maturity: number): string {
  if (maturity < 1) return `${Math.round(maturity * 12)}M`;
  if (Number.isInteger(maturity)) return `${maturity}Y`;
  return `${Number(maturity.toFixed(2))}Y`;
}

export function curveNodesFromScenario(scenario: AnalyticsScenario): CurveNode[] {
  const candidates = Array.isArray(scenario.initialInputs.nodes) ? scenario.initialInputs.nodes : [];
  const nodes = candidates.flatMap((candidate) => {
    if (typeof candidate !== "object" || candidate === null) return [];
    const { maturity, rate } = candidate as Record<string, unknown>;
    if (typeof maturity !== "number" || !Number.isFinite(maturity) || maturity <= 0) return [];
    if (typeof rate !== "number" || !Number.isFinite(rate)) return [];
    return [{ tenor: tenorFromMaturity(maturity), time: maturity, quote: rate }];
  }).sort((left, right) => left.time - right.time);
  if (nodes.length < 2 || new Set(nodes.map(({ time }) => time)).size !== nodes.length) {
    throw new RangeError(`Scenario ${scenario.id} does not contain a valid unique curve.`);
  }
  return nodes;
}

export function optionInputContext(input: BlackScholesInput): Record<string, AnalyticsPrimitive> {
  return { spot: input.spot, strike: input.strike, time: input.time, rate: input.rate, dividend: input.dividend, volatility: input.volatility, type: input.type };
}

export function vanillaInputContext(input: VanillaInput): Record<string, AnalyticsPrimitive> {
  return { mode: input.mode, spot: input.spot, forward: input.forward, strike: input.strike, time: input.time, rate: input.rate, foreignRate: input.foreignRate, volatility: input.volatility, type: input.type, notional: input.notional };
}

export function curveInputContext(nodes: readonly CurveNode[]): Record<string, AnalyticsPrimitive> {
  const entries = nodes.slice(0, 6).map(({ tenor, quote }) => [`quote${tenor}`, quote] as const);
  return Object.fromEntries(entries);
}
