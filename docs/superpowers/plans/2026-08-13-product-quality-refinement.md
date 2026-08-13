# Product Quality Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Academy, Analytics, homepage, search, and shared visual primitives into one compact, navigable, mathematically rigorous quantitative-finance product without adding curriculum or calculator scope.

**Architecture:** Keep the current vinext/React/Cloudflare route boundaries. Extend the typed Academy content contract, render mathematical depth through native inline disclosure using the existing KaTeX renderer, consolidate the duplicate volatility surface behind the existing framework-free quant module, and derive homepage discovery/search from small validated metadata rather than loading the full Academy catalog on first paint. Preserve all public routes, provider contracts, Cloudflare configuration, and deterministic TypeScript fallbacks.

**Tech Stack:** TypeScript 5.9 strict mode, React 19, vinext, Cloudflare Workers/D1, KaTeX, dependency-free Canvas/SVG, CSS custom properties, Node `node:test`, Python `unittest`.

## Global Constraints

- [ ] Work only on `codex/product-quality-refinement` in the canonical repository.
- [ ] Do not add Academy topics, tracks, lessons, Analytics calculators, providers, dependencies, or routes.
- [ ] Preserve existing calculation conventions in `AGENTS.md` and `docs/QUANT_CONVENTIONS.md`.
- [ ] Keep `src/quant/` framework-free and place every touched calculation or validation there.
- [ ] Keep EN/ES parity; do not introduce mixed-language interface text.
- [ ] Keep every current public route and query contract, including `/lab?lab=surface` and legacy lesson aliases.
- [ ] Treat the homepage map as navigation over existing content, not a new analytical module.
- [ ] Use synthetic/open data only; preserve visible demo/educational labels.
- [ ] Make one focused commit per completed task, then run a fresh spec and quality review before moving on.
- [ ] Do not merge or deploy production without separate confirmation.

---

### Task 1: Record the quality inventory and strengthen the test harness

**Files:**
- Create: `docs/qa/product-quality-inventory.md`
- Modify: `tests/rendered-html.test.mjs`

- [ ] **Step 1: Write the inventory before changing behavior**

Record the current KEEP / REFINE / SIMPLIFY / COMBINE / RESTRUCTURE / FIX decision for:

- the six Academy tracks and 41 canonical lessons;
- the canonical lesson renderer and legacy `ConceptArticle` path;
- all four Analytics destinations;
- the two volatility-surface kernels and renderers;
- `LineChart`, heatmaps, curve Canvas, Greek matrix, and 3D surface;
- homepage, global search, i18n, and global CSS tokens.

The document must include the measured production heights already captured in the approved design specification and the explicit release exclusions.

- [ ] **Step 2: Add failing rendered-route coverage**

Extend the route matrix in `tests/rendered-html.test.mjs` to cover:

```js
["/learn/foundations/girsanov-risk-neutral-pricing", "Girsanov"]
["/learn/rates/interest-rate-swaps", "Interest-rate swaps"]
["/learn/volatility/heston-model", "Heston"]
["/analytics/volatility", "ONE LINKED STATE"]
["/lab?lab=surface", "ONE LINKED STATE"]
```

Update `render(path, options)` so the Worker request preserves search parameters and can receive `cookie: "tqb-locale=es"` for later localization assertions.

- [ ] **Step 3: Run the focused baseline**

Run:

```bash
npm run typecheck
npm run lint
npm run i18n:audit
npm run cloudflare:preflight
```

Expected: PASS. Do not run the newly expanded `test:quant` until its files exist.

- [ ] **Step 4: Commit**

```bash
git add docs/qa/product-quality-inventory.md tests/rendered-html.test.mjs
git commit -m "test: define product refinement quality inventory"
```

---

### Task 2: Add depth-aware Academy formula contracts

