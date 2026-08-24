export type QuantBatemanState =
  | "idle"
  | "thinking"
  | "fetching"
  | "working"
  | "pricing"
  | "talking"
  | "success"
  | "warning"
  | "error"
  | "easterEgg";

export type QuantBatemanPose = "default" | "businessCard";
export type QuantBatemanOutfit = "default" | "graySuit" | "camelCoat";
export type QuantBatemanRenderer = "image" | "rive";

export interface QuantBatemanPosition {
  x: number;
  y: number;
}

export interface QuantBatemanPageContext {
  pathname?: string;
  section?: string;
  instrument?: string;
  action?: string;
  analytics?: AnalyticsAssistantContext;
}

export interface QuantBatemanRendererProps {
  state: QuantBatemanState;
  dragging: boolean;
  hovered: boolean;
  talking: boolean;
  pose: QuantBatemanPose;
  outfit: QuantBatemanOutfit;
}

export interface QuantBatemanContextValue {
  state: QuantBatemanState;
  message: string;
  isOpen: boolean;
  pose: QuantBatemanPose;
  outfit: QuantBatemanOutfit;
  renderer: QuantBatemanRenderer;
  position: QuantBatemanPosition | null;
  pageContext: QuantBatemanPageContext;
  setState: (state: QuantBatemanState, message?: string) => void;
  setMessage: (message: string) => void;
  success: (message?: string) => void;
  warning: (message?: string) => void;
  error: (message?: string) => void;
  ask: (question?: string) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  move: (position: QuantBatemanPosition) => void;
  resetPosition: () => void;
  setPose: (pose: QuantBatemanPose) => void;
  setOutfit: (outfit: QuantBatemanOutfit) => void;
  setRenderer: (renderer: QuantBatemanRenderer) => void;
  setPageContext: (context: QuantBatemanPageContext) => void;
  setAnalyticsContext: (context: AnalyticsAssistantContext) => void;
  clearAnalyticsContext: () => void;
  publishAnalyticsEvent: (event: AnalyticsEvent) => void;
}
import type { AnalyticsAssistantContext, AnalyticsEvent } from "@/src/analytics/guidance/types";
