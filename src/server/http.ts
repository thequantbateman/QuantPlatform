const DEFAULT_JSON_LIMIT_BYTES = 16 * 1024;
const PRODUCTION_ORIGINS = new Set([
  "https://thequantbateman.com",
  "https://www.thequantbateman.com",
  "https://thequantbateman.quantsgpt.chatgpt.site",
  "https://thequantbateman.alexmega77.workers.dev",
]);

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export function enforceSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const requestOrigin = new URL(request.url).origin;
  const local = requestOrigin.startsWith("http://localhost") || requestOrigin.startsWith("http://127.0.0.1");
  if (origin === requestOrigin || PRODUCTION_ORIGINS.has(origin) || (local && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")))) return null;
  return Response.json({ error: "Origin is not allowed" }, { status: 403, headers: { "cache-control": "no-store" } });
}

export function enforceRateLimit(request: Request, limit = 20, windowMs = 60_000): Response | null {
  const forwarded = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${forwarded}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  bucket.count += 1;
  if (bucket.count <= limit) return null;
  return Response.json({ error: "Too many requests" }, { status: 429, headers: { "cache-control": "no-store", "retry-after": Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)).toString() } });
}

export class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413 | 415,
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}

export async function readJsonBody<T>(
  request: Request,
  maxBytes = DEFAULT_JSON_LIMIT_BYTES,
): Promise<T> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new RequestBodyError("Content-Type must be application/json", 415);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyError("Request body is too large", 413);
  }

  if (!request.body) throw new RequestBodyError("A JSON body is required", 400);

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let json = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError("Request body is too large", 413);
      }
      json += decoder.decode(value, { stream: true });
    }
    json += decoder.decode();
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError("Request body could not be read", 400);
  }

  try {
    return JSON.parse(json) as T;
  } catch {
    throw new RequestBodyError("Request body must contain valid JSON", 400);
  }
}

export function withSecurityHeaders(response: Response, requestUrl: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), geolocation=(), microphone=()");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("cross-origin-opener-policy", "same-origin");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("content-security-policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.cloudflare.com https://data-api.ecb.europa.eu https://gamma-api.polymarket.com https://clob.polymarket.com https://data-api.polymarket.com wss://ws-subscriptions-clob.polymarket.com wss://advanced-trade-ws.coinbase.com",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; "));
  if (new URL(requestUrl).protocol === "https:") {
    headers.set("strict-transport-security", "max-age=31536000");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
