# QuantPlatform Context

> Last validated: 2026-08-25
> Validation scope: current source and release gates

This is the durable operational map for the repository. It complements mandatory rules in `AGENTS.md`; it does not replace source code, configuration, the human-facing `README.md`, or detailed documents under `docs/`.

## Project identity

**TheQuantBateman / QuantPlatform** is a bilingual interactive quantitative-finance workstation. It connects rigorous learning, transparent pricing and risk analytics, normalized market and prediction data, research, and a source-aware assistant. The audience spans students, quantitative developers, and front-office practitioners. The product direction is an interactive textbook plus auditable desk tooling: intuition, mathematics, implementation, scenarios, and market interpretation should remain connected without hiding conventions or data provenance.

## Canonical repository and workflow

- Repository: `thequantbateman/QuantPlatform`
- Public source of truth: `https://github.com/thequantbateman/QuantPlatform.git`
- Development workspace: the current local Git root; never create a parallel application copy.
- Normal development environment: VS Code + Codex on a focused `codex/<change>` branch unless the user explicitly authorizes work on another branch.
- After a focused branch is clean and all relevant gates pass, merge it into local `main` without another approval prompt. Pushes, deployments, remote migrations, and other external writes remain explicitly authorized operations.
- Release path: local Git → GitHub → Cloudflare Workers Builds → production.
- Production code and infrastructure configuration are changed through reviewed Git history, not by copying files or editing application code in a dashboard.

Before release work, verify `git remote -v`, the branch, the working tree, and recent commits. GitHub is authoritative; Cloudflare is downstream.

## Current technology stack

| Area | Current implementation |
| --- | --- |
| Web | React 19, TypeScript 5.9, vinext, Vite 8, React Server Components |
| Runtime | Cloudflare Workers with the Cloudflare Vite plugin and Wrangler |
| Data | Cloudflare D1 (SQLite), Drizzle ORM and checked-in migrations |
| Mathematics | Framework-free TypeScript under `src/quant/`; KaTeX for rendered notation |
| Visualization | Native Canvas and semantic HTML alternatives; no global heavy chart framework |
| Content | Typed Academy/catalog data plus MDX-compatible sources |
| AI | Server provider contract with deterministic local/mock evidence routing by default |
| Python | Optional FastAPI service with NumPy/SciPy; QuantLib is an optional validation dependency |
| Validation | TypeScript strict checks, ESLint, Node test runner with `tsx`, Python `unittest`, rendered Worker tests |

Dependency versions and supported Node versions are authoritative in `package.json` and `.node-version`.

## Architecture at a glance

```text
Browser
  |
  v
Cloudflare Worker — CURRENT
  |-- vinext/React routes and server rendering
  |-- same-origin APIs and security boundaries
  |-- typed content, localization and UI components
  |-- normalized market/Polymarket provider adapters
  |-- framework-free TypeScript quant calculations
  `-- D1 prediction-market persistence
          |
          +--> official/public or licensed external providers
          |
          `--> versioned QuantEngine service — PLANNED, not required today
                    |
                    `-- services/quant-engine Python container
