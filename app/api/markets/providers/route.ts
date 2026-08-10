import { licensingModeFromEnv, sanitizedProviderCatalog } from "@/src/market-data/router";
import { providerSourceLinks } from "@/src/market-data/providers/capabilities";

export async function GET() { return Response.json({ licensingMode: licensingModeFromEnv(process.env), providers: sanitizedProviderCatalog().map((provider) => ({ ...provider, sourceUrl: providerSourceLinks[provider.id as keyof typeof providerSourceLinks] })) }, { headers: { "cache-control": "public, max-age=300" } }); }
