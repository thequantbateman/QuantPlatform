"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { pick, useI18n } from "@/src/i18n";
import { quantBatemanStateLabels } from "@/src/components/quant-bateman/quantBateman.config";
import type { QuantBatemanState } from "@/src/components/quant-bateman/quantBateman.types";
import { QuantBatemanImageRenderer } from "@/src/components/quant-bateman/renderers/QuantBatemanImageRenderer";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";
import { requestAssistant, type AssistantSource } from "./assistantClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  provider?: string;
  tool?: string;
  sources?: AssistantSource[];
  characterState?: QuantBatemanState;
}

const promptGroups: Array<{ category: string; prompt: string; state: QuantBatemanState }> = [
  { category: "MARKETS", prompt: "Explain observed market price versus model price.", state: "working" },
  { category: "PRICING", prompt: "What inputs are required to price a European option?", state: "pricing" },
  { category: "VOL", prompt: "Explain implied volatility and what it does not tell me.", state: "thinking" },
  { category: "CURVES", prompt: "Explain how a yield-curve bump propagates.", state: "working" },
  { category: "RISK", prompt: "Why does gamma concentrate near maturity?", state: "thinking" },
  { category: "PREDICTIONS", prompt: "How should I interpret a prediction-market probability?", state: "thinking" },
];

