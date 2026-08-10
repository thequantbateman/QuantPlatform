"use client";

import { useState } from "react";

export type BatemanAnimationState = "idle" | "working" | "thinking" | "typing" | "explaining" | "hover" | "success" | "skeptical" | "amused" | "speaking" | "error";
export type AvatarState = BatemanAnimationState;
export interface BrandCharacterAssetSet { hero: string; portrait: string; working: string; thinking: string; explaining: string; }
export const brandCharacterAssets: BrandCharacterAssetSet = { hero: "/brand/tqb-editorial-v2.png", portrait: "/brand/tqb-avatar-v2.png", working: "/brand/tqb-avatar-v2.png", thinking: "/brand/tqb-avatar-v2.png", explaining: "/brand/tqb-avatar-v2.png" };
export function characterAsset(state: BatemanAnimationState, compact: boolean) { if (!compact && state === "idle") return brandCharacterAssets.hero; if (state === "working" || state === "typing") return brandCharacterAssets.working; if (state === "thinking") return brandCharacterAssets.thinking; if (state === "explaining" || state === "success") return brandCharacterAssets.explaining; return brandCharacterAssets.portrait; }

export function TheQuantBatemanAvatar({ state = "idle", compact = false, interactive = false, context = "quant workstation", showStatus = true, assetSrc }: { state?: BatemanAnimationState; compact?: boolean; interactive?: boolean; context?: string; showStatus?: boolean; assetSrc?: string }) {
  const [hovered, setHovered] = useState(false); const shownState = interactive && hovered ? "hover" : state; const source = assetSrc ?? characterAsset(shownState, compact);
  return (
    <figure className={`avatar avatar-${shownState} ${compact ? "avatar-compact" : ""}`} role="img" aria-label={`Original fictional TheQuantBateman quant strategist, ${shownState}, ${context}`} onPointerEnter={() => interactive && setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <picture><source srcSet={source} type="image/png" /><img src={source} alt="Original fictional quant strategist in a dark editorial studio" /></picture>
      <span className="avatar-scan" />{showStatus && <span className="avatar-status"><i />{shownState}</span>}
    </figure>
  );
}

export function Avatar(props: Parameters<typeof TheQuantBatemanAvatar>[0]) { return <TheQuantBatemanAvatar {...props} />; }
