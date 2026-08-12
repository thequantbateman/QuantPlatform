const AUTHORIZATION_VALUE = /authorization\s*[:=]\s*(?:bearer\s+)?[^\s,;]+/gi;
const SENSITIVE_VALUE = /(password|secret|token|api[_-]?key)(\s*[:=]\s*|\s+)[^\s,;]+/gi;

export function reportServerError(scope: string, error: unknown): void {
  const name = error instanceof Error ? error.name : "UnknownError";
  const message = error instanceof Error ? error.message : "Unknown server error";
  console.error(JSON.stringify({
    level: "error",
    scope,
    name,
    message: message
      .replace(AUTHORIZATION_VALUE, "authorization: [REDACTED]")
      .replace(SENSITIVE_VALUE, "$1$2[REDACTED]")
      .slice(0, 500),
  }));
}
