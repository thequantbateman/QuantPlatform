import { resolveEvidence } from "@/src/ai/evidence";
import { createAIProvider } from "@/src/ai/providers";
import { readJsonBody, RequestBodyError } from "@/src/server/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ question?: string; context?: string }>(request);
    const question = body.question?.trim().slice(0, 1_500);
    if (!question) return Response.json({ error: "Question is required" }, { status: 400 });
    const evidence = await resolveEvidence(question, true); const provider = createAIProvider(process.env);
    let answer = evidence.answer; let providerName = provider.name;
    try { answer = await provider.complete({ question, context: body.context?.slice(0, 1_500) || "unknown page", evidence: evidence.answer }); } catch { providerName = "Local evidence router (remote fallback)"; }
    return Response.json({ answer, tool: evidence.tool, sources: evidence.sources, provider: providerName });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Assistant request could not be processed" }, { status: 400 });
  }
}
