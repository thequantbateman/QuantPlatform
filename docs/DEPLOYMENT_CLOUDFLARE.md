# Cloudflare deployment runbook

Reviewed 2026-08-12 for this repository. Production changes must be made from the canonical Git root and reviewed through GitHub before `main` becomes the automatic production branch.

## Architecture

```text
Mac / VS Code / Codex
        ↓
local Git branch
        ↓
github.com/thequantbateman/QuantPlatform
        ↓
Cloudflare Workers Builds
        ↓
vinext + Vite generated Worker and assets
        ↓
thequantbateman.<account-subdomain>.workers.dev
        ├── D1 binding: DB
        ├── official/public provider APIs
        └── local TypeScript quant engine
```

`app/`, `src/`, and `worker/index.ts` form one Cloudflare Worker application. `wrangler.jsonc` is the production configuration. The Vite plugin builds the Worker into `dist/server` and records the generated deployment config in `.wrangler/deploy/config.json`; Wrangler follows that redirect for deployment. `.openai/hosting.json` is retained for Codex preview compatibility and is not production infrastructure.

The public Worker does not require `services/quant-engine/`. Browser pricing falls back to the framework-free TypeScript implementation on every non-local hostname. The Python engine remains an optional validation/compute service for a later Cloud Run deployment.

