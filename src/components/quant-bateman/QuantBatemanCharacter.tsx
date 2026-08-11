"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import type { QuantBatemanRendererProps } from "./quantBateman.types";
import { QuantBatemanImageRenderer } from "./renderers/QuantBatemanImageRenderer";
import { QUANT_BATEMAN_RIVE_AVAILABLE, QuantBatemanRiveRenderer } from "./renderers/QuantBatemanRiveRenderer";
import { useQuantBateman } from "./useQuantBateman";

interface QuantBatemanCharacterProps extends QuantBatemanRendererProps {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onHoverChange: (hovered: boolean) => void;
}

export function QuantBatemanCharacter({ onHoverChange, ...props }: QuantBatemanCharacterProps) {
  const qb = useQuantBateman();
  const Renderer = qb.renderer === "rive" && QUANT_BATEMAN_RIVE_AVAILABLE ? QuantBatemanRiveRenderer : QuantBatemanImageRenderer;
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    qb.toggle();
  };
  const handleDoubleClick = () => {
    qb.setPose("businessCard");
    qb.setState("easterEgg", "The card is blank. The model is not.");
  };

  return (
    <button
      className="qb-character-hitbox"
      type="button"
      aria-label="Quant Bateman assistant. Click to open, drag to move."
      aria-expanded={qb.isOpen}
      title="Click to ask · drag to move · double-click for a card"
      onPointerDown={props.onPointerDown}
      onPointerMove={props.onPointerMove}
      onPointerUp={props.onPointerUp}
      onPointerCancel={props.onPointerCancel}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      <Renderer {...props} />
      <span className="qb-state-indicator" aria-hidden="true" />
    </button>
  );
}
