# Pre-production security audit

Reviewed: 2026-08-12

No credential values are recorded in this document.

## Findings

### SEC-01 — Repository and history secret exposure

- Severity: INFO
- Location: working tree and complete reachable Git history
- Risk: committed credentials would require immediate rotation and history remediation.
- Current status: manual pattern scan and filename/history audit found no real secret, private key or populated environment file. `.env.example` contains names and safe placeholders only.
- Remediation: keep GitHub secret scanning and push protection enabled where available.
- Resolved: YES

### SEC-02 — Assistant endpoint abuse control

- Severity: HIGH
- Location: `app/api/assistant/route.ts`, `src/server/http.ts`
- Risk: an anonymous caller could consume a private AI quota if the remote provider is enabled.
- Current status: request size was already bounded. Same-origin enforcement and a per-instance request budget now protect the endpoint. Production should also enable Cloudflare edge rate limiting for globally coordinated enforcement.
- Remediation: configure a Cloudflare WAF/rate-limit rule before switching `QUANT_ASSISTANT_PROVIDER` from `mock`.
- Resolved: YES for current mock deployment; edge rule remains required before paid AI.

### SEC-03 — Upstream error leakage

- Severity: MEDIUM
- Location: prediction API routes
- Risk: returning raw upstream exceptions can expose implementation or provider details.
- Current status: public responses now use stable generic errors; server logs pass through redaction and length limits.
- Remediation: preserve generic client messages and redacted structured logs.
- Resolved: YES

### SEC-04 — Production browser policy

- Severity: MEDIUM
- Location: `src/server/http.ts`
- Risk: absent CSP and cross-origin policy weaken XSS and framing containment.
- Current status: CSP, COOP, CORP, HSTS, `nosniff`, referrer, permissions and frame policies are attached by the Worker entry point. CSP explicitly allows the platform's current data and WebSocket providers.
- Remediation: review CSP whenever a provider, font, analytics service or embed is added.
- Resolved: YES

### SEC-05 — Development surfaces

- Severity: LOW
- Location: `/dev/quant-bateman`, `/markets/debug`, `/dev/data`
- Risk: internal diagnostics can reveal architecture or operational state.
- Current status: character and market debug tools are production-disabled unless explicitly enabled. The read-only prediction health page exposes no secrets but remains `noindex`.
- Remediation: protect `/dev/data` with access control before adding private operational details.
- Resolved: YES for current content

### SEC-06 — Dependency posture

- Severity: MEDIUM
- Location: npm and Python manifests
- Risk: vulnerable transitive packages can affect public deployment.
- Current status: `npm audit --omit=dev` reports zero production vulnerabilities. The complete audit reports two HIGH advisories in `image-size`, used by vinext only at build time to inspect repository-owned metadata images, and four MODERATE advisories in development-server versions of esbuild reached through drizzle-kit and the top-level tsx tool. The published runtime uses Cloudflare image transformation and accepts only local, allowlisted raster content types. The registry offers no patched `image-size` release; the suggested npm fix is a breaking vinext downgrade. Python audit reports no known vulnerabilities.
- Remediation: do not run untrusted metadata assets through the build, bind development servers to localhost, monitor vinext/image-size releases and upgrade when a patched compatible release exists. Do not apply `npm audit fix --force` because it proposes breaking downgrades.
- Resolved: NO upstream patch available; current exposure is non-production/build-or-development only and mitigated

### SEC-07 — Client bundle and public asset exposure

- Severity: INFO
- Location: production build, environment imports and `public/`
- Risk: confidential provider credentials in browser code or public files would be immediately exposed.
- Current status: browser modules contain no confidential environment-variable access. Provider and D1 credentials are referenced only by Worker/server modules. Public assets are approved character/brand media. Production bundle scanning is part of release validation.
- Remediation: keep secret names and values out of `NEXT_PUBLIC_*`, React props, Web Storage and static assets.
- Resolved: YES

## Reviewed controls

- Server-only provider credentials; no `NEXT_PUBLIC_*` secret path.
- JSON content type and request-size limits.
- Query and collection bounds on public APIs.
- Production debug guards.
- External links use `rel="noreferrer"`.
- KaTeX receives authored equations, not user-controlled raw HTML.
- Public assets contain only approved brand/character media.
- Quant engine CORS defaults to localhost and requires explicit production origins.
- D1 binding is server-side; no service-role credential reaches the browser.

## Production status

READY WITH NON-BLOCKING WARNINGS while the assistant remains in mock mode. The only open dependency findings affect build/development tooling and have no compatible upstream patch. Before enabling a paid AI or licensed market-data provider, add globally coordinated Cloudflare rate limiting and store credentials only as server-side encrypted secrets.
