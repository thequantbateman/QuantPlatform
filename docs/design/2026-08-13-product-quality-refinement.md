# Product quality refinement

**Status:** Approved for implementation  
**Release shape:** One integrated branch and pull request  
**Scope:** Existing Academy, Analytics, homepage, search and shared design primitives  
**Non-goal:** New Academy topics, tracks, lessons or Analytics modules

## Outcome

Transform the existing content-rich product into a compact, coherent quantitative-finance workspace. The release prioritizes mathematical readability, progressive disclosure, causal interaction, navigable product discovery and visual consistency. It preserves all current routes, calculations and Cloudflare deployment boundaries.

The homepage knowledge map is the only new product surface. It is navigation over existing content, not a new curriculum or Analytics module.

## Evidence and baseline

The repository currently contains six Academy tracks, 41 canonical deep lessons, 114 legacy concepts, 108 canonical lesson formulas and 182 derivation steps. Representative production lessons render between roughly 8,000 and 10,700 pixels high; the Learn landing page exceeds 15,000 pixels and presents more than 200 similarly weighted content elements. The current homepage has no platform map, and global search omits canonical Academy lessons.

The current KaTeX implementation, typed Academy catalog, localization pipeline, framework-free quant modules and Canvas chart primitives remain the foundation. The strongest existing interaction—the linked volatility-surface workbench—defines the expected pattern: a control changes a financial parameter, the model recomputes, related views update and a numeric fallback remains available.

Peer review supports a differentiated product position: active visual learning, reactive laboratories, explicit desk conventions and academically rigorous derivations in one workflow. Peer content, proprietary layouts and licensed data will not be copied.

## Scope and release architecture

### 1. Formula and derivation system

Retain KaTeX. Extend the typed Academy formula contract with only the metadata needed for consistent presentation:

- formula purpose and input definitions;
- depth classification: definition, short derivation or full derivation;
- optional assumptions and parameter intuition;
- optional relationship to an existing lab, Analytics route or lesson derivation.

Introduce reusable `QuantFormula`, `QuantDerivation` and equation-step presentation primitives. The collapsed state shows the name, equation and one concise interpretation. Optional sections open inside the lesson with accessible expanded semantics, keyboard operation and restrained height transitions. Long mathematics uses controlled horizontal scrolling on narrow screens.

Critical information remains visible. Only mathematical depth, implementation detail, assumptions and extended Front Office commentary are collapsed.

### 2. Academy compaction

Refactor the canonical lesson renderer around this default rhythm:

1. title and one-line purpose;
2. key idea and market relevance;
3. core formula or visual;
4. interactive lab and concise interpretation;
5. expandable derivation, assumptions and implementation detail;
6. desk view, limitations, references and related concepts.

This is a rendering and content-quality migration, not a rigid new schema for every lesson. Sections without material content are omitted rather than represented by empty cards. Reading prose and formulas use a controlled width; interactive workspaces may use a wider canvas. Repeated model-comparison and generic teaching copy are removed when they do not serve the lesson.

The content audit corrects inconsistent notation and unclear existing statements without bulk rewriting. Canonical conventions include:

- `t` for current/model time and `T` for maturity;
- `\tau = T-t` when time to maturity is required;
- `S_t`, `K`, `F(t,T)`, `P(t,T)`, `r`, `q` and `\sigma` with declared units;
- named probability measures and numeraires for every expectation;
- documented Greek scaling and rate/volatility decimal conventions.

### 3. Analytics and charts

No new calculator is introduced. Existing Analytics and Academy labs are compacted to a parameter toolbar, primary chart, short interpretation and optional detail.

The two volatility-surface implementations are consolidated behind one framework-free surface model and shared financial formatting. Only compatible behavior is migrated; public routes remain unchanged. Calculations touched during the refactor move from React components into `src/quant` with domain validation and numerical tests.

Charts expose:

- financial axis names and units;
- shared tick, grid, tooltip and semantic color formatting;
- deterministic reset and visible demo/live state;
- numeric or tabular alternatives where Canvas interaction alone is insufficient;
- keyboard-accessible controls and reduced-motion behavior.

Existing 3D surfaces retain rotation and zoom on capable displays. Their initial camera emphasizes the financial shape. Mobile uses the existing heatmap or slice treatment where full 3D is not legible.

### 4. Homepage discovery

Replace the marketing-poster composition with an editorial discovery surface. The character remains a small secondary identity element.

The opening explains the product in one compact statement and immediately introduces a knowledge/platform map generated from actual track, route and capability metadata. It contains no invented functionality.

Desktop uses a lightweight SVG plus semantic HTML node controls. Hover or focus highlights direct relationships and mutes unrelated nodes. Selecting a node reveals a concise localized description and one or more existing destinations. Mobile uses a vertical grouped flow rather than shrinking the desktop graph.

The map represents meaningful relationships across existing areas such as foundations, rates, volatility, numerical finance, Greeks/hedging, risk/xVA, Analytics, Markets and Ask. After the map, the homepage presents a short task-oriented hierarchy: learn, analyze, explore markets and ask.

