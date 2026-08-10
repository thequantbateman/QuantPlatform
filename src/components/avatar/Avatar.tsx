"use client";

export type AvatarState = "idle" | "thinking" | "typing" | "explaining" | "skeptical" | "amused" | "speaking" | "error";

export function Avatar({ state = "idle", compact = false, assetSrc = "/brand/tqb-avatar-v2.png" }: { state?: AvatarState; compact?: boolean; assetSrc?: string }) {
  return (
    <figure className={`avatar avatar-${state} ${compact ? "avatar-compact" : ""}`} role="img" aria-label={`Original fictional TheQuantBateman quant strategist, ${state}`}>
      <picture><source srcSet={assetSrc} type="image/png" /><img src={assetSrc} alt="Original fictional quant strategist in a dark editorial studio" /></picture>
      <span className="avatar-scan" /><span className="avatar-status"><i />{state}</span>
    </figure>
  );
}
