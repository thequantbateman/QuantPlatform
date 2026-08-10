"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Avatar, type AvatarState } from "@/src/components/avatar/Avatar";
import { MockQuantAssistantProvider, type TutorMode } from "./quantAssistant";
import { pick, useI18n } from "@/src/i18n";

type Message = { role: "user" | "assistant"; text: string; mode?: TutorMode };

const prompts = ["Why does Gamma explode near maturity?", "What does a trader mean by being long Vega?", "Why is the FX smile quoted using RR and BF?", "What happens if I bump this curve 1bp?"];

export function QuantChat() {
  const { locale } = useI18n();
  const provider = useMemo(() => new MockQuantAssistantProvider(), []);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "" }]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<AvatarState>("idle");
  const [mode, setMode] = useState<TutorMode>("ask");

  async function submit(question: string, requestMode = mode) {
    if (!question.trim() || state === "thinking") return;
    setMessages((current) => [...current, { role: "user", text: question, mode: requestMode }]);
    setInput(""); setState("thinking");
    try {
      const answer = await provider.answer({ question, mode: requestMode, context: { currentPage: "/ask", topic: question, difficulty: requestMode === "deeper" || requestMode === "desk" ? "front-office" : "foundation", lab: { spot: 100, strike: 100, volatility: 0.2 } } });
      const localized = locale === "es" ? `Respuesta del tutor local: empieza por la convención y separa precio, dinámica y cobertura. ${answer}` : answer;
      setState("explaining"); setMessages((current) => [...current, { role: "assistant", text: localized, mode: requestMode }]);
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
        <header><div><span className="eyebrow">ASK THEQUANTBATEMAN</span><h1>{pick(locale, { en: "What are we pricing?", es: "¿Qué estamos valorando?" })}</h1></div><span className="demo-chip">{pick(locale, { en: "MOCK PROVIDER · NO API KEY", es: "PROVEEDOR DEMO · SIN CLAVE API" })}</span></header>
        <div className="prompt-chips">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => void submit(prompt)}>{prompt}</button>)}</div>
        <div className="messages" aria-live="polite">{messages.map((message, index) => <article className={`message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "assistant" ? "TQB" : "YOU"}</span><div><p>{message.text || pick(locale, { en: "Choose a model, convention or calibration result. I’ll start with intuition and reveal the machinery on request.", es: "Elige un modelo, convención o resultado de calibración. Empezaré por la intuición y revelaré la maquinaria cuando la pidas." })}</p>{message.role === "assistant" && index > 0 && <small>{message.mode?.toUpperCase()} VIEW · EDUCATIONAL DEMO</small>}</div></article>)}{state === "thinking" && <article className="message assistant typing"><span>TQB</span><div><i /><i /><i /></div></article>}</div>
        {lastQuestion && <div className="depth-actions"><span>REVEAL ANOTHER LAYER</span>{(["simpler", "deeper", "mathematics", "desk"] as TutorMode[]).map((item) => <button key={item} onClick={() => { setMode(item); void submit(lastQuestion, item); }}>{item === "simpler" ? "Explain simpler" : item === "deeper" ? "Go deeper" : item === "mathematics" ? "Show mathematics" : "Desk view"}</button>)}</div>}
        <form className="chat-composer" onSubmit={onSubmit}><label htmlFor="quant-question">{pick(locale, { en: "Ask about a model, market or lab parameter", es: "Pregunta sobre un modelo, mercado o parámetro" })}</label><div><textarea id="quant-question" value={input} onChange={(event) => setInput(event.target.value)} placeholder={pick(locale, { en: "Why does this Greek change sign?", es: "¿Por qué cambia de signo esta griega?" })} rows={2} /><button type="submit" disabled={!input.trim() || state === "thinking"}>{pick(locale, { en: "Ask", es: "Preguntar" })} <span>↗</span></button></div><span>{pick(locale, { en: "Demo responses are local and deterministic. No financial advice.", es: "Las respuestas demo son locales y deterministas. No es asesoramiento financiero." })}</span></form>
      </section>
    </div>
  );
}