```

Repository architecture and runtime architecture are different. The Python engine remains in this monorepo even when deployed separately. The current public Worker does not depend on it; non-local web pricing uses the TypeScript engine.

## Repository map

| Path | Responsibility |
| --- | --- |
| `app/` | Routing and metadata; route files compose domain components. |
| `src/components/` | Presentation and interactions grouped by Academy, analytics, charts, markets, assistant, and character. |
| `src/quant/` | Portable, deterministic, framework-free TypeScript pricing, curves, scenarios, and numerical helpers. |
| `src/content/` | Typed educational catalogs, Academy tracks, localization, search, and platform-map contracts. |
| `content/` | MDX-compatible authoring sources; not the runtime catalog by itself. |
| `src/market-data/` | Instrument master, normalized data contracts, provider routing, and client stores. |
| `src/polymarket/` | Prediction-market normalization, books, persistence contracts, and cross-asset links. |
| `src/data/` | Data-facing clients and compatibility/provider interfaces used by product components. |
| `src/ai/` and `src/server/` | Server-owned assistant evidence/providers and HTTP/observability boundaries. |
| `src/i18n/` | UI dictionaries and locale state; domain content localization stays with content. |
| `worker/` | Cloudflare Worker entry point and runtime bindings. |
| `db/` and `drizzle/` | D1 schema and reviewed SQL migration history. |
| `services/quant-engine/` | Optional Python analytical-validation and future heavy-compute service. |
| `tests/` | Numerical, content, accessibility-contract, server, search, market-data, and rendered-route tests. |
| `docs/` | Detailed product, architecture, research, security, deployment, design, and QA records. |

Dependency direction is routes → components → typed domain modules. Quant and provider modules must not import routes, React, browser APIs, or presentation types.

## Runtime boundaries

- **Browser:** renders UI, maintains local theme/locale and bounded interaction state, and visualizes already-typed results. It does not own secrets, licensed provider selection, or pricing formulas embedded in components.
- **Cloudflare Worker:** serves the application, enforces HTTP/security limits, runs same-origin APIs, selects server providers, normalizes data, and accesses D1.
- **TypeScript quant layer:** supplies current production-safe educational pricing and deterministic analytics. It is infrastructure-agnostic and usable in Worker or browser-compatible contexts.
- **Python quant engine:** supplies local analytical validation today and is the strategic home for advanced numerical compute. It remains optional until an authenticated remote service is deliberately deployed.
- **D1:** stores normalized prediction-market discovery/history/statistical records through server-owned repositories. It is not general browser storage or an unbounded tick archive.
- **External providers:** remain behind typed adapters, entitlement policy, timeouts, provenance, and server-side credentials. Vendor payloads do not flow directly into UI code.

## Quant architecture and invariants

`src/quant/` is lightweight, readable, deterministic TypeScript for transparent education and the current Worker runtime. `services/quant-engine/` is the advanced Python boundary for future Monte Carlo, calibration, curves, rates/volatility models, complex derivatives, risk, and xVA. Mathematical code must not depend on a particular cloud provider.

Critical invariants:

- pricing mathematics stays outside React and route files;
- rates/volatilities, time bases, currency orientation, units, signs, and market conventions remain explicit;
- numerical changes require analytical references, financial invariants, and boundary tests;
- educational approximations stay visibly labelled and are not silently promoted to production calibration;
- deterministic TypeScript fallback remains available while the Python service is optional;
- financial correctness outranks infrastructure convenience.

`AGENTS.md` and `docs/QUANT_CONVENTIONS.md` are authoritative for detailed calculation rules.

## Compute strategy

```text
Tier 0  Browser interaction and presentation
Tier 1  Cloudflare Worker APIs + deterministic TypeScript quant
Tier 2  Authenticated Python QuantEngine container — planned
Tier 3  Asynchronous jobs/batch compute — possible future
```

Google Cloud Run is the current preferred first candidate for Tier 2, not a mathematical dependency or deployed fact. Cloud Run Jobs, another container runtime, or batch infrastructure may be selected later without moving the Python engine out of this monorepo. Authentication, versioned contracts, budgets, retries, observability, and cost caps must precede remote deployment.

## Market-data architecture

The implemented path is instrument master → request/router → provider adapter → normalized quote/snapshot with provenance → product/analytics/assistant consumers. Observable data and calculated model output remain distinct.

- Demo/reference data is explicitly labelled and remains the safe fallback.
- ECB supports mapped public FX/rates; Coinbase is constrained to permitted local/private crypto use.
- Polymarket uses public normalized event/market/order-book flows with bounded D1 persistence; high-frequency live persistence is disabled in public production.
- Timestamps, provider, mode, licensing state, and missing values remain visible; adapters must not invent unsupported quotes.
- General licensed real-time streaming and provider switching remain disabled publicly until display rights are confirmed.
- Credentials are server-only; raw licensed or redistributable-restricted data must not be committed or bundled.

Use `src/market-data/`, `src/polymarket/`, and the market-data documentation group before changing this boundary.

## Deployment model

**CURRENT:** production is a Cloudflare Worker built from GitHub `main` using vinext/Vite. Wrangler configuration declares the `thequantbateman` Worker, observability, conservative public variables, and the active D1 binding. The custom domain `https://thequantbateman.com` is active and user-verified on 2026-08-21. The `workers.dev` endpoint remains an infrastructure endpoint, not an application constant. `.openai/hosting.json` exists only for Codex preview compatibility.

