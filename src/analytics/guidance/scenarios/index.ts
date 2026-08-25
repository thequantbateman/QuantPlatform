import { coreScenarios } from "./core";
import { marketMakingScenarios } from "./marketMaking";
import { portfolioScenarios } from "./portfolio";
import { strategyScenarios } from "./strategies";
import { surfaceScenarios } from "./surface";
import { fixedIncomeScenarios } from "./fixedIncome";
import type { AnalyticsLabId, AnalyticsScenario } from "../types";

export type { AnalyticsLabId, AnalyticsScenario } from "../types";

export const analyticsScenarios: readonly AnalyticsScenario[] = [
  ...coreScenarios,
  ...surfaceScenarios,
  ...portfolioScenarios,
  ...strategyScenarios,
  ...marketMakingScenarios,
  ...fixedIncomeScenarios,
];

export function scenariosForLab(labId: AnalyticsLabId): readonly AnalyticsScenario[] {
  return analyticsScenarios.filter((scenario) => scenario.labId === labId);
}

export function findAnalyticsScenario(id: string): AnalyticsScenario | undefined {
  return analyticsScenarios.find((scenario) => scenario.id === id);
}