**Files:**
- Create: `tests/academy-content.test.ts`
- Modify: `package.json`
- Modify: `src/content/academy/types.ts`
- Modify: `src/content/academy/advanced.ts`
- Modify: `src/content/academy/volatility.ts`
- Modify: `src/content/academy/volatilityTrackLessons.ts`
- Modify: `src/content/academy/rates.ts`
- Modify: `src/content/academy/ratesAdvancedLessons.ts`
- Modify: `src/content/academy/ratesOptionalityLesson.ts`
- Modify: `src/content/academy/localization.ts`
- Modify: `tests/content.test.ts`

- [ ] **Step 1: Write the failing content contract test**

Add strict tests that require:

```ts
type AcademyFormulaDepth = 1 | 2 | 3;

interface AcademyFormula {
  label: string;
  latex: string;
  interpretation: string;
  depth: AcademyFormulaDepth;
  analyticsHref?: string;
}

interface AcademyDerivation {
  formulaIndex: number;
  depth: 2 | 3;
  title: string;
  introduction: string;
  steps: AcademyDerivationStep[];
  conclusion: string;
}
```

Assertions:

- every one of the 108 formulas has a depth of 1, 2, or 3;
- every lesson derivation binds to an in-range `formulaIndex`;
- depth-2 derivations have at least two coherent steps;
- depth-3 derivations retain at least four steps;
- every `analyticsHref`, when present, belongs to the existing route allowlist;
- every formula and derivation equation compiles with `katex.renderToString(..., { throwOnError: true })`;
- every localized advanced lesson preserves formula depth and derivation binding.

Run:

```bash
node --import tsx --test tests/academy-content.test.ts
```

Expected: FAIL because the current schema has no depth or binding.

- [ ] **Step 2: Register the new test and implement the typed schema**

Add `tests/academy-content.test.ts` to `test:quant`, then implement the schema below. The command remains runnable because the file now exists.

In `src/content/academy/types.ts`, export `AcademyFormulaDepth` and `AcademyDerivation`, add `depth` and optional `analyticsHref` to `AcademyFormula`, and change `AcademyLesson.derivation` to `AcademyDerivation`.

- [ ] **Step 3: Classify all existing formulas and derivations**

Review all 41 lessons explicitly. Use these rules:

- depth 1: definition or direct identity; no attached multi-step proof needed;
- depth 2: short operational derivation or one transformation chain;
- depth 3: classical derivation, measure change, model PDE/SDE, calibration, or numerical scheme where intermediate logic materially matters.

Bind each lesson-wide derivation to the formula it actually derives. Never infer by localized label or assume formula index zero. Add `analyticsHref` only for a real destination such as `/lab?lab=vanilla`, `/lab?lab=greeks`, `/lab?lab=curve`, `/analytics/volatility`, or an existing canonical lesson route.

- [ ] **Step 4: Remove the blanket derivation rule**

Replace `lesson.derivation.steps.length >= 4` in `tests/content.test.ts` with depth-aware assertions. Preserve the existing 41-lesson, source, track, route, Python assertion, and localization guards.

- [ ] **Step 5: Run focused validation**

```bash
node --import tsx --test tests/academy-content.test.ts tests/content.test.ts
npm run typecheck
npm run i18n:audit
```

Expected: PASS with 108 formulas classified and all LaTeX strict-valid.

- [ ] **Step 6: Commit**

```bash
git add src/content/academy tests/academy-content.test.ts tests/content.test.ts package.json
git commit -m "feat: classify academy formulas and derivations"
```

---

### Task 3: Build compact inline formula and derivation primitives

