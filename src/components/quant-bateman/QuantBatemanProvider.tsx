"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { nextAnalyticsDelivery, type AnalyticsDeliveryState } from "@/src/analytics/guidance/delivery";
import { serializeAnalyticsContext } from "@/src/analytics/guidance/context";
import { resolveAnalyticsInsight } from "@/src/analytics/guidance/insights";
import type { AnalyticsAssistantContext, AnalyticsEvent } from "@/src/analytics/guidance/types";
import { useI18n } from "@/src/i18n";
import { quantBatemanCoreImageSources } from "./quantBateman.assets";
import { quantBatemanConfig } from "./quantBateman.config";
import type {
  QuantBatemanContextValue,
  QuantBatemanOutfit,
  QuantBatemanPageContext,
  QuantBatemanPose,
  QuantBatemanPosition,
  QuantBatemanRenderer,
  QuantBatemanState,
} from "./quantBateman.types";

export const QuantBatemanContext = createContext<QuantBatemanContextValue | null>(null);

export function QuantBatemanProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [state, setStateValue] = useState<QuantBatemanState>("idle");
  const [message, setMessageValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [pose, setPose] = useState<QuantBatemanPose>("default");
  const [outfit, setOutfit] = useState<QuantBatemanOutfit>("default");
  const [renderer, setRenderer] = useState<QuantBatemanRenderer>("image");
  const [position, setPosition] = useState<QuantBatemanPosition | null>(null);
  const [pageContext, setPageContextValue] = useState<QuantBatemanPageContext>({});
  const transientTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyticsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyticsMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAnalyticsKey = useRef<string | null>(null);
  const analyticsDelivery = useRef<AnalyticsDeliveryState | null>(null);

  useEffect(() => {
    for (const source of quantBatemanCoreImageSources) {
      const image = new Image();
      image.decoding = "async";
      image.src = source;
    }
    try {
      const stored = localStorage.getItem(quantBatemanConfig.positionStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<QuantBatemanPosition>;
      if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) window.setTimeout(() => setPosition({ x: Number(parsed.x), y: Number(parsed.y) }), 0);
    } catch {
      try { localStorage.removeItem(quantBatemanConfig.positionStorageKey); } catch { /* Storage is optional. */ }
    }
  }, []);

  useEffect(() => () => {
    if (transientTimer.current) clearTimeout(transientTimer.current);
    if (analyticsTimer.current) clearTimeout(analyticsTimer.current);
    if (analyticsMessageTimer.current) clearTimeout(analyticsMessageTimer.current);
  }, []);

  const setState = useCallback((nextState: QuantBatemanState, nextMessage?: string) => {
    if (transientTimer.current) clearTimeout(transientTimer.current);
    setStateValue(nextState);
    if (nextMessage !== undefined) setMessageValue(nextMessage);
    const duration = quantBatemanConfig.transientDurationMs[nextState as keyof typeof quantBatemanConfig.transientDurationMs];
    if (!duration) return;
    transientTimer.current = setTimeout(() => {
      setStateValue("idle");
      setMessageValue("");
      if (nextState === "easterEgg") setPose("default");
    }, duration);
  }, []);

  const move = useCallback((nextPosition: QuantBatemanPosition) => {
    setPosition(nextPosition);
    try { localStorage.setItem(quantBatemanConfig.positionStorageKey, JSON.stringify(nextPosition)); } catch { /* Position persistence is optional. */ }
  }, []);

  const resetPosition = useCallback(() => {
    try { localStorage.removeItem(quantBatemanConfig.positionStorageKey); } catch { /* Position persistence is optional. */ }
    setPosition(null);
  }, []);

  const setPageContext = useCallback((nextContext: QuantBatemanPageContext) => {
    setPageContextValue((current) => ({ ...current, ...nextContext }));
  }, []);

  const clearAnalyticsTimers = useCallback(() => {
    if (analyticsTimer.current) clearTimeout(analyticsTimer.current);
    if (analyticsMessageTimer.current) clearTimeout(analyticsMessageTimer.current);
    analyticsTimer.current = null;
    analyticsMessageTimer.current = null;
    pendingAnalyticsKey.current = null;
  }, []);

  const setAnalyticsContext = useCallback((context: AnalyticsAssistantContext) => {
    const bounded = serializeAnalyticsContext(context);
    setPageContextValue((current) => ({ ...current, analytics: bounded }));
  }, []);

  const clearAnalyticsContext = useCallback(() => {
    clearAnalyticsTimers();
    analyticsDelivery.current = null;
    setPageContextValue((current) => ({
      ...current,
      instrument: undefined,
      action: undefined,
      analytics: undefined,
    }));
  }, [clearAnalyticsTimers]);

  const publishAnalyticsEvent = useCallback((event: AnalyticsEvent) => {
    if (event.kind === "reset") {
      clearAnalyticsTimers();
      analyticsDelivery.current = null;
      return;
    }
    const insight = resolveAnalyticsInsight(event);
    if (!insight || pendingAnalyticsKey.current === insight.dedupeKey) return;

    const deliver = () => {
      analyticsTimer.current = null;
      pendingAnalyticsKey.current = null;
      const decision = nextAnalyticsDelivery(
        analyticsDelivery.current,
        insight,
        Date.now(),
        quantBatemanConfig.analyticsPriorityHoldMs,
      );
      if (!decision.deliver) return;
      analyticsDelivery.current = decision.state;
      if (analyticsMessageTimer.current) clearTimeout(analyticsMessageTimer.current);
      setState(insight.state, insight.message[locale]);
      if (insight.state === "talking") {
        analyticsMessageTimer.current = setTimeout(() => {
          setStateValue("idle");
          setMessageValue("");
          analyticsMessageTimer.current = null;
        }, quantBatemanConfig.analyticsTalkingDurationMs);
      }
    };

    if (insight.priority === "low") {
      if (analyticsTimer.current) clearTimeout(analyticsTimer.current);
      pendingAnalyticsKey.current = insight.dedupeKey;
      analyticsTimer.current = setTimeout(deliver, quantBatemanConfig.analyticsInsightDebounceMs);
      return;
    }
    if (analyticsTimer.current) clearTimeout(analyticsTimer.current);
    analyticsTimer.current = null;
    pendingAnalyticsKey.current = null;
    deliver();
  }, [clearAnalyticsTimers, locale, setState]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);
  const success = useCallback((nextMessage = "Done.") => setState("success", nextMessage), [setState]);
  const warning = useCallback((nextMessage = "That deserves attention.") => setState("warning", nextMessage), [setState]);
  const error = useCallback((nextMessage = "The requested source is unavailable.") => setState("error", nextMessage), [setState]);
  const ask = useCallback((question?: string) => {
    if (question?.trim()) {
      window.location.assign(`/ask?topic=${encodeURIComponent(question.trim())}`);
      return;
    }
    setIsOpen(true);
  }, []);

  const value = useMemo<QuantBatemanContextValue>(() => ({
    state,
    message,
    isOpen,
    pose,
    outfit,
    renderer,
    position,
    pageContext,
    setState,
    setMessage: setMessageValue,
    success,
    warning,
    error,
    ask,
    open,
    close,
    toggle,
    move,
    resetPosition,
    setPose,
    setOutfit,
    setRenderer,
    setPageContext,
    setAnalyticsContext,
    clearAnalyticsContext,
    publishAnalyticsEvent,
  }), [ask, clearAnalyticsContext, close, error, isOpen, message, move, open, outfit, pageContext, pose, position, publishAnalyticsEvent, renderer, resetPosition, setAnalyticsContext, setPageContext, setState, state, success, toggle, warning]);

  return <QuantBatemanContext.Provider value={value}>{children}</QuantBatemanContext.Provider>;
}
