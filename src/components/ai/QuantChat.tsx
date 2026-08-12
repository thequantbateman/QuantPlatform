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
          <span className="eyebrow">{pick(locale, { en: "ASK QUANT BATEMAN · SOURCE AWARE", es: "ASK QUANT BATEMAN · CON FUENTES" })}</span>
          <h1>{pick(locale, { en: "Ask the desk.", es: "Pregunta a la mesa." })}</h1>
          <p>{pick(locale, { en: "Markets, models and risk—grounded in displayed data, reviewed concepts and deterministic tools.", es: "Mercados, modelos y riesgo, basados en datos mostrados, conceptos revisados y herramientas deterministas." })}</p>
        </div>
        <div className="ask-agent-status" aria-live="polite">
          <AskBatemanAvatar state={qb.state} variant="status" />
          <div><span>{quantBatemanStateLabels[qb.state]}</span><strong>{qb.message || pick(locale, { en: "Ready for a precise question.", es: "Listo para una pregunta precisa." })}</strong><small>{pick(locale, { en: "TOOLS → SOURCES → EXPLANATION", es: "HERRAMIENTAS → FUENTES → EXPLICACIÓN" })}</small></div>
        </div>
      </header>

      <section className="ask-conversation" aria-label={pick(locale, { en: "Conversation with Quant Bateman", es: "Conversación con Quant Bateman" })}>
        {!messages.length && !busy ? <div className="ask-empty">
          <div className="ask-empty-intro"><AskBatemanAvatar state={qb.state} variant="empty" /><div><span>QUANT BATEMAN · {pick(locale, { en: "READY", es: "LISTO" })}</span><h2>{pick(locale, { en: "Start with a precise question.", es: "Empieza con una pregunta precisa." })}</h2><p>{pick(locale, { en: "Numerical work is routed to product tools, with assumptions and source lineage kept visible.", es: "El trabajo numérico se dirige a herramientas del producto, manteniendo visibles supuestos y fuentes." })}</p></div></div>
          <div className="ask-prompt-grid">{promptGroups.map((item) => { const spanish = ({ MARKETS: ["MERCADOS", "Explica precio observado frente a precio de modelo."], PRICING: ["VALORACIÓN", "¿Qué inputs se necesitan para valorar una opción europea?"], VOL: ["VOL", "Explica la volatilidad implícita y qué no nos dice."], CURVES: ["CURVAS", "Explica cómo se propaga un bump en la curva de tipos."], RISK: ["RIESGO", "¿Por qué se concentra gamma cerca del vencimiento?"], PREDICTIONS: ["PREDICCIONES", "¿Cómo debo interpretar una probabilidad de mercado de predicción?"] } as Record<string, [string, string]>)[item.category]; const category = locale === "es" ? spanish[0] : item.category; const prompt = locale === "es" ? spanish[1] : item.prompt; return <button type="button" key={item.category} onPointerEnter={() => previewPrompt(item.state, category)} onPointerLeave={() => !busy && qb.setState("idle", "")} onFocus={() => previewPrompt(item.state, category)} onBlur={() => !busy && qb.setState("idle", "")} onClick={() => void submit(prompt)}><span>{category}</span><strong>{prompt}</strong><i>↗</i></button>; })}</div>
        </div> : <div className="ask-messages" aria-live="polite">
          {messages.map((message) => <article className={`ask-message ${message.role}`} key={message.id}>
            <div className="ask-message-identity">{message.role === "assistant" ? <AskBatemanAvatar state={message.characterState || "success"} variant="message" /> : <span>{pick(locale, { en: "YOU", es: "TÚ" })}</span>}<small>{message.role === "assistant" ? "QUANT BATEMAN" : pick(locale, { en: "QUESTION", es: "PREGUNTA" })}</small></div>
            <div className="ask-message-body">
              <MessageContent text={message.text} />
              {!!message.sources?.length && <nav className="ask-sources" aria-label="Answer sources">{message.sources.map((source) => <a href={source.href} key={`${source.href}-${source.label}`} target={source.href.startsWith("http") ? "_blank" : undefined} rel={source.href.startsWith("http") ? "noreferrer" : undefined}><span>{source.label}</span><small>{source.status}</small></a>)}</nav>}
              {message.role === "assistant" && <footer><span>{message.provider || "LOCAL EVIDENCE"} · {message.tool || "EXPLANATION"}</span><button type="button" onClick={() => void copyMessage(message)}>{copied === message.id ? pick(locale, { en: "COPIED", es: "COPIADO" }) : pick(locale, { en: "COPY", es: "COPIAR" })}</button></footer>}
            </div>
          </article>)}
          {busy && <article className="ask-message assistant is-loading"><div className="ask-message-identity"><AskBatemanAvatar state={qb.state === "pricing" ? "pricing" : "working"} variant="message" /><small>{pick(locale, { en: "WORKING", es: "ANALIZANDO" })}</small></div><div className="ask-message-body"><p>{pick(locale, { en: "Checking authoritative sources and product tools...", es: "Consultando fuentes autorizadas y herramientas del producto..." })}</p><div className="ask-thinking"><i /><i /><i /></div></div></article>}
          <div ref={endRef} />
        </div>}
      </section>

      <div className="ask-composer-wrap">
        {lastQuestion && !busy && <div className="ask-followup"><span>{pick(locale, { en: "CONTINUE", es: "CONTINUAR" })}</span><button type="button" onClick={() => void submit(lastQuestion)}>{pick(locale, { en: "RETRY LAST ANSWER", es: "REINTENTAR RESPUESTA" })}</button><button type="button" onClick={() => setInput(locale === "es" ? `Profundiza: ${lastQuestion}` : `Go deeper: ${lastQuestion}`)}>{pick(locale, { en: "GO DEEPER", es: "PROFUNDIZAR" })}</button><button type="button" onClick={() => setInput(locale === "es" ? `Muestra las matemáticas: ${lastQuestion}` : `Show the mathematics: ${lastQuestion}`)}>{pick(locale, { en: "SHOW MATHEMATICS", es: "MOSTRAR MATEMÁTICAS" })}</button></div>}
        <form className="ask-composer" onSubmit={onSubmit}>
          <label htmlFor="quant-question">{pick(locale, { en: "Ask about pricing, markets, models or risk", es: "Pregunta sobre valoración, mercados, modelos o riesgo" })}</label>
          <div>
            <textarea id="quant-question" rows={2} value={input} onFocus={() => !busy && qb.setState("thinking", "Framing the question...")} onBlur={() => !busy && qb.setState("idle", "")} onChange={(event) => { setInput(event.target.value); if (!busy && event.target.value.trim()) qb.setState("thinking", "Framing the question..."); }} onKeyDown={onComposerKeyDown} placeholder={pick(locale, { en: "Ask a precise quantitative question...", es: "Formula una pregunta cuantitativa precisa..." })} />
            {busy ? <button className="ask-cancel" type="button" onClick={cancel}>{pick(locale, { en: "CANCEL", es: "CANCELAR" })}</button> : <button type="submit" disabled={!input.trim()}>{pick(locale, { en: "ASK", es: "PREGUNTAR" })} <span>↗</span></button>}
          </div>
          <span>{pick(locale, { en: "ENTER TO SEND · SHIFT+ENTER FOR A NEW LINE · EDUCATIONAL, NOT FINANCIAL ADVICE", es: "ENTER PARA ENVIAR · SHIFT+ENTER PARA NUEVA LÍNEA · EDUCATIVO, NO ES ASESORAMIENTO FINANCIERO" })}</span>
        </form>
      </div>
    </div>
  );
}