**Files:**
- Create: `tests/academy-components.test.tsx`
- Modify: `src/components/academy/AcademyComponents.tsx`
- Modify: `src/i18n/index.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write dependency-free SSR component tests**

Use `renderToStaticMarkup` from `react-dom/server` to assert that a proposed `QuantFormula`:

- renders label, KaTeX equation, and interpretation while collapsed;
- emits no `open` attribute by default;
- exposes native `<details><summary>` for derivation, inputs, and assumptions only when content exists;
- associates summary and region with stable IDs;
- renders no derivation disclosure for depth-1 formulas;
- shows an existing Analytics link only when `analyticsHref` is configured;
- accepts localized labels and produces equivalent EN/ES structure;
- preserves ordered math steps and numerical checks.

Run:

```bash
node --import tsx --test tests/academy-components.test.tsx
```

Expected: FAIL because `QuantFormula` does not exist.

- [ ] **Step 2: Register the test and implement `QuantFormula` using current KaTeX**

Add `tests/academy-components.test.tsx` to `test:quant`, then implement the component. The command remains runnable because the file now exists.

Add the following server-renderable prop contract to `AcademyComponents.tsx`:

```ts
export interface QuantFormulaLabels {
  formula: string;
  definition: string;
  shortDerivation: string;
  fullDerivation: string;
  inputs: string;
  assumptions: string;
  openLab: string;
  numericalCheck: string;
}

export function QuantFormula({
  formula,
  derivation,
  notation,
  limitations,
  labels,
  anchorId,
}: {
  formula: AcademyFormula;
  derivation?: AcademyDerivation;
  notation: string[];
  limitations: string[];
  labels: QuantFormulaLabels;
  anchorId: string;
}): ReactNode
```

Reuse `Formula` and `DerivationSteps`. Do not add state, another math renderer, an animation package, or expensive conditional content.

- [ ] **Step 3: Add aligned EN/ES dictionary keys**

Add labels for formula type, derivation depth, inputs, assumptions/limits, numeric check, and existing-lab navigation to both dictionaries in `src/i18n/index.tsx`.

- [ ] **Step 4: Add compact design tokens and styles**

Introduce aliases for formula/code/chart surfaces without changing the brand palette:

```css
--surface-elevated
--surface-inset
--formula-bg
--code-bg
--chart-grid
--chart-ink
--chart-muted
--chart-series-1
--chart-series-2
--focus-ring
```

Style `QuantFormula` for controlled reading width, a full-width equation stage, 44px minimum summary hit targets, `:focus-visible`, and horizontal math scrolling at 375px. Use no decorative gradients or glow.

- [ ] **Step 5: Run focused validation**

```bash
node --import tsx --test tests/academy-components.test.tsx
npm run typecheck
npm run lint
npm run i18n:audit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/academy/AcademyComponents.tsx src/i18n/index.tsx app/globals.css tests/academy-components.test.tsx
git commit -m "feat: add compact academy formula disclosures"
```

---

### Task 4: Refactor every canonical lesson around progressive disclosure

**Files:**
- Modify: `src/components/academy/AcademyLessonPage.tsx`
- Modify: `src/components/academy/AcademyComponents.tsx`
- Modify: `src/components/academy/AcademyLanding.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/content.test.ts`

- [ ] **Step 1: Add failing rendered-page assertions**

For representative Foundations, Volatility, and Rates lesson routes, assert:

- compact formula markers and KaTeX MathML exist;
- the bound derivation is inside a closed `<details>` disclosure;
- no standalone always-expanded derivation section exists;
- critical intuition, market context, core formula, and interactive lab remain in the HTML;
- `#derivation` still resolves to a stable anchor;
- formula/lab and Ask links use existing destinations.

Run after a fresh build:

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

Expected: FAIL on the new compact-formula assertions.

- [ ] **Step 2: Replace large formula cards and standalone derivation**

In `AcademyLessonPage.tsx`:

- render each formula with `QuantFormula`;
- attach the lesson derivation only to `derivation.formulaIndex`;
- keep intuition, market context, first/core formula, and interactive lab immediately visible;
- collapse Python implementation, extended assumptions/limits, production failure modes, macro commentary, and sources using native disclosures;
- remove the separate section 04 derivation wall;
- remove broad `ModelComparison` injection and show it only on lessons whose authored content explicitly compares models;
- preserve current routes, source links, code, and lab state.

- [ ] **Step 3: Preserve hash navigation**

When a hash target sits inside a closed `<details>`, open its nearest details ancestor before `scrollIntoView`. Keep `#interactive`, `#desk`, `#sources`, and `#derivation` stable.

