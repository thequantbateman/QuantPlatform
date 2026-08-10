"use client";

export type AvatarState = "idle" | "thinking" | "typing" | "explaining" | "speaking" | "amused" | "error";

export function Avatar({ state = "idle", compact = false }: { state?: AvatarState; compact?: boolean }) {
  return (
    <div className={`avatar avatar-${state} ${compact ? "avatar-compact" : ""}`} role="img" aria-label={`Original TheQuantBateman avatar, ${state}`}>
      <div className="avatar-aura" />
      <div className="avatar-head">
        <div className="avatar-hair" />
        <div className="avatar-brow avatar-brow-left" />
        <div className="avatar-brow avatar-brow-right" />
        <div className="avatar-eye avatar-eye-left" />
        <div className="avatar-eye avatar-eye-right" />
        <div className="avatar-nose" />
        <div className="avatar-mouth" />
      </div>
      <div className="avatar-collar left" />
      <div className="avatar-collar right" />
      <div className="avatar-jacket" />
      <div className="avatar-tie" />
      <span className="avatar-status">{state}</span>
    </div>
  );
}
