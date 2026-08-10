"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Avatar, type AvatarState } from "@/src/components/avatar/Avatar";
import { MockQuantAssistantProvider, type TutorMode } from "./quantAssistant";

type Message = { role: "user" | "assistant"; text: string; mode?: TutorMode };

const prompts = ["Why does Gamma explode near maturity?", "What does a trader mean by being long Vega?", "Why is the FX smile quoted using RR and BF?", "What happens if I bump this curve 1bp?"];

export function QuantChat() {
  const provider = useMemo(() => new MockQuantAssistantProvider(), []);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Choose a model, a convention, or an uncomfortable calibration result. I’ll start with intuition and reveal the machinery when you ask." }]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<AvatarState>("idle");
  const [mode, setMode] = useState<TutorMode>("ask");

  async function submit(question: string, requestMode = mode) {
    if (!question.trim() || state === "thinking") return;
    setMessages((current) => [...current, { role: "user", text: question, mode: requestMode }]);
    setInput(""); setState("thinking");
    try {
      const answer = await provider.answer({ question, mode: requestMode, context: { currentPage: "/ask", topic: question, difficulty: requestMode === "deeper" || requestMode === "desk" ? "front-office" : "foundation", lab: { spot: 100, strike: 100, volatility: 0.2 } } });
      setState("explaining"); setMessages((current) => [...current, { role: "assistant", text: answer, mode: requestMode }]);
      window.setTimeout(() => setState("idle"), 1000);
    } catch {
      setState("error"); setMessages((current) => [...current, { role: "assistant", text: "The local tutor failed to resolve that question. The quant engine remains available; try one of the seeded prompts." }]);
    }
  }

  function onSubmit(event: FormEvent) { event.preventDefault(); void submit(input); }
  const lastQuestion = [...messages].reverse().find((message) => message.role === "user")?.text;
  return (
    <div className="chat-layout section-shell">
      <aside className="chat-avatar-panel"><span className="eyebrow light">AI QUANT TUTOR · LOCAL DEMO</span><Avatar state={state} /><div className="avatar-state-readout"><span>AVATAR_STATE</span><strong>{state.toUpperCase()}</strong></div><blockquote>“I can explain it simply. I cannot make the convention optional.”</blockquote><div className="context-card"><span>CONTEXT PASSED TO PROVIDER</span><code>{`{ page: "/ask", level: "${mode}", lab: { S: 100, K: 100 } }`}</code></div></aside>
      <section className="chat-panel">
        <header><div><span className="eyebrow">ASK THEQUANTBATEMAN</span><h1>What are we pricing?</h1></div><span className="demo-chip">MOCK PROVIDER · NO API KEY</span></header>
        <div className="prompt-chips">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => void submit(prompt)}>{prompt}</button>)}</div>
        <div className="messages" aria-live="polite">{messages.map((message, index) => <article className={`message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "assistant" ? "TQB" : "YOU"}</span><div><p>{message.text}</p>{message.role === "assistant" && index > 0 && <small>{message.mode?.toUpperCase()} VIEW · EDUCATIONAL DEMO</small>}</div></article>)}{state === "thinking" && <article className="message assistant typing"><span>TQB</span><div><i /><i /><i /></div></article>}</div>
        {lastQuestion && <div className="depth-actions"><span>REVEAL ANOTHER LAYER</span>{(["simpler", "deeper", "mathematics", "desk"] as TutorMode[]).map((item) => <button key={item} onClick={() => { setMode(item); void submit(lastQuestion, item); }}>{item === "simpler" ? "Explain simpler" : item === "deeper" ? "Go deeper" : item === "mathematics" ? "Show mathematics" : "Desk view"}</button>)}</div>}
        <form className="chat-composer" onSubmit={onSubmit}><label htmlFor="quant-question">Ask about a model, market or lab parameter</label><div><textarea id="quant-question" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Why does this Greek change sign?" rows={2} /><button type="submit" disabled={!input.trim() || state === "thinking"}>Ask <span>↗</span></button></div><span>Demo responses are local and deterministic. No financial advice.</span></form>
      </section>
    </div>
  );
}