- [ ] **Step 4: Compact the Academy landing page**

Keep all six tracks and 41 destinations but reduce the current equal-weight wall:

- compact hero;
- grouped track summaries with the current stage links progressively revealed;
- one clear start action per track;
- the 114-entry legacy catalog remains available below the canonical track discovery layer;
- no hardcoded, drifting capability count.

- [ ] **Step 5: Refine Academy CSS**

Target:

- prose column around 70–78 characters;
- wide labs break out without page overflow;
- smaller lesson hero and learning contract;
- fewer nested borders and repeated cards;
- vertical section spacing materially below the current 90px default;
- mobile disclosure and long math remain usable at 375px.

- [ ] **Step 6: Run focused validation**

```bash
npm run typecheck
npm run lint
npm run build
node --test tests/rendered-html.test.mjs
```

Expected: PASS, and representative lessons render materially shorter than the measured 8,000–10,700px baseline.

- [ ] **Step 7: Commit**

```bash
git add src/components/academy app/globals.css tests/rendered-html.test.mjs tests/content.test.ts
git commit -m "refactor: compact academy lesson journeys"
```

---

### Task 5: Consolidate volatility Analytics on the canonical surface engine

**Files:**
- Modify: `tests/quant.test.ts`
- Modify: `src/components/labs/Labs.tsx`
- Modify: `src/components/VolatilityAnalytics.tsx`
- Modify: `src/components/academy/VolSurfaceLab.tsx`
- Modify: `src/components/academy/VolSurfaceCanvas.tsx`
- Modify: `src/quant/volatility/volSurface.ts`
- Delete: `src/components/charts/SurfaceCanvas.tsx`
- Delete: `src/quant/volatility/syntheticSurface.ts`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/globals.css`

- [ ] **Step 1: Add failing quant invariants**

Add analytical/shape tests for:

- exact ATM reference at a named maturity;
- negative skew makes the downside wing exceed the upside wing at symmetric log-moneyness;
- added curvature raises both wings without changing the ATM point;
- positive term slope raises long-tenor ATM volatility;
- invalid/NaN parameters and empty maturity/moneyness arrays reject at the module boundary;
- nearest-point selection remains deterministic.

Run:

```bash
node --import tsx --test tests/quant.test.ts
```

Expected: at least the new empty-grid validation assertion fails before implementation.

- [ ] **Step 2: Replace only the legacy surface panel**

Keep `LabId = "surface"` and `/lab?lab=surface`, but replace the local legacy `VolatilitySurfaceLab` implementation with `<LazyVolSurfaceLab compact />`. Preserve unique, useful explanatory prose outside the calculation view only if it is not already present in the canonical workbench.

- [ ] **Step 3: Remove the duplicate kernel and renderer**

After `rg` confirms no remaining imports, delete `syntheticSurface.ts` and the legacy `charts/SurfaceCanvas.tsx`. Do not alter the canonical skew convention to mimic the deprecated linear-moneyness model.

- [ ] **Step 4: Compact the Analytics wrapper and strengthen semantics**

Make the canonical workbench the primary surface on `/analytics/volatility`; reduce duplicated hero/method chrome. Add `aria-pressed` to heatmap selection and correct tab semantics (`id`, `aria-controls`, `role="tabpanel"`, roving `tabIndex`, Arrow/Home/End keys). Keep the accessible numeric surface table.

- [ ] **Step 5: Normalize the 3D view**

Keep the current heat-colored mesh, camera reset, financial labels, and 2D alternatives. Move remaining raw chart colors in touched files to the shared tokens. Mobile defaults to heatmap; 3D remains opt-in.

- [ ] **Step 6: Prove rendered-route consolidation**

Assert `/analytics/volatility` and `/lab?lab=surface` contain:

- `ONE LINKED STATE`;
- Heatmap, 3D, Smile, and Term Structure controls;
- `SYNTHETIC / EDUCATIONAL`;
- the accessible numeric grid;
- no legacy `CONSTANT σ` or duplicate wireframe marker.

- [ ] **Step 7: Run focused validation**

```bash
node --import tsx --test tests/quant.test.ts
npm run typecheck
npm run lint
npm run build
node --test tests/rendered-html.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components src/quant/volatility tests/quant.test.ts tests/rendered-html.test.mjs app/globals.css
git commit -m "refactor: unify volatility surface analytics"
```

---

### Task 6: Make shared charts compact, financial, and accessible

**Files:**
- Create: `src/components/charts/chartModel.ts`
- Create: `tests/chart-model.test.ts`
- Modify: `src/components/charts/LineChart.tsx`
- Modify: `src/components/academy/AdvancedConceptLab.tsx`
- Modify: `src/components/labs/Labs.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing pure chart-model tests**

