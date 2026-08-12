const DEFAULT_JSON_LIMIT_BYTES = 16 * 1024;

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
  if (new URL(requestUrl).protocol === "https:") {
    headers.set("strict-transport-security", "max-age=31536000");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
