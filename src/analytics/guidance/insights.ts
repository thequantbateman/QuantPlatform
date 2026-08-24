import { findAnalyticsScenario } from "./scenarios";
import { localizedText as t, type AnalyticsEvent, type AnalyticsInsight } from "./types";

const EVENT_PRIORITY: Record<AnalyticsEvent["kind"], AnalyticsInsight["priority"] | null> = {
  "scenario-loaded": "low",
  "parameter-edited": null,
  "threshold-crossed": "medium",
  "hedge-applied": "medium",
  "comparison-created": "medium",
  "invalid-state": "high",
  reset: null,
};

const EVENT_STATE: Record<Exclude<AnalyticsEvent["kind"], "parameter-edited" | "reset">, AnalyticsInsight["state"]> = {
  "scenario-loaded": "talking",
  "threshold-crossed": "talking",
  "hedge-applied": "success",
  "comparison-created": "success",
  "invalid-state": "warning",
};

export function resolveAnalyticsInsight(event: AnalyticsEvent): AnalyticsInsight | null {
  const priority = EVENT_PRIORITY[event.kind];
  if (!priority) return null;
  const authored = event.authoredInsight;
  const scenario = event.scenarioId ? findAnalyticsScenario(event.scenarioId) : undefined;
  const title = authored?.title ?? scenario?.name ?? t("Analytics state", "Estado analítico");
  const message = authored?.message ?? scenario?.expectedObservation ?? (
    event.kind === "invalid-state"
      ? t("That input state is outside the model boundary; the previous valid state was preserved.", "Ese estado de inputs queda fuera del límite del modelo; se conservó el estado válido anterior.")
      : t("The linked model state has been updated.", "El estado enlazado del modelo se ha actualizado.")
  );
  const contextSummary = authored?.contextSummary ?? scenario?.learningObjective ?? title;
  return {
    labId: event.labId,
    priority,
    dedupeKey: `${event.labId}:${event.kind}:${event.scenarioId ?? "current"}`,
    state: EVENT_STATE[event.kind as keyof typeof EVENT_STATE],
    title,
    message,
    contextSummary,
  };
}