Test:

- empty x arrays reject;
- unequal series lengths reject;
- non-finite values reject;
- constant and zero series produce stable non-zero domains;
- percent, rate, year, currency, and timestamp formatters return appropriate visible labels;
- keyboard index movement clamps and wraps according to the declared interaction contract.

Run:

```bash
node --import tsx --test tests/chart-model.test.ts
```

Expected: FAIL because `chartModel.ts` does not exist.

- [ ] **Step 2: Register the test and add a backward-compatible `LineChartProps` contract**

Add `tests/chart-model.test.ts` to `test:quant`, then implement the helper and prop contract.

Export:

```ts
export interface LineChartProps {
  x: readonly number[];
  series: readonly Series[];
  xLabel: string;
  yLabel: string;
  height?: number;
  description?: string;
  xFormatter?: (value: number) => string;
  yFormatter?: (value: number) => string;
  showTable?: boolean;
}
```

Use pure helpers for validation and domains. Render the chart as a labelled `<figure>` with visible legend, concise interpretation/description, keyboard-inspectable selected index, `aria-live` numeric output, and an optional table disclosure. Do not rely on color alone.

- [ ] **Step 3: Repair touched chart consumers**

- pass financial labels and formatters from volatility, curves, Greeks, Monte Carlo, exposure, and P&L views;
- replace touched raw hex colors with semantic chart tokens;
- convert the Greek scenario matrix from decorative `<i title>` cells into semantic buttons or table cells with visible axes and values;
- preserve the curve input table as the keyboard numeric fallback for the curve Canvas.

- [ ] **Step 4: Run focused validation**

```bash
node --import tsx --test tests/chart-model.test.ts tests/quant.test.ts
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts src/components/academy/AdvancedConceptLab.tsx src/components/labs/Labs.tsx app/globals.css tests/chart-model.test.ts
git commit -m "feat: add accessible financial chart contracts"
```

---

### Task 7: Build validated platform-map and search data contracts

**Files:**
- Create: `src/content/platformMap.ts`
- Create: `src/content/search.ts`
- Create: `src/content/academy/search.ts`
- Create: `tests/platform-map.test.ts`
- Create: `tests/search.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing platform-map tests**

Require:

- unique node IDs;
- valid edge endpoints, no self-edges, no duplicate undirected edges;
- every track node resolves to one of the six `academyTracks` and uses `/learn#track-${trackId}`;
- every product/workflow href belongs to an explicit existing-route allowlist;
- selecting a node returns itself plus inbound/outbound neighbors;
- Spanish localization changes copy but preserves IDs, edges, coordinates, and hrefs.

- [ ] **Step 2: Write failing search tests**

Require:

- Academy search contains 41 lesson items plus six track items;
- `Girsanov` ranks `/learn/foundations/girsanov-risk-neutral-pricing` first;
- Spanish `esperanza condicional` returns the canonical conditional-expectation lesson;
- accentless `valoracion` matches `valoración`;
- merged search contains overlapping canonical routes once and prefers Academy records;
- empty-query suggestions are deterministic and diverse;
- limits and stable ranking hold.

Run:

```bash
node --import tsx --test tests/platform-map.test.ts tests/search.test.ts
```

