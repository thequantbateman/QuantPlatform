"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { quantBatemanConfig } from "./quantBateman.config";
import type { QuantBatemanPosition } from "./quantBateman.types";
import { useQuantBateman } from "./useQuantBateman";

interface DragSnapshot {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  moved: boolean;
}

function clampPosition(position: QuantBatemanPosition, element: HTMLElement): QuantBatemanPosition {
  const { top, right, bottom, left } = quantBatemanConfig.safeMargins;
  return {
    x: Math.min(Math.max(position.x, left), Math.max(left, window.innerWidth - element.offsetWidth - right)),
    y: Math.min(Math.max(position.y, top), Math.max(top, window.innerHeight - element.offsetHeight - bottom)),
  };
}

export function useQuantBatemanPosition(onActivate: () => void): {
  rootRef: RefObject<HTMLElement | null>;
  dragging: boolean;
  side: "left" | "right";
  style: CSSProperties;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
} {
  const { position, move } = useQuantBateman();
  const rootRef = useRef<HTMLElement>(null);
  const drag = useRef<DragSnapshot | null>(null);
  const frame = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [side, setSide] = useState<"left" | "right">("right");

  const applyTransform = useCallback(() => {
    frame.current = null;
    if (!drag.current || !rootRef.current) return;
    rootRef.current.style.transform = `translate3d(${drag.current.deltaX}px, ${drag.current.deltaY}px, 0)`;
  }, []);

  useEffect(() => {
    const onResize = () => {
      const element = rootRef.current;
      if (!element || !position) return;
      const corrected = clampPosition(position, element);
      if (corrected.x !== position.x || corrected.y !== position.y) move(corrected);
      setSide(corrected.x + element.offsetWidth / 2 < window.innerWidth / 2 ? "left" : "right");
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [move, position]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    document.body.classList.remove("qb-is-dragging");
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const element = rootRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: rect.left,
      startY: rect.top,
      deltaX: 0,
      deltaY: 0,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const snapshot = drag.current;
    if (!snapshot || snapshot.pointerId !== event.pointerId) return;
    snapshot.deltaX = event.clientX - snapshot.startClientX;
    snapshot.deltaY = event.clientY - snapshot.startClientY;
    if (!snapshot.moved && Math.hypot(snapshot.deltaX, snapshot.deltaY) >= quantBatemanConfig.dragThreshold) {
      snapshot.moved = true;
      setDragging(true);
      document.body.classList.add("qb-is-dragging");
    }
    if (!snapshot.moved || frame.current !== null) return;
    frame.current = requestAnimationFrame(applyTransform);
  }, [applyTransform]);

  const finishPointer = useCallback((event: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const snapshot = drag.current;
    if (!snapshot || snapshot.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    const element = rootRef.current;
    if (snapshot.moved && element) {
      const corrected = clampPosition({ x: snapshot.startX + snapshot.deltaX, y: snapshot.startY + snapshot.deltaY }, element);
      element.style.left = `${corrected.x}px`;
      element.style.top = `${corrected.y}px`;
      element.style.right = "auto";
      element.style.bottom = "auto";
      element.style.transform = "none";
      setSide(corrected.x + element.offsetWidth / 2 < window.innerWidth / 2 ? "left" : "right");
      move(corrected);
    } else if (element) {
      element.style.transform = "none";
      if (!cancelled) onActivate();
    }
    drag.current = null;
    setDragging(false);
    document.body.classList.remove("qb-is-dragging");
  }, [move, onActivate]);

  const style: CSSProperties = position
    ? { left: position.x, top: position.y }
    : { right: quantBatemanConfig.safeMargins.right, bottom: quantBatemanConfig.safeMargins.bottom };

  return {
    rootRef,
    dragging,
    side,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp: (event) => finishPointer(event, false),
    onPointerCancel: (event) => finishPointer(event, true),
  };
}
