import type { QuantBatemanState } from "./quantBateman.types";

export const quantBatemanConfig = {
  positionStorageKey: "tqb-quant-bateman-position-v1",
  dragThreshold: 6,
  transitionMs: 160,
  safeMargins: { top: 92, right: 16, bottom: 18, left: 16 },
  snapToEdge: false,
  analyticsInsightDebounceMs: 420,
  analyticsPriorityHoldMs: 4_000,
  analyticsTalkingDurationMs: 5_200,
  transientDurationMs: {
    success: 3_200,
    warning: 4_000,
    easterEgg: 4_200,
  } satisfies Partial<Record<QuantBatemanState, number>>,
} as const;

export const quantBatemanStateLabels: Record<QuantBatemanState, string> = {
  idle: "Ready",
  thinking: "Thinking",
  fetching: "Checking sources",
  working: "Working",
  pricing: "Pricing",
  talking: "Explaining",
  success: "Complete",
  warning: "Attention",
  error: "Unavailable",
  easterEgg: "Business card",
};

export const quantBatemanRiveContract = {
  artboard: "QuantBateman",
  stateMachine: "QuantBatemanSM",
  inputs: ["state", "isHovering", "isDragging", "isOpen", "isTalking", "mood", "outfit"],
} as const;