Local development may run the Worker-compatible frontend alone or with the optional Python validation service. Remote D1 migrations are manual release actions. Code releases do not roll back database schema or data. Follow the deployment and security runbooks before changing remote infrastructure.

## Configuration and secrets

- `.env.example` documents optional assistant, market-data, feature-policy, and local quant-engine variables without usable credentials.
- Local values belong in ignored `.env.local` files.
- Safe public non-secret defaults and binding names belong in `wrangler.jsonc`.
- Production credentials belong in Cloudflare Secrets or the selected server runtime secret store, never Git, chat, client bundles, screenshots, or `NEXT_PUBLIC_*` variables.
- Provider activation requires both technical configuration and confirmed display/redistribution rights.

## Development commands and quality gates

```bash
npm ci                    # reproducible Node setup
npm run setup:quant       # one-time optional Python environment
npm run dev               # Worker-compatible frontend
npm run dev:quant         # optional FastAPI validation service
npm run dev:all           # both local services
npm run typecheck
npm run lint
npm run i18n:audit
npm test
npm run build
npm run cloudflare:preflight
npm run license:intake -- --file <path> --title <title> --owner <owner> --intent <action>
npm run license:notices
npm run license:audit
```

Before a product handoff or release, run typecheck, lint, tests, production build, and Cloudflare preflight. Run targeted numerical/provider tests first. Remote migrations and deployment require explicit confirmation and the runbook; they are never implied by a normal code change.

## Non-negotiable architectural invariants

1. One canonical monorepo; no parallel QuantPlatform copies.
2. GitHub is source of truth; Cloudflare production is downstream of Git.
3. Routes stay thin; UI does not own financial mathematics or provider secrets.
4. Quant-domain code stays framework- and infrastructure-agnostic.
5. The Python engine is preserved even while production uses TypeScript fallback.
6. Observed provider data never silently merges with calculated or demo data.
7. Provider secrets and licensed raw data remain server-side and outside Git.
8. Existing working behavior is not rewritten without a verified need.
9. Financial conventions and correctness cannot be traded for UI or deployment convenience.

## Current project state

**CURRENT:** the public bilingual platform is live at the custom domain. Working areas include the interactive homepage discovery map, six-track deep Academy, quantitative labs/analytics, markets and Polymarket views, intelligence/research, and the compact Ask assistant. Cloudflare Workers Builds and D1 are active. The assistant defaults to deterministic local evidence routing; general licensed streaming is conservative/off by policy. The Python engine is tested locally but not a production dependency.

## Active roadmap

- **NOW:** keep the public Cloudflare release stable and use this context layer to make agent work selective and reproducible.
- **NEXT:** improve authored bilingual content, volatility calibration/arbitrage diagnostics, production assistant retrieval/tools, and the authenticated remote quant-engine contract when advanced compute requires it.
- **LATER:** extend calibrated cross-asset models, advanced risk/xVA, accounts/progress/collaboration, optional voice/animation, and asynchronous heavy compute without breaking current boundaries.

## Known limitations

- Public general-market streaming/provider switching remains restricted by licensing policy; demo/reference fallbacks are intentional.
- The local/mock assistant is not a production LLM provider and must not invent prices or numerical results.
- The Python QuantEngine is not remotely deployed or authenticated; public labs must continue to work without it.
- QuantLib is optional validation tooling, not a current runtime dependency.
- D1 persistence is prediction-market focused; high-frequency live writes are intentionally disabled until usage and limits are measured.
- Some older roadmap/deployment prose describes earlier phases; current source/configuration and this file's dated state take precedence for status, while the documents remain authoritative for procedure and design intent.

