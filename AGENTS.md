# TheQuantBateman agent guide

## Architecture

- `app/` owns routing and metadata only. Route files compose domain components.
- `src/components/` owns presentation by domain: content, labs/charts, AI/avatar and markets.
- `src/quant/` is framework-free TypeScript. It must never import React, browser APIs or UI types.
- `src/content/` owns typed metadata and the search index. `content/` is the MDX-compatible authoring source.
- `src/data/` exposes provider interfaces and local demo implementations.
- `src/i18n/` owns UI dictionaries and device-local locale state; content localization lives in `src/content/localization.ts`.
- `docs/` records product and engineering decisions. `services/quant-python/` is optional future infrastructure.

Dependencies flow inward: routes → components → typed domain modules. Quant and provider modules must not depend on routes or components.

## Coding conventions

- TypeScript strict mode; exported domain functions require explicit input/output types.
- Prefer small pure functions and domain names over generic utilities.
- Keep state close to the interaction that owns it. Avoid global state until cross-route persistence is required.
- Do not place financial formulas, mock market records or authored educational copy directly in route files.
- Preserve Cloudflare Worker-compatible ESM and the existing vinext build pipeline.

## Quant calculation standards

- Rates and volatilities are decimal inputs: `0.05` means 5%.
- Time is an ACT/365-like year fraction for educational examples unless explicitly overridden.
- Base curves use continuously compounded zero and forward rates.
- Black-Scholes vega is reported per one volatility point (`raw vega × 0.01`), theta per calendar day, and rho per 100bp.
- FX spot means domestic currency per unit of foreign currency. Always state delta, premium, ATM and settlement conventions.
- Validate finite numbers and financial domains at module boundaries.
- Keep simplified bootstrap logic labelled as educational. Do not silently promote it to instrument-calibrated production logic.
- Use tolerances justified by the algorithm; never snapshot numerical finance output.

## Testing requirements

- Every new pricing model needs analytical reference values, parity/invariant tests and boundary cases.
- Every curve method needs inversion or consistency tests.
- Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` before handoff.
- Regressions in units, sign conventions or time scaling are release blockers.

## UI conventions

- Preserve the warm off-white/near-black base, oxblood accent and restrained editorial dark mode.
- UI type is sans, formulas/numbers are monospace, and serif is reserved for editorial emphasis.
- Labs are desktop-primary but must stack without horizontal page overflow.
- All controls need labels; keyboard navigation and `prefers-reduced-motion` are mandatory.
- Use motion to explain state, never to decorate idle screens.
- Reuse axes, formatting, crosshair and tooltip behavior from `src/components/charts/`.
- Do not imitate a real actor, film character, copyrighted scene or third-party brand asset.

## Content conventions

- Use the `ContentEntry` schema and keep `lastReviewed`, difficulty, type and relationships current.
- Teach in this order: intuition, mathematics, assumptions, parameters, pricing/calibration, risk, market use, limitations, lab/code, desk view, related concepts.
- Label simplifications and active research explicitly. Do not imply that experiments are desk standards.
- Humour is sparse, dry and subordinate to correctness.

## Security and data rules

- No secrets or licensed market data in client bundles, fixtures, screenshots or commits.
- API keys are server-only. Never prefix secrets with `NEXT_PUBLIC_`.
- No `eval`, unsafe remote HTML, proprietary terminal scraping or unvalidated user numeric input.
- Demo data must remain labelled. External providers require typed adapters and a local fallback.

## Dependency rules

- Add dependencies only when a platform requirement cannot be met robustly with the current stack.
- Pin exact versions, preserve the lockfile and verify the Worker build.
- Heavy charts must be route-local or lazy-loaded. Do not add a global visualization bundle for one lab.

## How future agents should work

1. Read this file and the relevant domain doc.
2. Search for the existing type, model or component before creating another abstraction.
3. Make the smallest domain-correct change and preserve public conventions.
4. Add or update targeted tests before broad validation.
5. Update content review dates and docs when a convention or provider contract changes.