function messageId(role: Message["role"]): string {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function MessageContent({ text }: { text: string }) {
  const blocks = text.split(/```/g);
  return <>{blocks.map((block, index) => index % 2 ? <pre key={`${index}-${block.slice(0, 12)}`}><code>{block.trim()}</code></pre> : block.split(/\n{2,}/g).filter(Boolean).map((paragraph, paragraphIndex) => <p key={`${index}-${paragraphIndex}`}>{paragraph}</p>))}</>;
}

function AskBatemanAvatar({ state, variant }: { state: QuantBatemanState; variant: "status" | "empty" | "message" }) {
  return (
    <span className={`ask-bateman-avatar ${variant}`} data-state={state} aria-hidden="true">
      <QuantBatemanImageRenderer state={state} dragging={false} hovered={false} talking={false} pose="default" outfit="default" />
    </span>
  );
}

export function QuantChat() {
  const { locale } = useI18n();
  const qb = useQuantBateman();
  const setPageContext = qb.setPageContext;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const progressTimer = useRef<number | null>(null);
  const completionTimer = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("topic");
    if (topic) window.setTimeout(() => setInput(topic), 0);
  }, []);

  useEffect(() => {
    setPageContext({ section: "ask", action: busy ? "answering" : "conversation" });
  }, [busy, setPageContext]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  useEffect(() => () => {
    controller.current?.abort();
    if (progressTimer.current) window.clearTimeout(progressTimer.current);
    if (completionTimer.current) window.clearTimeout(completionTimer.current);
  }, []);

  async function submit(question: string) {
    const asked = question.trim();
    if (!asked || busy) return;
    const userMessage: Message = { id: messageId("user"), role: "user", text: asked };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setBusy(true);
    if (progressTimer.current) window.clearTimeout(progressTimer.current);
    if (completionTimer.current) window.clearTimeout(completionTimer.current);
    controller.current = new AbortController();
    qb.setState("fetching", "Checking authoritative sources...");
    const pricingIntent = /\b(price|pricing|option|black[- ]?scholes|volatility|greek|curve)\b/i.test(asked);
    progressTimer.current = window.setTimeout(() => {
      qb.setState(pricingIntent ? "pricing" : "working", pricingIntent ? "Running deterministic pricing tools..." : "Reviewing sources and product tools...");
    }, 650);
    try {
      const answer = await requestAssistant(asked, { pathname: "/ask", locale, conversationTurns: messages.length + 1 }, controller.current.signal);
      if (progressTimer.current) window.clearTimeout(progressTimer.current);
      setMessages((current) => [...current, {
        id: messageId("assistant"),
        role: "assistant",
        text: answer.answer,
        provider: answer.provider,
        tool: answer.tool,
        sources: answer.sources,
        characterState: pricingIntent ? "pricing" : "success",
      }]);
      qb.setState("talking", "Explaining the result...");
      completionTimer.current = window.setTimeout(() => qb.success("Analysis ready."), 800);
    } catch (reason) {
      if (progressTimer.current) window.clearTimeout(progressTimer.current);
      if (reason instanceof DOMException && reason.name === "AbortError") {
        qb.setState("idle", "");
      } else {
        const error = reason instanceof Error ? reason.message : "Assistant unavailable";
        setMessages((current) => [...current, { id: messageId("assistant"), role: "assistant", text: error, tool: "error", characterState: "warning" }]);
        qb.error(error);
      }
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(input);
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit(input);
  }

  function cancel() {
    controller.current?.abort();
  }

  async function copyMessage(message: Message) {
    await navigator.clipboard.writeText(message.text);
    setCopied(message.id);
    qb.success("Answer copied.");
    window.setTimeout(() => setCopied(null), 1_500);
  }

  function previewPrompt(state: QuantBatemanState, category: string) {
    if (busy) return;
    qb.setState(state, `${category.toLowerCase()} context selected.`);
  }

  const lastQuestion = [...messages].reverse().find((message) => message.role === "user")?.text;

  return (
    <div className="ask-workspace section-shell">
      <header className="ask-header">
        <div className="ask-heading">
          <span className="eyebrow">ASK QUANT BATEMAN · SOURCE AWARE</span>
          <h1>{pick(locale, { en: "Ask the desk.", es: "Pregunta a la mesa." })}</h1>
          <p>{pick(locale, { en: "Markets, models and risk—grounded in displayed data, reviewed concepts and deterministic tools.", es: "Mercados, modelos y riesgo, basados en datos mostrados, conceptos revisados y herramientas deterministas." })}</p>
        </div>
        <div className="ask-agent-status" aria-live="polite">
          <AskBatemanAvatar state={qb.state} variant="status" />
          <div><span>{quantBatemanStateLabels[qb.state]}</span><strong>{qb.message || "Ready for a precise question."}</strong><small>TOOLS → SOURCES → EXPLANATION</small></div>
        </div>
      </header>

      <section className="ask-conversation" aria-label="Conversation with Quant Bateman">
        {!messages.length && !busy ? <div className="ask-empty">
          <div className="ask-empty-intro"><AskBatemanAvatar state={qb.state} variant="empty" /><div><span>QUANT BATEMAN · READY</span><h2>Start with a precise question.</h2><p>Numerical work is routed to product tools, with assumptions and source lineage kept visible.</p></div></div>
          <div className="ask-prompt-grid">{promptGroups.map((item) => <button type="button" key={item.category} onPointerEnter={() => previewPrompt(item.state, item.category)} onPointerLeave={() => !busy && qb.setState("idle", "")} onFocus={() => previewPrompt(item.state, item.category)} onBlur={() => !busy && qb.setState("idle", "")} onClick={() => void submit(item.prompt)}><span>{item.category}</span><strong>{item.prompt}</strong><i>↗</i></button>)}</div>
        </div> : <div className="ask-messages" aria-live="polite">
          {messages.map((message) => <article className={`ask-message ${message.role}`} key={message.id}>
            <div className="ask-message-identity">{message.role === "assistant" ? <AskBatemanAvatar state={message.characterState || "success"} variant="message" /> : <span>YOU</span>}<small>{message.role === "assistant" ? "QUANT BATEMAN" : "QUESTION"}</small></div>
            <div className="ask-message-body">
              <MessageContent text={message.text} />
              {!!message.sources?.length && <nav className="ask-sources" aria-label="Answer sources">{message.sources.map((source) => <a href={source.href} key={`${source.href}-${source.label}`} target={source.href.startsWith("http") ? "_blank" : undefined} rel={source.href.startsWith("http") ? "noreferrer" : undefined}><span>{source.label}</span><small>{source.status}</small></a>)}</nav>}
              {message.role === "assistant" && <footer><span>{message.provider || "LOCAL EVIDENCE"} · {message.tool || "EXPLANATION"}</span><button type="button" onClick={() => void copyMessage(message)}>{copied === message.id ? "COPIED" : "COPY"}</button></footer>}
            </div>
          </article>)}
          {busy && <article className="ask-message assistant is-loading"><div className="ask-message-identity"><AskBatemanAvatar state={qb.state === "pricing" ? "pricing" : "working"} variant="message" /><small>WORKING</small></div><div className="ask-message-body"><p>Checking authoritative sources and product tools...</p><div className="ask-thinking"><i /><i /><i /></div></div></article>}
          <div ref={endRef} />
        </div>}
      </section>

      <div className="ask-composer-wrap">
        {lastQuestion && !busy && <div className="ask-followup"><span>CONTINUE</span><button type="button" onClick={() => void submit(lastQuestion)}>RETRY LAST ANSWER</button><button type="button" onClick={() => setInput(`Go deeper: ${lastQuestion}`)}>GO DEEPER</button><button type="button" onClick={() => setInput(`Show the mathematics: ${lastQuestion}`)}>SHOW MATHEMATICS</button></div>}
        <form className="ask-composer" onSubmit={onSubmit}>
          <label htmlFor="quant-question">Ask about pricing, markets, models or risk</label>
          <div>
            <textarea id="quant-question" rows={2} value={input} onFocus={() => !busy && qb.setState("thinking", "Framing the question...")} onBlur={() => !busy && qb.setState("idle", "")} onChange={(event) => { setInput(event.target.value); if (!busy && event.target.value.trim()) qb.setState("thinking", "Framing the question..."); }} onKeyDown={onComposerKeyDown} placeholder={pick(locale, { en: "Ask a precise quantitative question...", es: "Formula una pregunta cuantitativa precisa..." })} />
            {busy ? <button className="ask-cancel" type="button" onClick={cancel}>CANCEL</button> : <button type="submit" disabled={!input.trim()}>ASK <span>↗</span></button>}
          </div>
          <span>ENTER TO SEND · SHIFT+ENTER FOR A NEW LINE · EDUCATIONAL, NOT FINANCIAL ADVICE</span>
        </form>
      </div>
    </div>
  );
}
