"use client";

import { useRef, useState, type FormEvent } from "react";
import { requestAssistant, type AssistantResponse } from "@/src/components/ai/assistantClient";
import { useQuantBateman } from "./useQuantBateman";

export function QuantBatemanMiniChat() {
  const qb = useQuantBateman();
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
    qb.setState("fetching", "Checking authoritative sources...");
    try {
      const answer = await requestAssistant(asked, qb.pageContext, controller.current.signal);
      setResponse(answer);
      qb.success("Analysis ready.");
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") {
        qb.setState("idle", "");
      } else {
        qb.error(reason instanceof Error ? reason.message : "Assistant unavailable");
      }
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }

  return (
    <section className="qb-mini-chat" aria-label="Quant Bateman quick assistant">
      <header>
        <div><span>QUANT BATEMAN</span><strong>{busy ? "Checking sources" : "Quick analysis"}</strong></div>
        <button type="button" onClick={qb.close} aria-label="Close assistant">×</button>
      </header>
      <div className="qb-mini-context">
        <span>{qb.pageContext.section || "Platform context"}</span>
        <small>{qb.pageContext.instrument || qb.pageContext.pathname || "Current page"}</small>
      </div>
      {response ? <div className="qb-mini-answer"><p>{response.answer}</p><small>{response.provider} · {response.tool}</small></div> : <p className="qb-mini-intro">Ask about the current page, a model, or a displayed market input.</p>}
      <form onSubmit={submit}>
        <label htmlFor="qb-mini-question">Question</label>
        <div>
          <textarea id="qb-mini-question" rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What deserves attention?" />
          <button type="submit" disabled={!question.trim() || busy}>{busy ? "..." : "Ask"}</button>
        </div>
      </form>
      <footer>
        <a href={question.trim() ? `/ask?topic=${encodeURIComponent(question.trim())}` : "/ask"}>OPEN FULL ASK →</a>
        <span>TOOLS FIRST · NO INVENTED NUMBERS</span>
      </footer>
    </section>
  );
}
