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
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, context: JSON.stringify(context) }),
    signal,
  });
  const payload = await response.json() as Partial<AssistantResponse> & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Assistant unavailable");
  return {
    answer: payload.answer || "No answer returned.",
    provider: payload.provider || "Unknown provider",
    tool: payload.tool || "navigation",
    sources: payload.sources || [],
  };
}