Expected: FAIL because the pure data modules do not exist.

- [ ] **Step 3: Register the tests and implement the small platform map**

Add `tests/platform-map.test.ts` and `tests/search.test.ts` to `test:quant`, then implement the pure data contracts. The command remains runnable because both files now exist.

Create exact contracts:

```ts
export type PlatformMapNodeKind = "platform" | "track" | "workflow";

export interface PlatformMapNode {
  id: string;
  kind: PlatformMapNodeKind;
  label: { en: string; es: string };
  description: { en: string; es: string };
  href: string;
  trackId?: string;
  x: number;
  y: number;
}

export interface PlatformMapEdge {
  source: string;
  target: string;
}
```

Include only real existing nodes: Academy, Foundations, Volatility, Rates, Numerical Finance, Greeks & Hedging, Risk & xVA, Analytics/Pricing, Markets, and Ask. Edges must represent actual learning/workflow relationships.

- [ ] **Step 4: Implement pure search and lazy Academy indexing**

Create `PlatformSearchItem`, diacritic-normalizing token/rank helpers, deterministic merge/deduplication, and core search items. Put the 47 Academy items in `src/content/academy/search.ts` so `AppShell` can import them only when the palette opens. Never import the full lesson catalog into the homepage runtime.

- [ ] **Step 5: Run focused validation**

```bash
node --import tsx --test tests/platform-map.test.ts tests/search.test.ts tests/content.test.ts
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/content/platformMap.ts src/content/search.ts src/content/academy/search.ts tests/platform-map.test.ts tests/search.test.ts package.json
git commit -m "feat: add validated discovery and search indexes"
```

---

### Task 8: Redesign homepage discovery and integrate Academy search

**Files:**
- Create: `src/components/home/PlatformKnowledgeMap.tsx`
- Modify: `src/components/HomePage.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/i18n/index.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

- [ ] **Step 1: Add failing homepage SSR assertions**

Assert `/` contains:

- a labelled platform-map landmark;
- real links for Foundations, Volatility, Rates, Numerical Finance, Risk/xVA, Analytics, Markets, and Ask;
- semantic node controls and a detail region;
- no fake canvas-only graph;
- compact task actions for learn, analyze, explore markets, and ask;
- the Spanish map heading and labels when rendered with `tqb-locale=es`.

Run after build:

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

Expected: FAIL on the map assertions.

- [ ] **Step 2: Implement `PlatformKnowledgeMap`**

Use semantic buttons/anchors plus decorative SVG edges:

- hover/focus highlights selected node plus direct neighbors and mutes unrelated nodes;
- click/Enter selects a node and updates an `aria-live` localized detail panel;
- the detail CTA navigates only to the node's real href;
- desktop uses fixed SVG coordinates from the validated data;
- at `<=768px`, hide SVG lines and render the same nodes as a grouped vertical flow;
- respect `prefers-reduced-motion` and keep the map usable without hover.

- [ ] **Step 3: Restructure `HomePage`**

Replace the poster-like opening and hardcoded five-row pseudo-graph with:

1. compact product thesis and primary action;
2. the real platform map in the first discovery viewport;
3. a concise task-oriented hierarchy for Learn, Analytics, Markets, and Ask;
4. current source-aware market pulse and existing prediction/intelligence content at lower priority.

Keep Quant Bateman secondary; do not create a large character hero. Remove hardcoded `100+` claims and derive only compact counts from small validated metadata.

- [ ] **Step 4: Integrate pure search in `AppShell`**

Move current inline search item construction/ranking to `src/content/search.ts`. When `paletteOpen` becomes true, dynamically import `src/content/academy/search.ts`, discard stale-locale results, merge/dedupe, and preserve Cmd/Ctrl+K and Escape behavior. Show a localized loading state while the Academy chunk arrives.

- [ ] **Step 5: Add EN/ES interface keys**

Add aligned dictionary keys for map eyebrow/title/copy/instructions/selected state/CTA and Academy-search loading/categories. Keep node copy in bilingual typed data.

- [ ] **Step 6: Run focused validation**

```bash
node --import tsx --test tests/platform-map.test.ts tests/search.test.ts
npm run i18n:audit
npm run typecheck
npm run lint
npm run build
node --test tests/rendered-html.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/home src/components/HomePage.tsx src/components/AppShell.tsx src/i18n/index.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: make homepage a quantitative discovery map"
```

---

### Task 9: Finish localization, tokens, responsive behavior, and mechanical UI quality

**Files:**
- Modify: `src/content/academy/localization.ts`
- Modify: `src/components/academy/AcademyComponents.tsx`
- Modify: `src/components/academy/AcademyLessonPage.tsx`
- Modify: `src/components/academy/VolSurfaceLab.tsx`
- Modify: `src/components/academy/LazyVolSurfaceLab.tsx`
- Modify: `src/components/labs/Labs.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `app/globals.css`
- Modify: `docs/i18n-audit.md`
- Modify: `docs/DESIGN_SYSTEM.md`

