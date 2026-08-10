import { resolveEvidence } from "@/src/ai/evidence";
import { createAIProvider } from "@/src/ai/providers";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { question?: string; context?: string };
    const question = body.question?.trim().slice(0, 1_500);
    if (!question) return Response.json({ error: "Question is required" }, { status: 400 });
    const evidence = await resolveEvidence(question, true); const provider = createAIProvider(process.env);
    let answer = evidence.answer; let providerName = provider.name;
    try { answer = await provider.complete({ question, context: body.context?.slice(0, 1_500) || "unknown page", evidence: evidence.answer }); } catch { providerName = "Local evidence router (remote fallback)"; }
    return Response.json({ answer, tool: evidence.tool, sources: evidence.sources, provider: providerName });
  } catch { return Response.json({ error: "Assistant request could not be processed" }, { status: 400 }); }
}
