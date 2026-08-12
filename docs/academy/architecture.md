# Academy V2 architecture

Reviewed 13 August 2026.

## Boundary

Academy V2 extends the existing Learn system. It does not replace the typed `ContentEntry` knowledge graph or redesign other routes.

```text
app/learn routes
  → Academy landing / canonical lesson renderer
    → src/content/academy structured content
    → reusable Academy presentation components
    → lazy interactive lab leaf
      → framework-free src/quant calculations
```

`app/` keeps route composition and metadata. `src/content/academy/` owns the curriculum, lesson schema and attribution. `src/components/academy/` owns presentation. Framework-free modules under `src/quant/` own deterministic volatility, probability, simulation and risk calculations and import no React or browser APIs.

## Existing content map

| Existing capability | Decision | Academy V2 treatment |
|---|---|---|
| `/learn` typed catalog | Keep + improve | Preserved below a new sequenced track; search added |
| `/learn/[asset]/[slug]` articles | Keep | Existing routes and `ContentEntry` rendering remain intact |
| KaTeX `Formula` | Keep | Reused by formulas and stepwise derivations |
| Custom canvas charts | Improve | Reused `LineChart`; new shared surface lab uses the same dependency-free approach |
| Legacy `/lab?lab=surface` | Keep | No behavior removed; Academy adds a deeper reusable workbench |
| Analytics hub | Improve in scope | Volatility card now opens `/analytics/volatility` |
| Hardcoded generic article sections | Restructure only for deep lessons | Canonical Academy lessons use structured section data |
| All other product modules | Keep | No redesign or data-contract changes |

## Rendering strategy

- Landing and lessons remain server components.
- The interactive lab is a leaf client component loaded through `React.lazy` and `Suspense`.
- 3D is optional. Heatmap is the default analytical view because it is more legible and accessible.
- Every visual derives from one deterministic surface grid and exposes an exact readout plus numeric table.
- No visualization dependency was added; this preserves the existing Worker-compatible build and keeps the Academy text path light.

## Academy V2 track inventory

| Track | Deep lessons | Flagship interaction |
|---|---:|---|
| Probability, measures & pricing | 5 | filtration and measure-change explorers |
| Volatility | 12 | linked heatmap / 3D surface workbench |
| Rates & curves | 13 | curve bootstrap and rate-scenario labs |
| Numerical finance | 4 | seeded schemes, error and transform diagnostics |
| Greeks & hedging | 3 | desk-unit sensitivities and hedge P&L |
| Risk & xVA | 4 | exposure, CVA, tail and governance controls |

The shared `QuantFlow` renders information, measure, model, market and risk nodes. It is presentational only; financial state and formulas stay in the typed lesson and quant layers.

## Adding another track

1. Add typed lesson objects in `src/content/academy/<track>.ts`.
2. Register lessons/tracks in `src/content/academy/catalog.ts`.
3. Reuse the canonical renderer and components; do not invent another article layout.
4. Put numerical logic in `src/quant/`, not content or React.
5. Add source records and per-lesson references.
6. Add invariants and boundary tests before enabling a lab.

The next asset-class track should reuse this contract and add its numerical logic under the relevant `src/quant/` domain.
