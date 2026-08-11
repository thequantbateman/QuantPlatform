"use client";

import { useEffect, useRef, useState } from "react";
import { QUANT_BATEMAN_RIVE_AVAILABLE } from "./renderers/QuantBatemanRiveRenderer";
import type { QuantBatemanOutfit, QuantBatemanPose, QuantBatemanState } from "./quantBateman.types";
import { useQuantBateman } from "./useQuantBateman";

const states: QuantBatemanState[] = ["idle", "thinking", "fetching", "working", "pricing", "talking", "success", "warning", "error"];
const poses: QuantBatemanPose[] = ["default", "businessCard"];
const outfits: QuantBatemanOutfit[] = ["default", "graySuit", "camelCoat"];

export function QuantBatemanLab() {
  const qb = useQuantBateman();
  const [message, setMessage] = useState("Calibrating the surface...");
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (streamTimer.current) clearInterval(streamTimer.current);
  }, []);

  function simulateStreaming() {
    if (streamTimer.current) clearInterval(streamTimer.current);
    let step = 0;
    qb.open();
    qb.setState("talking", "Streaming response · 1/3");
    streamTimer.current = setInterval(() => {
      step += 1;
      if (step >= 3) {
        if (streamTimer.current) clearInterval(streamTimer.current);
        streamTimer.current = null;
        qb.success("Stream complete.");
        return;
      }
      qb.setMessage(`Streaming response · ${step + 1}/3`);
    }, 650);
  }

  return (
    <div className="qb-lab section-shell">
      <header><span className="eyebrow">DEVELOPMENT ONLY · CHARACTER SYSTEM</span><h1>Quant Bateman Lab</h1><p>Exercise the product state machine, canonical image mapping, assistant surface and persisted viewport position.</p></header>
      <div className="qb-lab-grid">
        <section><h2>State</h2><div className="qb-lab-buttons">{states.map((state) => <button className={qb.state === state ? "active" : ""} type="button" key={state} onClick={() => qb.setState(state, message)}>{state}</button>)}</div></section>
        <section><h2>Pose</h2><div className="qb-lab-buttons">{poses.map((pose) => <button className={qb.pose === pose ? "active" : ""} type="button" key={pose} onClick={() => qb.setPose(pose)}>{pose}</button>)}</div></section>
        <section><h2>Outfit</h2><div className="qb-lab-buttons">{outfits.map((outfit) => <button className={qb.outfit === outfit ? "active" : ""} type="button" key={outfit} onClick={() => qb.setOutfit(outfit)}>{outfit}</button>)}</div></section>
        <section><h2>Interaction</h2><div className="qb-lab-buttons"><button type="button" onClick={qb.open}>open bubble</button><button type="button" onClick={qb.close}>close bubble</button><button type="button" onClick={qb.resetPosition}>reset position</button><button type="button" onClick={simulateStreaming}>simulate streaming</button><button type="button" onClick={() => qb.success("Calibrated. Naturally.")}>simulate success</button><button type="button" onClick={() => qb.error("Market data has other plans.")}>simulate error</button></div></section>
        <section><h2>Message</h2><label htmlFor="qb-lab-message">Assistant status message</label><textarea id="qb-lab-message" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} /><button type="button" onClick={() => qb.setMessage(message)}>APPLY MESSAGE</button></section>
        <section><h2>Renderer</h2><div className="qb-lab-buttons"><button className={qb.renderer === "image" ? "active" : ""} type="button" onClick={() => qb.setRenderer("image")}>Image MVP</button><button type="button" disabled={!QUANT_BATEMAN_RIVE_AVAILABLE} onClick={() => qb.setRenderer("rive")}>Rive</button></div><p>{QUANT_BATEMAN_RIVE_AVAILABLE ? "Valid Rive runtime and asset available." : "Disabled: no valid QuantBateman.riv asset exists. The renderer contract is ready for a future authored state machine."}</p></section>
      </div>
    </div>
  );
}
