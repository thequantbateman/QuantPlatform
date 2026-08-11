"use client";

import { quantBatemanStateLabels } from "./quantBateman.config";
import { useQuantBateman } from "./useQuantBateman";

export function QuantBatemanBubble() {
  const qb = useQuantBateman();
  if (!qb.message || qb.isOpen) return null;
  return (
    <button className="qb-status-bubble" type="button" onClick={qb.open} aria-live="polite">
      <span>{quantBatemanStateLabels[qb.state]}</span>
      <strong>{qb.message}</strong>
    </button>
  );
}