- [ ] **Step 1: Audit touched hardcoded English**

Run:

```bash
rg -n '>[A-Z][A-Z /·&+-]{3,}<' src/components/academy src/components/labs src/components/AppShell.tsx
```

Move touched interface labels—not model names, symbols, or source titles—into `pick(...)` or aligned dictionary keys.

- [ ] **Step 2: Remove heuristic Spanish output from touched canonical fields**

For the formula labels, derivation controls, homepage, search, surface lab, and lesson chrome changed in this release, provide authored Spanish. Do not bulk rewrite untouched lesson prose. Update the i18n audit document with the exact remaining heuristic content boundary, if any.

- [ ] **Step 3: Consolidate CSS token ownership**

- keep one canonical root token block and one light-theme override;
- preserve existing aliases during migration;
- remove touched duplicate late overrides and stale Academy/chart declarations;
- replace touched raw analytical colors with semantic chart/formula/code tokens;
- keep visible focus, 44px interactive targets, and 4.5:1 text contrast.

- [ ] **Step 4: Add responsive and reduced-motion behavior**

Verify CSS rules explicitly cover 375, 768, 1280, and 1440 widths:

- no page-level horizontal overflow;
- map switches to vertical grouped flow at 768;
- formulas scroll only inside their math region;
- labs stack controls before visualization on narrow screens;
- 3D is not the mobile default;
- autoplay is disabled under reduced motion while manual controls remain available.

- [ ] **Step 5: Run the Impeccable mechanical detector once**

```bash
node /Users/alejandrogarciamunoz/.agents/skills/impeccable/scripts/detect.mjs --json src/components/HomePage.tsx src/components/home/PlatformKnowledgeMap.tsx src/components/academy/AcademyLessonPage.tsx src/components/academy/AcademyComponents.tsx src/components/academy/VolSurfaceLab.tsx src/components/charts/LineChart.tsx src/components/AppShell.tsx app/globals.css
```

Fix only mechanical in-scope findings. Do not run a second detector.

- [ ] **Step 6: Run static validation**

```bash
npm run typecheck
npm run lint
npm run i18n:audit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src app/globals.css docs/i18n-audit.md docs/DESIGN_SYSTEM.md
git commit -m "refactor: harden product design and localization"
```

---

### Task 10: Complete browser QA, numerical regression, security, and release evidence

**Files:**
- Modify: `docs/qa/product-quality-inventory.md`
- Create: `docs/qa/product-quality-validation.md`
- Modify only if defects are found: files owned by Tasks 2–9

- [ ] **Step 1: Run full automated validation in release order**

```bash
npm run typecheck
npm run lint
npm run i18n:audit
npm run test:quant
npm run test:python
npm run build
node --test tests/rendered-html.test.mjs
npm run cloudflare:preflight
npm audit --omit=dev
```

Expected: all project tests and production build PASS; `npm audit --omit=dev` reports no production vulnerabilities. Record any known build-tool advisories exactly as documented in the existing security audit; do not force a breaking downgrade.

