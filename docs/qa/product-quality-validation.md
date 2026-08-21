# Product quality validation

**Scope:** Academy presentation, formula disclosure, analytical charts, volatility-surface consolidation, homepage discovery, global search, EN/ES interface hardening and shared design tokens.

## Automated release gates

The integrated release candidate passed the repository's official gates again on 2026-08-21:

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run i18n:audit` | PASS — 98 keys in each locale |
| `npm run test:quant` | PASS — 96/96 TypeScript tests |
| `npm run test:python` | PASS — 9/9 analytical-service tests |
| `npm run build` | PASS — all five vinext production stages |
| `node --test tests/rendered-html.test.mjs` | PASS — 9/9 Worker-rendered route contracts |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `npm run cloudflare:preflight` | PASS |
| `npx wrangler deploy --dry-run` | PASS — 122 modules, 160 assets, 631.61 KiB compressed, expected D1 and public-demo bindings |
| `git diff --check` | PASS |

Strict content coverage compiles all 108 formula expressions and 100 derivation-step expressions with KaTeX error handling enabled. Numerical tests cover analytical references, parity/invariants, invalid inputs, constant domains, units and deterministic surface selection rather than snapshots.

## Rendered and interaction checks

Browser checks covered 375, 768, 1280 and 1440px in EN/ES and dark/light presentation where relevant.

- Sampled homepage, Academy and volatility-surface pages had no document-level horizontal overflow.
- Long mathematics remains inside a controlled horizontal scroller at 375px.
- Hash navigation opens enclosing disclosures and lands below the 92px sticky offset.
- Knowledge-map hover, focus, click and Enter interactions update a live detail panel; its mobile layout becomes a grouped vertical flow rather than a scaled desktop graph.
- Command search loads the Academy index only when opened; `Girsanov` and Spanish `esperanza condicional` resolve to the canonical lessons.
- The surface defaults to its accessible heatmap and only mounts 3D after explicit selection. Tabs, scenarios, playback, camera controls and numeric cells have keyboard semantics and 44px minimum targets.
- Reduced-motion mode disables scenario autoplay while preserving manual time navigation.
- Representative Academy lessons reduced their page heights materially while retaining their full authored content in server-rendered disclosures.
- Spanish checks covered homepage/search, track chrome, lesson levels, formula controls, Heston comparison rows and surface scenario/playback labels.

## Route contracts

Fresh Worker rendering verified the homepage, Learn landing, representative Foundations/Rates/Volatility lessons, Analytics volatility route, canonical surface lab query and localized Heston route. Public routes and query contracts remain unchanged.

## Residual boundaries

- The long-form Spanish body prose for 13 legacy rates lessons remains canonical English; interface chrome and authored formula/track metadata are localized. This is an explicit content-review boundary, not a runtime defect.
- Canvas visuals retain numeric/table alternatives; automated SSR tests verify initial accessibility structure, while pointer and arrow-key interactions are additionally browser-verified.
- Market and prediction data remain explicitly labelled public-demo/fallback data under the existing provider contract.
