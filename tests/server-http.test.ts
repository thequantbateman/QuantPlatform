import assert from "node:assert/strict";
import test from "node:test";
import { enforceSameOrigin, readJsonBody, RequestBodyError, withSecurityHeaders } from "../src/server/http";
import { reportServerError } from "../src/server/observability";

test("readJsonBody accepts bounded JSON requests", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ question: "What is gamma?" }),
  });
  assert.deepEqual(await readJsonBody(request), { question: "What is gamma?" });
});

test("readJsonBody rejects unsupported and oversized requests", async () => {
  await assert.rejects(
    readJsonBody(new Request("https://example.test/api", { method: "POST", body: "text" })),
    (error: unknown) => error instanceof RequestBodyError && error.status === 415,
  );
  await assert.rejects(
    readJsonBody(new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "x".repeat(128) }),
    }), 32),
    (error: unknown) => error instanceof RequestBodyError && error.status === 413,
  );
});

test("withSecurityHeaders preserves the response and protects HTTPS requests", async () => {
  const secured = withSecurityHeaders(Response.json({ ok: true }, { status: 201 }), "https://example.test/api");
  assert.equal(secured.status, 201);
  assert.deepEqual(await secured.json(), { ok: true });
  assert.equal(secured.headers.get("x-content-type-options"), "nosniff");
  assert.equal(secured.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(secured.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
  assert.match(secured.headers.get("content-security-policy") ?? "", /default-src 'self'/);
});

test("enforceSameOrigin blocks cross-site production writes", () => {
  const rejected = enforceSameOrigin(new Request("https://thequantbateman.com/api/assistant", { method: "POST", headers: { origin: "https://attacker.example" } }));
  assert.equal(rejected?.status, 403);
  assert.equal(enforceSameOrigin(new Request("https://thequantbateman.com/api/assistant", { method: "POST", headers: { origin: "https://thequantbateman.com" } })), null);
});

test("reportServerError redacts credential-shaped values", () => {
  const original = console.error;
  let written = "";
  console.error = (value?: unknown) => { written = String(value); };
  try {
    reportServerError("test", new Error("authorization: Bearer super-secret token=abc123"));
  } finally {
    console.error = original;
  }
  assert.doesNotMatch(written, /super-secret|abc123/);
  assert.match(written, /\[REDACTED\]/);
});
