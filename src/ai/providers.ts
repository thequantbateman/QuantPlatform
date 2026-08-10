export interface AIProviderRequest { question: string; context: string; evidence: string; }
export interface AIProvider { readonly name: string; complete(request: AIProviderRequest): Promise<string>; }

export class MockAIProvider implements AIProvider {
  readonly name = "Local evidence router";
  async complete(request: AIProviderRequest) { return request.evidence; }
}

export class CloudflareAIProvider implements AIProvider {
  readonly name = "Cloudflare Workers AI";
  constructor(private readonly accountId: string, private readonly token: string, private readonly model: string, private readonly fetcher: typeof fetch = fetch) {}
  async complete(request: AIProviderRequest): Promise<string> {
    const response = await this.fetcher(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(this.accountId)}/ai/run/${this.model}`, { method: "POST", headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: "You are a concise quantitative-finance tutor. Use only the supplied evidence for facts and numbers. Never invent market prices, probabilities or calculations. Distinguish observed data from model output." }, { role: "user", content: `Page context: ${request.context}\nQuestion: ${request.question}\nAuthoritative evidence: ${request.evidence}` }] }) });
    if (!response.ok) throw new Error(`Workers AI unavailable (${response.status})`);
    const body = await response.json() as { result?: { response?: string } };
    if (!body.result?.response) throw new Error("Workers AI returned no answer");
    return body.result.response;
  }
}

export function createAIProvider(env: Record<string, string | undefined>): AIProvider {
  if (env.QUANT_ASSISTANT_PROVIDER === "cloudflare" && env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN) return new CloudflareAIProvider(env.CLOUDFLARE_ACCOUNT_ID, env.CLOUDFLARE_API_TOKEN, env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct");
  return new MockAIProvider();
}