Official references: [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/get-started/), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), and [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

## Local setup

Prerequisites: Git and Node `22.13.0` (pinned by `.node-version`). Node 23 is intentionally excluded because current lint tooling does not support odd-numbered Node releases.

```sh
git remote -v
git branch --show-current
npm ci
npm run db:migrate:local
npm run dev
```

The expected remote is `https://github.com/thequantbateman/QuantPlatform.git`. Local D1 state is under ignored `.wrangler/`. The product boots without credentials; `.env.example` documents optional local settings. Use `.env.local` for local values and never commit it.

Optional Python validation service:

```sh
npm run setup:quant
npm run dev:quant
curl http://127.0.0.1:8000/health
```

## Git workflow

```sh
git switch main
git pull --ff-only origin main
git switch -c codex/<focused-change>
# edit and validate
git add <reviewed-files>
git commit -m "<type>: <clear outcome>"
git push -u origin codex/<focused-change>
```

Open a pull request, wait for local/repository checks, review the Cloudflare preview, then merge. Do not copy files between repositories or edit production code in the Cloudflare dashboard. The normal release path is `local → branch → GitHub PR → main → Workers Build`.

## Repository quality gates

Run before every deployment:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run cloudflare:preflight
```

`cloudflare:preflight` must fail while the D1 placeholder remains. That is expected during repository-only readiness and becomes a release blocker once the remote D1 database is created.

`npm audit --omit=dev` reports no production dependency vulnerabilities as of the review date. The full development-tool audit still reports six transitive advisories: four moderate `esbuild` findings through Drizzle's legacy CLI loader and two high `image-size` findings pinned by vinext. npm offers only breaking downgrades (`drizzle-kit@0.18.1` and `vinext@0.0.45`), so do not run `npm audit fix --force`; track upstream releases and re-audit before each release.

## Cloudflare account and workers.dev

Use a Cloudflare Free account for the first deployment. Do not purchase a domain. In the dashboard, configure the account-level `workers.dev` subdomain if Cloudflare prompts for one. This account subdomain is distinct from the Worker service name, which must be `thequantbateman` to match `wrangler.jsonc`.

Authenticate from this exact Git root:

```sh
npx wrangler login
npx wrangler whoami
```

Complete OAuth in the browser. Never paste an API token into chat, a shell command, Git, or Wrangler configuration.

## Create production D1

After `wrangler whoami` identifies the intended account:

```sh
npx wrangler d1 create thequantbateman-production --location weur
```

`weur` is the initial location hint for the Europe-based deployment; select a different jurisdiction only when an explicit data-residency requirement exists. Record the returned database name and UUID. Keep the existing binding name `DB`, replace only the placeholder `database_id` in `wrangler.jsonc`, and avoid allowing Wrangler to append a duplicate binding.

The UUID is infrastructure configuration, not a credential. Confirm the binding before any remote migration:

```sh
npm run cloudflare:preflight
npx wrangler d1 info thequantbateman-production
```

## D1 migrations

Drizzle generates migrations into `drizzle/`; Wrangler records applied versions in D1. Generate schema changes with `npm run db:generate`, review the SQL, and validate locally:

```sh
npm run db:migrate:local
```

For the initial production database, inspect the pending list and then apply the checked-in migration:

```sh
npx wrangler d1 migrations list thequantbateman-production --remote
npm run db:migrate:production
npx wrangler d1 migrations list thequantbateman-production --remote
```

Remote migrations are manual release operations and are not part of automatic deployment. Never delete or recreate production D1 to repair a code deployment. Take a backup/export before a future destructive schema migration.

## Runtime variables and secrets

The first public deployment requires no secret. Safe production defaults are committed in `wrangler.jsonc`; they select the local assistant, public/demo market licensing, and conservative D1 writes.

| Variable | Purpose | Secret | Initial production |
| --- | --- | ---: | --- |
| `QUANT_ASSISTANT_PROVIDER` | Select local or Cloudflare assistant adapter | No | `mock` |
| `MARKET_DATA_DISPLAY_LICENSE` | Records whether licensed display rights are confirmed | No | `unconfirmed` |
| `MARKET_DATA_LICENSE_MODE` | Enforces provider entitlement policy | No | `PUBLIC_DEMO` |
| `ENABLE_STREAMING_MARKETS` | Allows licensed general-market streaming | No | `false` |
| `ENABLE_PROVIDER_SWITCHER` | Allows explicit provider choice | No | `false` |
| `ENABLE_HISTORICAL_MODE` | Allows historical/reference requests | No | `true` |
| `ENABLE_MARKET_SNAPSHOTS` | Allows snapshot modes | No | `true` |
| `ENABLE_MARKET_DEBUG` | Enables market debug UI/data | No | `false` |
| `ENABLE_CRYPTO_MARKETS` | Includes crypto instruments in demo/reference coverage | No | `true` |
| `ENABLE_PREDICTION_STREAM` | Enables read-only normalized Polymarket SSE | No | `true` |
| `ENABLE_PREDICTION_PERSISTENCE` | Persists bounded discovery/history/stats data | No | `true` |
| `ENABLE_PREDICTION_LIVE_PERSISTENCE` | Persists high-frequency quote/book/trade updates | No | `false` |
| `CLOUDFLARE_ACCOUNT_ID` | Optional Workers AI account selector | No | Not configured |
| `CLOUDFLARE_AI_MODEL` | Optional Workers AI model name | No | Not configured |
| `CLOUDFLARE_API_TOKEN` | Optional Workers AI API credential | Yes | Not configured |
| `TWELVE_DATA_API_KEY` | Future licensed market provider credential | Yes | Not configured |
| `FINNHUB_API_KEY` | Future provider credential; no active adapter | Yes | Not configured |
| `ALPHA_VANTAGE_API_KEY` | Future provider credential; no active adapter | Yes | Not configured |
| `QUANT_ENGINE_URL` | Future server-side quant service endpoint | No | Not configured or required |

If an optional provider is deliberately enabled, store credentials with Cloudflare Secrets, not `vars`:

```sh
npx wrangler secret put CLOUDFLARE_API_TOKEN
```

Enter the value only in Wrangler's interactive prompt. Add non-secret provider configuration to `wrangler.jsonc` in a reviewed commit. Note that `wrangler secret put` creates a new Worker version; coordinate it as a release operation. Provider keys must remain server-only and require confirmed display/redistribution rights before public activation.

## Build and first manual deployment

After D1 creation and migration:

```sh
npm run cloudflare:preflight
npm run build:cloudflare
npx wrangler deploy
```

The equivalent convenience command is `npm run deploy:cloudflare`. Use the expanded commands for the first release so each boundary is visible. Inspect `dist/server/wrangler.json`: it must show one `DB` binding, the real database UUID, `main: index.js`, and `assets.directory: ../client`. The public URL should be `https://thequantbateman.<account-subdomain>.workers.dev`; never hardcode it in application code.

## Public smoke test

Verify over the public URL, not localhost:

- `/`, `/ask`, `/learn`, `/markets`, `/markets/predictions`, `/analytics`, `/lab`, `/intelligence`, and `/research` load.
- Navigation, dark/light theme, locale, character assets, static images, and charts work without console errors.
- `GET /api/markets/status`, `GET /api/markets/snapshot`, `GET /api/predictions?limit=10`, and `GET /api/predictions/health` return structured responses.
- D1-backed discovery/history reports persistence after the migration; live high-frequency persistence remains intentionally disabled.
- `POST /api/assistant` works with JSON, rejects non-JSON and oversized bodies, and uses the local evidence router when no AI credential exists.
- Security headers include `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and HTTPS HSTS.
- Missing optional upstreams degrade to explicit demo/unavailable states. No public feature depends on the local Python engine.

Then test on an iPhone using mobile data: page loads, navigation works, markets load, primary charts render, no horizontal overflow appears, and HTTPS shows no warning.

## GitHub Workers Builds

Connect only after the manual deployment is healthy. In Cloudflare: **Workers & Pages → thequantbateman → Settings → Builds → Connect**, authorize GitHub, and select `thequantbateman/QuantPlatform`.

Use these exact settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` (repository root) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch command | `npx wrangler versions upload` |
| Node version | `.node-version` → `22.13.0` |

The Cloudflare Worker name must match `thequantbateman`. Workers Builds injects build-only credentials automatically; runtime variables continue to come from `wrangler.jsonc` and runtime secrets from the Worker. Enable non-production branch builds for PR previews. A preview upload must not promote production traffic. Remote D1 migrations remain manual.

After setup, merge a documentation-only or otherwise harmless validated change to `main` and verify the GitHub check, Cloudflare build log, and resulting deployment. No GitHub Actions workflow is required for this native integration.

## Logs and failure diagnosis

Workers observability is enabled in `wrangler.jsonc`. Use **Worker → Logs** in the dashboard or:

```sh
npx wrangler tail thequantbateman
```

Distinguish Worker exceptions, D1 errors, provider timeouts/statuses, and expected unavailable optional features. Do not log request bodies, prompts, authorization headers, secrets, raw provider credentials, or stack traces to users. The application bounds assistant bodies, provider response size, query cardinality, fetch timeouts, stream buffers, and D1 batches.

For the initial Free-plan release, live prediction persistence is disabled to avoid high-frequency D1 writes. Re-enable it only after measuring request/write volume and D1 limits. General real-time market streaming remains disabled until public display rights are confirmed. A strict Content Security Policy is deferred because the current theme bootstrap and framework runtime use inline content; add CSP only after a report-only compatibility pass.

## Rollback

Code rollback does not roll back D1 schema or data.

1. In **Worker → Deployments**, select the last known-good version and choose **Rollback**, or run `npx wrangler rollback` and select the known-good version.
2. Smoke-test the public URL and inspect logs.
3. Revert the bad Git commit on a branch, run all gates, and merge the corrective PR so GitHub and deployed history agree.

Do not roll back across an incompatible D1 migration. Use forward-compatible migrations and a forward fix when data shape changed.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Preflight rejects deployment | Replace only the zero UUID with the real D1 ID and confirm name/binding. |
| Generated config has duplicate `DB` entries | Ensure `vite.config.ts` uses only `configPath: "./wrangler.jsonc"`; rebuild from clean ignored output. |
| Worker/Build name mismatch | Dashboard service and `wrangler.jsonc` must both be `thequantbateman`. |
| D1 table missing | Run migration list, apply remote migrations, then inspect Worker logs. |
| Build uses unsupported Node | Confirm `.node-version` is present and Workers Builds root is `/`. |
| Market data appears unavailable | Confirm `PUBLIC_DEMO` policy and provider attribution; do not bypass licensing gates. |
| Polymarket live stream reconnects | Verify upstream reachability; the UI should fall back to bounded REST polling. |
| Assistant returns local evidence | Expected while `QUANT_ASSISTANT_PROVIDER=mock`; no API key is required. |
| Quant service is offline | Expected in public V1; the TypeScript engine remains authoritative for current web labs. |

## Future custom domain

Do not purchase or configure a domain in the initial release. Later, add a Cloudflare zone and attach an originless Worker Custom Domain under **Settings → Domains & Routes** or reviewed `routes` configuration. Relative same-origin application URLs already permit migration from `workers.dev` to an apex, `www`, or `api` hostname without a redesign. Plan root/`www` redirects and certificate policy explicitly.

## Future Python quant deployment

The recommended next compute tier is:

```text
Cloudflare Worker
       ↓ authenticated, versioned QuantEngine contract
Google Cloud Run
       ↓
services/quant-engine
```

The checked-in Dockerfile runs FastAPI as non-root, listens on Cloud Run's `PORT`, exposes `/health`, and uses explicit CORS origins. Do not deploy it until authentication, request budgets, service-to-service credentials, timeout/retry rules, observability, and cost caps are designed. Keep NumPy/SciPy/QuantLib, Monte Carlo, calibration, curves, volatility surfaces, rates models, hybrid models, and xVA behind the existing engine boundary so the UI never depends on the compute location.