### 5. Search and cross-linking

Extend the current command search index with canonical Academy lessons, formulas and verified existing destinations. Avoid duplicate results where a legacy concept aliases a canonical lesson.

Cross-links are bidirectional when the destination exists:

- lesson formula to relevant existing lab or Analytics surface;
- Analytics surface to its Academy explanation;
- related concepts to canonical lessons;
- lesson and Analytics context to Ask.

No route is created solely to satisfy a cross-link.

### 6. Localization and accessibility

All new interface strings are added to the established EN/ES dictionaries. Hardcoded English in touched components is removed. Authored Spanish replaces heuristic localization for touched canonical lesson content; mathematical notation is shared.

Expandable panels use buttons with `aria-expanded` and stable controlled regions. Map nodes are semantic controls with visible focus. Charts provide textual or tabular access to essential values. Every interactive control has a label. `prefers-reduced-motion` disables nonessential transitions.

### 7. Design tokens and visual language

Preserve the warm off-white/near-black base and oxblood accent. Consolidate the tokens used by Academy, formulas, code, charts and semantic states before applying visual polish. Remove touched hardcoded analytical colors and late duplicate overrides.

The visual target is a premium research notebook plus interactive textbook: controlled reading widths, fewer nested borders, deliberate white space, monospace quantitative values and serif editorial emphasis only where useful.

## Data and calculation flow

Interactive modules preserve a visible separation:

```text
observable/demo inputs
        ↓
validated framework-free quant function
        ↓
calibrated/model state
        ↓
derived measures and invariant checks
        ↓
chart, table and interpretation
```

Synthetic/open demo inputs remain clearly labelled. Licensed raw data is neither embedded nor redistributed. Provider adapters and local fallbacks remain unchanged unless an existing broken interaction requires repair.

## Failure handling

- Invalid numeric inputs are rejected at the quant-module boundary and surfaced beside the control.
- Failed or unstable calculations preserve the last valid visualization and show a concise diagnostic.
- Missing cross-link metadata omits the link instead of constructing a guessed URL.
- Unsupported 3D capability falls back to the existing 2D representation.
- Missing translation keys fail the localization audit; mixed-language UI is a release blocker.

## Migration order inside the integrated branch

1. Design tokens, typed formula metadata and formula/derivation primitives.
2. Three representative lesson migrations: Black-Scholes/volatility, curve construction/rates and measure-change or Monte Carlo.
3. Canonical Academy renderer and remaining lesson migration by track.
4. Analytics/chart consolidation and touched quant extraction.
5. Homepage knowledge map, discovery hierarchy, global search and cross-links.
6. Localization, accessibility, responsive and performance hardening.
7. Full before/after browser matrix and numerical regression validation.

Each stage is kept as a focused commit, but all stages ship through one pull request.

## Testing and validation

### Automated

- `npm run typecheck`
- `npm run lint`
- `npm run i18n:audit`
- `npm test`
- `npm run build`
- `npm run cloudflare:preflight`
- existing security checks discovered from package scripts and CI

Modified quantitative functions receive analytical reference values, invariants and boundary tests. Formula rendering tests cover collapsed and expanded states, depth levels and long-equation overflow. Search and map tests prove that every destination resolves to an existing route.

### Browser QA

Inspect the homepage, Learn landing, representative Volatility, Rates, Numerical Finance and risk/xVA lessons, and existing Analytics surfaces at 375, 768, 1280 and 1440 pixels in English and Spanish.

Validate:

- no horizontal page overflow;
- readable equations and controlled long-math scrolling;
- keyboard and pointer formula expansion;
- meaningful map focus, selection and navigation;
- linked control-to-model-to-chart behavior;
- legible axes, units, tooltips, color scales and 3D camera;
- materially reduced page density and cardification;
- no console errors.

### Release boundary

The implementation is complete only when all existing major lesson and Analytics inventories are reviewed, the full validation matrix passes and the before/after comparison demonstrates a material—not merely cosmetic—quality improvement.

Creating the pull request is an external write covered by the approved one-PR delivery choice. Merging and deploying production remain separate confirmation points under repository policy.

## Explicit exclusions

- new curriculum topics, tracks or lessons;
- new Analytics calculators or market-data providers;
- account, mastery, collaboration or saved-scenario backends;
- proprietary competitor content, terminal emulation or licensed-data redistribution;
- a second math renderer or heavyweight graph dependency without proven necessity;
- unrelated infrastructure or assistant-character redesign.

## Acceptance criteria

- Academy defaults to essentials and progressively reveals depth.
- Major existing formulas share one compact, accessible KaTeX presentation and appropriate derivation depth.
- Existing charts remain correct and become more compact, legible and consistent.
- Homepage becomes a genuine navigation layer with a real-content knowledge map and dedicated mobile flow.
- Canonical Academy content is searchable and connected to existing Analytics and Ask contexts.
- EN/ES, keyboard navigation, reduced motion and responsive layouts are preserved.
- No unnecessary content or module expansion occurs.
- All automated and browser validation passes before handoff.

