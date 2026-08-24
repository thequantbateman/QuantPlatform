"use client";

import { useCallback, useEffect } from "react";
import type { AnalyticsEvent, AnalyticsLabId, AnalyticsPrimitive } from "@/src/analytics/guidance/types";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";

interface GuidanceOptions {
  labId: AnalyticsLabId;
  model: string;
}

type EventInput = Omit<AnalyticsEvent, "labId" | "timestamp"> & { timestamp?: number };

export function useAnalyticsGuidance({ labId, model }: GuidanceOptions) {
  const {
    clearAnalyticsContext,
    open,
    publishAnalyticsEvent,
    setAnalyticsContext,
    setPageContext,
  } = useQuantBateman();

  useEffect(() => {
    setPageContext({ section: "analytics", action: "guided experiment" });
    setAnalyticsContext({ labId, model, inputs: {}, metrics: {} });
    return clearAnalyticsContext;
  }, [clearAnalyticsContext, labId, model, setAnalyticsContext, setPageContext]);

  const updateContext = useCallback((context: {
    scenarioId?: string;
    inputs?: Record<string, AnalyticsPrimitive>;
    metrics?: Record<string, AnalyticsPrimitive>;
  }) => {
    setAnalyticsContext({
      labId,
      model,
      ...(context.scenarioId ? { scenarioId: context.scenarioId } : {}),
      inputs: context.inputs ?? {},
      metrics: context.metrics ?? {},
    });
  }, [labId, model, setAnalyticsContext]);

  const publish = useCallback((event: EventInput) => {
    updateContext({ scenarioId: event.scenarioId, inputs: { ...event.inputs }, metrics: { ...event.metrics } });
    publishAnalyticsEvent({ ...event, labId, timestamp: event.timestamp ?? Date.now() });
  }, [labId, publishAnalyticsEvent, updateContext]);

  return {
    askAboutThis: open,
    clear: clearAnalyticsContext,
    publish,
    updateContext,
  };
}
