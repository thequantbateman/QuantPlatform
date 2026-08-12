"use client";

import { useRef, useState, type FormEvent } from "react";
import { requestAssistant, type AssistantResponse } from "@/src/components/ai/assistantClient";
import { pick, useI18n } from "@/src/i18n";
import { useQuantBateman } from "./useQuantBateman";

export function QuantBatemanMiniChat() {
  const qb = useQuantBateman();
  const { locale } = useI18n();
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked || busy) return;
    controller.current = new AbortController();
    setBusy(true);
    setResponse(null);
    qb.setState("fetching", pick(locale, { en: "Checking authoritative sources...", es: "Consultando fuentes autorizadas..." }));
    try {
      const answer = await requestAssistant(asked, { ...qb.pageContext, locale }, controller.current.signal);
      setResponse(answer);
      qb.success(pick(locale, { en: "Analysis ready.", es: "Análisis listo." }));
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") {
        qb.setState("idle", "");
      } else {
        qb.error(reason instanceof Error ? reason.message : pick(locale, { en: "Assistant unavailable", es: "Asistente no disponible" }));
      }
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }

  return (
    <section className="qb-mini-chat" aria-label={pick(locale, { en: "Quant Bateman quick assistant", es: "Asistente rápido Quant Bateman" })}>
      <header>
        <div><span>QUANT BATEMAN</span><strong>{busy ? pick(locale, { en: "Checking sources", es: "Consultando fuentes" }) : pick(locale, { en: "Quick analysis", es: "Análisis rápido" })}</strong></div>
        <button type="button" onClick={qb.close} aria-label={pick(locale, { en: "Close assistant", es: "Cerrar asistente" })}>×</button>
      </header>
      <div className="qb-mini-context">
        <span>{qb.pageContext.section || pick(locale, { en: "Platform context", es: "Contexto de plataforma" })}</span>
        <small>{qb.pageContext.instrument || qb.pageContext.pathname || pick(locale, { en: "Current page", es: "Página actual" })}</small>
      </div>
      {response ? <div className="qb-mini-answer"><p>{response.answer}</p><small>{response.provider} · {response.tool}</small></div> : <p className="qb-mini-intro">{pick(locale, { en: "Ask about the current page, a model, or a displayed market input.", es: "Pregunta sobre la página, un modelo o un input de mercado mostrado." })}</p>}
      <form onSubmit={submit}>
        <label htmlFor="qb-mini-question">{pick(locale, { en: "Question", es: "Pregunta" })}</label>
        <div>
          <textarea id="qb-mini-question" rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={pick(locale, { en: "What deserves attention?", es: "¿Qué merece atención?" })} />
          <button type="submit" disabled={!question.trim() || busy}>{busy ? "..." : pick(locale, { en: "Ask", es: "Preguntar" })}</button>
        </div>
      </form>
      <footer>
        <a href={question.trim() ? `/ask?topic=${encodeURIComponent(question.trim())}` : "/ask"}>{pick(locale, { en: "OPEN FULL ASK", es: "ABRIR ASK COMPLETO" })} →</a>
        <span>{pick(locale, { en: "TOOLS FIRST · NO INVENTED NUMBERS", es: "HERRAMIENTAS PRIMERO · SIN CIFRAS INVENTADAS" })}</span>
      </footer>
    </section>
  );
}
