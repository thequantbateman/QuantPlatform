"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const [state, setStateValue] = useState<QuantBatemanState>("idle");
  const [message, setMessageValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [pose, setPose] = useState<QuantBatemanPose>("default");
  const [outfit, setOutfit] = useState<QuantBatemanOutfit>("default");
  const [renderer, setRenderer] = useState<QuantBatemanRenderer>("image");
  const [position, setPosition] = useState<QuantBatemanPosition | null>(null);
  const [pageContext, setPageContextValue] = useState<QuantBatemanPageContext>({});
  const transientTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }), [ask, close, error, isOpen, message, move, open, outfit, pageContext, pose, position, renderer, resetPosition, setPageContext, setState, state, success, toggle, warning]);

  return <QuantBatemanContext.Provider value={value}>{children}</QuantBatemanContext.Provider>;
}
