import type { AnalyticsInsight } from "./types";

export interface AnalyticsDeliveryState {
  dedupeKey: string;
  priority: AnalyticsInsight["priority"];
  deliveredAt: number;
}

const PRIORITY_RANK: Record<AnalyticsInsight["priority"], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export function nextAnalyticsDelivery(
  current: AnalyticsDeliveryState | null,
  insight: AnalyticsInsight,
  now: number,
  priorityHoldMs: number,
): { deliver: boolean; state: AnalyticsDeliveryState } {
  if (current?.dedupeKey === insight.dedupeKey) return { deliver: false, state: current };
  if (
    current &&
    now - current.deliveredAt < priorityHoldMs &&
    PRIORITY_RANK[insight.priority] < PRIORITY_RANK[current.priority]
  ) return { deliver: false, state: current };
  return {
    deliver: true,
    state: { dedupeKey: insight.dedupeKey, priority: insight.priority, deliveredAt: now },
  };
}

