"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { QuantBatemanBubble } from "./QuantBatemanBubble";
import { QuantBatemanCharacter } from "./QuantBatemanCharacter";
import { QuantBatemanMiniChat } from "./QuantBatemanMiniChat";
import { quantBatemanStateLabels } from "./quantBateman.config";
import { useQuantBateman } from "./useQuantBateman";
import { useQuantBatemanPosition } from "./useQuantBatemanPosition";

function sectionFromPath(pathname: string): string {
  const root = pathname.split("/").filter(Boolean)[0];
  return root ? root.replaceAll("-", " ") : "home";
}

export function QuantBatemanAssistant() {
  const qb = useQuantBateman();
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const toggle = qb.toggle;
  const close = qb.close;
  const setPageContext = qb.setPageContext;
  const activate = useCallback(() => toggle(), [toggle]);
  const { rootRef, dragging, side, style, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useQuantBatemanPosition(activate);

  useEffect(() => {
    setPageContext({ pathname, section: sectionFromPath(pathname) });
  }, [pathname, setPageContext]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [close]);

  if (pathname === "/ask") return null;

  const rendererProps = {
    state: qb.state,
    dragging,
    hovered,
    talking: qb.state === "talking",
    pose: qb.pose,
    outfit: qb.outfit,
  } as const;

  return (
    <aside
      ref={rootRef}
      className="qb-assistant"
      style={style}
      data-side={side}
      data-open={qb.isOpen ? "true" : "false"}
      data-dragging={dragging ? "true" : "false"}
      data-page={pathname === "/ask" ? "ask" : "default"}
      data-positioned={qb.position ? "true" : "false"}
      aria-label={`Quant Bateman · ${quantBatemanStateLabels[qb.state]}`}
    >
      <QuantBatemanBubble />
      {qb.isOpen && <QuantBatemanMiniChat />}
      <QuantBatemanCharacter
        {...rendererProps}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onHoverChange={setHovered}
      />
    </aside>
  );
}
