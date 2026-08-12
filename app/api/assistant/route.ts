import { resolveEvidence } from "@/src/ai/evidence";
import { createAIProvider } from "@/src/ai/providers";
import { enforceRateLimit, enforceSameOrigin, readJsonBody, RequestBodyError } from "@/src/server/http";
import type { Locale } from "@/src/i18n";

export async function POST(request: Request) {
  const rejected = enforceSameOrigin(request) ?? enforceRateLimit(request, 12, 60_000);
  if (rejected) return rejected;
  try {
    const body = await readJsonBody<{ question?: string; context?: string; locale?: Locale }>(request);
    const question = body.question?.trim().slice(0, 1_500);
    const locale: Locale = body.locale === "es" ? "es" : "en";
    if (!question) return Response.json({ error: locale === "es" ? "La pregunta es obligatoria" : "Question is required" }, { status: 400 });
    const evidence = await resolveEvidence(question, true, locale); const provider = createAIProvider(process.env);
    let answer = evidence.answer; let providerName = provider.name;
    try { answer = await provider.complete({ question, context: body.context?.slice(0, 1_500) || "unknown page", evidence: evidence.answer, locale }); } catch { providerName = locale === "es" ? "Enrutador local de evidencia (respaldo remoto)" : "Local evidence router (remote fallback)"; }
    return Response.json({ answer, tool: evidence.tool, sources: evidence.sources, provider: providerName });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Assistant request could not be processed" }, { status: 400 });
  }
}
