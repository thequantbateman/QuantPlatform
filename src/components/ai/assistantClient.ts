export interface AssistantSource {
  label: string;
  href: string;
  status: string;
}

export interface AssistantResponse {
  answer: string;
  provider: string;
  tool: string;
  sources: AssistantSource[];
}

export async function requestAssistant(question: string, context: unknown, signal?: AbortSignal): Promise<AssistantResponse> {
  const locale = typeof context === "object" && context !== null && "locale" in context && context.locale === "es" ? "es" : "en";
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, context: JSON.stringify(context), locale }),
    signal,
  });
  const payload = await response.json() as Partial<AssistantResponse> & { error?: string };
  if (!response.ok) throw new Error(payload.error || (locale === "es" ? "El asistente no está disponible" : "Assistant unavailable"));
  return {
    answer: payload.answer || (locale === "es" ? "No se recibió una respuesta." : "No answer returned."),
    provider: payload.provider || (locale === "es" ? "Proveedor desconocido" : "Unknown provider"),
    tool: payload.tool || "navigation",
    sources: payload.sources || [],
  };
}