## Documentation router

Load only the group relevant to the task:

| Task domain | Read next |
| --- | --- |
| Product/architecture | `docs/PRODUCT.md`, `docs/ARCHITECTURE.md` |
| Academy/content/i18n | `docs/academy/`, `docs/CONTENT_MODEL.md`, `docs/I18N.md` |
| Quant conventions/engine | `docs/QUANT_CONVENTIONS.md`, `docs/QUANT_ENGINE.md`, `docs/QUANTLIB_STRATEGY.md` |
| Quant visualization/labs | `docs/QUANT_VISUALIZATION.md`, `docs/academy/visual-labs.md`, `docs/qa/interactive-visualizations.md` |
| Market data/providers | `docs/MARKET_DATA_ARCHITECTURE.md`, `docs/MARKET_DATA.md`, `docs/MARKET_DATA_MODES.md`, `docs/MARKET_DATA_LICENSING.md` |
| Polymarket/predictions | `docs/POLYMARKET_INTEGRATION.md`, `docs/PREDICTION_MARKET_PROBABILITIES.md`, `docs/polymarket-platform.md` |
| Streaming/intelligence | `docs/MARKET_STREAMING.md`, `docs/STREAMING_ARCHITECTURE.md`, `docs/MARKET_INTELLIGENCE.md` |
| AI assistant | `docs/AI_ARCHITECTURE.md`, `docs/AI_PRIVACY.md`, `docs/AI_TOOLS.md`, `docs/AI_EVALUATION.md` |
| Design/avatar | `docs/DESIGN_SYSTEM.md`, `docs/design/quant-bateman-assistant.md`, `docs/AVATAR_ART_DIRECTION.md` |
| Cloudflare/release/security | `docs/DEPLOYMENT_CLOUDFLARE.md`, `docs/security/DEPLOYMENT_CHECKLIST.md`, `docs/security/PRE_PRODUCTION_SECURITY_AUDIT.md` |
| External sources/licensing | `docs/legal/README.md`, `docs/legal/source-registry.json`, `docs/OPEN_SOURCE_ATTRIBUTION.md` |
| Roadmap/research/QA | `docs/ROADMAP.md`, `docs/research/`, `docs/qa/` |

## New-session bootstrap

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short
git log -5 --oneline
```

Then:

1. Read `AGENTS.md` and this file.
2. Classify the requested task by domain.
3. Use the router above and open only relevant documentation/source.
4. Search for existing contracts before creating abstractions.
5. Do not rescan the entire repository unless the task genuinely crosses domains.

## Context routing policy

- Frontend/design → relevant `app/`, `src/components/`, design/QA docs; do not preload quant/provider research.
- Academy/content → `src/content/`, `content/`, Academy/content/i18n docs and relevant component contract.
- Quant → `src/quant/`, numerical tests, quant conventions/engine docs; add Python only if the engine boundary is involved.
- Market data/Polymarket → instrument/provider/persistence modules and market-data documentation; verify licensing mode.
- AI → server assistant/evidence modules and AI docs; quant/providers remain authoritative tools.
- Deployment/database → Worker, Wrangler, D1 schema/migrations, deployment/security docs; confirm account and target before remote actions.
- Python engine → `services/quant-engine/`, its tests/readme, quant-engine and deployment boundary docs.

## Freshness and update policy

If HEAD differs materially from `5a2620c`, inspect recent commits and validate only context relevant to the current task. Update this file when architecture, runtime/deployment boundaries, canonical workflow, provider strategy, quant-engine strategy, database strategy, major project phase, or an important known limitation changes.

Do **not** update it for minor UI changes, routine refactors, individual content entries, test additions, or small bug fixes. Source and current configuration always win when a statement appears stale. Change the validation date/SHA only after checking the affected facts, not merely because HEAD advanced.