- [ ] **Step 2: Start the production-compatible local Worker**

```bash
npm run start
```

Use one fixed local URL for all browser checks.

- [ ] **Step 3: Inspect one batched desktop/mobile matrix**

Capture homepage, Learn landing, one Volatility lesson, one Rates lesson, one Numerical Finance lesson, one risk/xVA lesson, Analytics hub, volatility Analytics, and `/lab?lab=surface` at:

- 375 × 812;
- 768 × 1024;
- 1280 × 800;
- 1440 × 900.

For EN and ES, verify:

- no horizontal page overflow or console errors;
- long equations remain readable;
- formula/derivation disclosure works by keyboard and pointer;
- `#derivation` opens the correct disclosure;
- map hover/focus/selection/CTA behavior is correct;
- Cmd/Ctrl+K finds `Girsanov` and Spanish `esperanza condicional`;
- volatility views share one state and numeric grid;
- controls update model, chart, and visible value;
- axes, units, legends, heat scale, and 3D camera are legible;
- reduced-motion mode disables nonessential animation.

- [ ] **Step 4: Fix material defects in one batch**

Apply only defects found in the matrix, rerun targeted tests, rebuild once, and capture one confirmation matrix. Do not perform open-ended polishing.

- [ ] **Step 5: Measure before/after evidence**

Record in `docs/qa/product-quality-validation.md`:

- rendered heights for the same representative routes used in the baseline;
- Academy formula/disclosure counts;
- map/search route coverage;
- removed duplicate volatility files;
- automated test/build/security results;
- viewport/locale matrix status;
- remaining non-blocking limitations.

- [ ] **Step 6: Request independent code and design review**

Run the required `superpowers:requesting-code-review` workflow with the design specification, implementation plan, diff base `d72f030`, and validation evidence. Run the Impeccable finish review with desktop/mobile screenshots, then apply only material in-scope findings and obtain a final verdict.

- [ ] **Step 7: Commit validation evidence and fixes**

```bash
git add docs/qa/product-quality-inventory.md docs/qa/product-quality-validation.md src app tests package.json
git commit -m "test: validate product quality refinement"
```

- [ ] **Step 8: Prepare the single pull request**

Confirm:

```bash
git status --short
git log --oneline main..HEAD
git diff --stat main...HEAD
git remote -v
```

Push `codex/product-quality-refinement` and open one ready-for-review pull request only after the user-approved external-write boundary remains valid. Do not merge or deploy production.

- [ ] **Step 9: Produce the required final report**

Return one concise handoff using exactly these sections: `Audit`, `Content Quality`, `Formula System`, `Academy Design`, `Analytics Design`, `Homepage`, `Design System`, `Validation`, and `Remaining Opportunities`. Only list genuine future opportunities; do not restate completed work as a roadmap.

## Completion Gate

The release is ready for handoff only when all of the following are true:

- [ ] No new curriculum, calculator, provider, dependency, or route was added.
- [ ] All 41 canonical lessons render compact essential-first journeys.
- [ ] All 108 formulas are depth-classified and strict-valid in KaTeX.
- [ ] Derivations are bound to the correct formula and expand inline.
- [ ] The duplicate volatility kernel and renderer are removed.
- [ ] Existing Analytics routes retain correct calculations and become more compact.
- [ ] Shared charts expose financial labels and numeric access.
- [ ] Homepage discovery uses real capabilities and a keyboard-usable map.
- [ ] Global search includes all 41 lessons and six tracks without duplicate routes.
- [ ] EN/ES, light/dark, reduced-motion, and 375/768/1280/1440 checks pass.
- [ ] Typecheck, lint, i18n audit, Node tests, Python tests, build, rendered HTML, Cloudflare preflight, and production dependency audit pass.
- [ ] Before/after evidence demonstrates material—not cosmetic—improvement.
- [ ] Independent code review and design finish review report no unresolved release blocker.
