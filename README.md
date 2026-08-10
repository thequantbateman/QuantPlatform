# THEQUANTBATEMAN

**Quant Finance. Visually Explained.** A bilingual interactive workstation combining a 100+ topic knowledge graph, a source-aware Market Board, transparent option pricing, dynamic risk/scenario analytics, clearly labelled demo/reference data and a contextual local tutor.

The workstation vertical now connects Market → Instrument → Model → Pricing → Greeks → Scenarios → Visualization → Mathematics → Python → Desk View. The V0 engine covers Black–Scholes–Merton, Garman–Kohlhagen, Black–76 and robust implied-volatility inversion.

## Architecture

The vinext/React application uses thin routes in `app/`, reusable domain UI in `src/components/`, typed content in `src/content/`, and a framework-free TypeScript fallback engine in `src/quant/`. The FastAPI service in `services/quant-engine/` owns professional analytical endpoints. Market and tutor integrations use provider interfaces with local fallbacks.

## Tech stack

- React 19, TypeScript 5.9 and vinext on Vite/Cloudflare Workers
- Native Canvas for responsive 2D and rotatable 3D scientific charts
- KaTeX for server-rendered mathematics
- Node test runner with `tsx` for numerical unit tests
- CSS design system with light/dark themes; no proprietary fonts or assets

## Install and run locally

Requirements: Node.js 22.13+, npm and Python 3.9+.

```bash
npm ci
npm run setup:quant
npm run dev:all
```

One-time Python setup (the package script is intentionally explicit):

```bash
python3 -m venv services/quant-engine/.venv
services/quant-engine/.venv/bin/pip install services/quant-engine
```

Run the full application:

```bash
npm run dev:all
```

Frontend only:

```bash
npm run dev
```

Quant engine only:

```bash
npm run dev:quant
```

Open the frontend at `http://localhost:3000`; engine health is `http://127.0.0.1:8000/health`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` runs TypeScript and Python analytical references, parity, implied-volatility inversion, boundaries, curve consistency and rendered application checks.

## Content creation

Add an MDX-compatible source in `content/<asset>/`, then add its typed metadata and teaching sections to `src/content/catalog.ts`. Relationships use exact concept titles. Every entry needs an explicit difficulty, type and review date.

## Add a quant model

1. Create a framework-free module under `src/quant/models/` (or the correct quant domain).
2. Define typed inputs and outputs; document units and sign conventions.
3. Add analytical references and edge cases to `tests/quant.test.ts`.
4. Expose results through a lab component—never calculate inside React.

## Add a lab

Create a component under `src/components/labs/`, import only typed quant functions, label educational assumptions, provide exact inputs alongside sliders, and include a numerical summary for every chart.

## Product documentation

See `docs/I18N.md`, `docs/DESIGN_SYSTEM.md`, `docs/QUANT_VISUALIZATION.md` and `docs/AVATAR_ART_DIRECTION.md`.

## Add a Rive avatar

Follow `docs/AVATAR.md` and `docs/AVATAR_ART_DIRECTION.md`. The bitmap component implements the stable `AvatarState` contract; Rive can replace only the visual layer.

## Add an AI provider

Implement `QuantAssistantProvider` on the server, pass explicit `QuantContext`, validate tool inputs, and select it through server configuration. Keep the mock provider as the no-key fallback. See `docs/AI_ARCHITECTURE.md`.

## Add market data

Implement `MarketDataProvider`, normalise licensed provider records on the server, attach provenance/timestamps and retain `LocalMarketDataProvider` for development. Do not scrape licensed terminals or exchanges.

## Deployment

The repository preserves the bundled Sites/vinext Cloudflare Worker pipeline. Validate with `npm run build`; hosted versions use `.openai/hosting.json` and the generated `dist/` Worker artifact.

## Roadmap

See `docs/ROADMAP.md` for content expansion, AI tutor, market data, community, advanced quant, voice/avatar and public launch phases.
