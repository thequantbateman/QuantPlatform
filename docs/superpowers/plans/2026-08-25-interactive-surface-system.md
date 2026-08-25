# Interactive Surface System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace disconnected structural navy surfaces with one theme-aware neutral interactive hierarchy while preserving the platform's black/orange identity and all quantitative behavior.

**Architecture:** Extend the existing root token system with semantic interactive, plot, active, overlay, border, and accent-wash roles. Keep `--academy-chart-*` as compatibility aliases for canvas/chart consumers, migrate shared CSS owners instead of individual pages, and protect the contract with focused executable stylesheet tests plus route/browser validation.

**Tech Stack:** React 19, TypeScript 5.9, CSS custom properties, Node `node:test`, vinext/Vite, Cloudflare Workers.

**Spec:** `docs/superpowers/specs/2026-08-25-interactive-surface-system-design.md`

## Global Constraints

- Preserve the black, warm-ivory, and burnt-orange visual identity.
- Do not change routes, content schemas, quantitative calculations, state contracts, or chart data semantics.
- Do not add dependencies, Academy lessons, Analytics modules, or local page palettes.
- Blue may remain only where it encodes data; fixed structural navy is prohibited.
- Preserve EN/ES, light/dark, keyboard, reduced-motion, and 375/768/1280/1440 behavior.
- Use `docs/DESIGN_SYSTEM.md` as the canonical design source.

---

### Task 1: Protect the semantic surface contract

**Files:**
- Modify: `tests/chart-consumers.test.tsx`

**Interfaces:**
- Consumes: the real `app/globals.css` stylesheet and existing `node:test` harness.
- Produces: a regression contract that fails when semantic surface roles or theme mappings disappear, or shared Academy owners restore raw structural navy.

- [ ] **Step 1: Write the failing stylesheet behavior test**

Add one test that names the visual regression it catches:

```tsx
test("Academy and Analytics structural surfaces inherit the theme-aware neutral hierarchy", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const darkRoot = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const lightRoot = css.match(/:root\[data-theme="light"\] \{([\s\S]*?)\n\}/)?.[1] ?? "";

  for (const token of ["interactive", "plot", "active", "overlay"]) {
    assert.match(darkRoot, new RegExp(`--surface-${token}\\s*:`), `dark --surface-${token}`);
    assert.match(lightRoot, new RegExp(`--surface-${token}\\s*:`), `light --surface-${token}`);
  }
  assert.match(darkRoot, /--border-strong\s*:/);
  assert.match(darkRoot, /--accent-soft\s*:/);
  assert.match(darkRoot, /--academy-chart-surface:\s*var\(--surface-plot\)/);
  assert.match(darkRoot, /--academy-chart-panel:\s*var\(--surface-interactive\)/);
  assert.match(darkRoot, /--academy-chart-selected:\s*var\(--surface-active\)/);

  const owners = ["advanced-lab", "vol-concept-lab", "rates-curve-lab"];
  for (const owner of owners) {
    const block = css.match(new RegExp(`\\.${owner} \\{([^}]*)\\}`))?.[1] ?? "";
    assert.doesNotMatch(block, /--(?:ink|muted|border)\s*:\s*#/i, `${owner} must inherit primitive theme roles`);
  }

  const deepStages = [...css.matchAll(/\.track-path a\.deep[^\{]*\{([^}]*)\}/g)].map((match) => match[1]).join("\n");
  assert.match(deepStages, /background:\s*var\(--surface-active\)/);
  assert.doesNotMatch(deepStages, /background:\s*#(?:151a22|1b2331|202834)/i);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --import tsx --test tests/chart-consumers.test.tsx
```

Expected: FAIL because `--surface-interactive`, `--surface-plot`, `--surface-active`, and `--surface-overlay` do not exist and Academy aliases still point to raw navy values.

- [ ] **Step 3: Keep the test failure evidence and do not edit production CSS yet**

Confirm the failure is an assertion against the missing semantic hierarchy, not a syntax/import error.

---

### Task 2: Implement and migrate the shared surface hierarchy

**Files:**
- Modify: `app/globals.css`
- Test: `tests/chart-consumers.test.tsx`

**Interfaces:**
- Consumes: stable primitive tokens and every current `--academy-chart-*` consumer.
- Produces: `--surface-interactive`, `--surface-plot`, `--surface-active`, `--surface-overlay`, `--border-strong`, and `--accent-soft`; compatibility aliases remain unchanged by name.

- [ ] **Step 1: Add canonical dark and light surface roles**

Extend the root tokens with neutral roles using the approved palette:

```css
:root {
  --surface-elevated: var(--paper-strong);
  --surface-interactive: #181714;
  --surface-inset: #1d1b18;
  --surface-plot: #11110f;
  --surface-active: #28231e;
  --surface-overlay: #171513;
  --border-strong: #403b35;
  --accent-soft: color-mix(in srgb, var(--accent) 12%, var(--surface-interactive));
}

:root[data-theme="light"] {
  --surface-elevated: var(--paper-strong);
  --surface-interactive: #eee7dc;
  --surface-inset: #e8e1d6;
  --surface-plot: #f7f2ea;
  --surface-active: #e3d4c5;
  --surface-overlay: #f4eee5;
  --border-strong: #b8aa98;
  --accent-soft: #ead7c8;
}
```

- [ ] **Step 2: Convert Academy structural chart tokens into semantic aliases**

Keep data heat/series tokens unchanged, but map structure and text to theme-aware roles:

```css
--academy-chart-ink: var(--ink);
--academy-chart-muted: var(--muted);
--academy-chart-grid: var(--border);
--academy-chart-border-strong: var(--border-strong);
--academy-chart-control-border: var(--border-strong);
--academy-chart-surface: var(--surface-plot);
--academy-chart-panel: var(--surface-interactive);
--academy-chart-selected: var(--surface-active);
--academy-chart-tab-ink: var(--ink);
--academy-chart-legend-text: var(--muted);
--academy-chart-legend-value: var(--ink);
--academy-chart-cell-edge: color-mix(in srgb, var(--border-strong) 70%, transparent);
--academy-chart-mesh-line: color-mix(in srgb, var(--ink) 24%, transparent);
--academy-chart-legend-bg: color-mix(in srgb, var(--surface-overlay) 92%, transparent);
```

Do not change `--academy-chart-heat-*`, positive/negative, or established series tokens.

- [ ] **Step 3: Migrate shared Academy owners**

Update only the shared owner blocks and their descendants:

- `.track-path a.deep` and rates deep stages → `--surface-active`; hover → `--accent-soft`.
- `.academy-vol-lab`, `.vol-concept-lab`, `.advanced-lab` → `--surface-interactive` shell, `--surface-inset` controls, `--surface-plot` chart/output.
- `.rates-curve-lab` → inherit primitives and keep only rates series/accent aliases.
- Formula shell → `--surface-elevated`; expanded derivation → `--surface-inset`; preserve disclosure DOM/ARIA and overflow.
- Remove raw local `--ink`, `--muted`, `--border`, navy background, and navy border declarations from those owners.
- Keep intentional quantitative tints in `kind-information`, `kind-measure`, `kind-market`, `kind-risk`, heatmaps, and series lines only when they encode node/data meaning.

- [ ] **Step 4: Align shared Analytics owners without changing their black/orange design**

Inspect `.portfolio-*`, `.strategy-*`, `.analytics-*`, and `.mm-*`. Replace only remaining cool structural fills with `--surface-interactive`, `--surface-inset`, `--surface-plot`, or `--surface-active`. Preserve all data series, gain/loss, heatmap, risk, payoff, and state colors.

- [ ] **Step 5: Run focused GREEN tests**

Run:

```bash
node --import tsx --test tests/chart-consumers.test.tsx tests/academy-components.test.tsx tests/analytics-components.test.tsx
```

Expected: PASS with the new surface contract and all existing chart/accessibility/component contracts intact.

- [ ] **Step 6: Commit the tested implementation**

```bash
git add app/globals.css tests/chart-consumers.test.tsx
git commit -m "refactor: unify interactive surface hierarchy"
```

---

### Task 3: Make the visual contract permanent

**Files:**
- Modify: `docs/DESIGN_SYSTEM.md`
- Modify: `docs/QUANT_VISUALIZATION.md`
- Modify: `docs/academy/visual-labs.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the semantic roles implemented in Task 2.
- Produces: one canonical human design reference plus a concise permanent agent execution contract.

- [ ] **Step 1: Update the canonical design system**

Document the seven-level hierarchy, the rule that Academy chart names are compatibility aliases, and the distinction between structural surfaces and semantic data colors. State that dark uses neutral charcoal/espresso and light uses warm ivory/stone.

- [ ] **Step 2: Remove contradictory navy guidance**

In `docs/QUANT_VISUALIZATION.md` and `docs/academy/visual-labs.md`, replace “navy analytical stage” language with a reference to `docs/DESIGN_SYSTEM.md`. Explicitly reserve blue/cyan and heat scales for data meaning rather than structural containers.

- [ ] **Step 3: Add the permanent agent contract**

Append a compact section under UI conventions in `AGENTS.md`:

```markdown
### Interactive surface contract

- Preserve the black/orange editorial identity; do not introduce structural navy or a parallel page palette.
- Use `--paper`, `--surface-elevated`, `--surface-interactive`, `--surface-inset`, `--surface-plot`, `--surface-active`, and `--surface-overlay` by semantic role.
- Keep `--academy-chart-*` as compatibility aliases. Data colors may be blue/cyan only when they encode a series, heat value, risk state, or other quantitative meaning.
- Shared Lab, Academy, and Analytics owners must inherit theme primitives instead of redefining raw `--ink`, `--muted`, or `--border` colors.
- After frontend visual changes, run the Impeccable detector once, then verify light/dark at 375, 768, 1280, and 1440 pixels on representative Academy and Analytics routes.
```

- [ ] **Step 4: Check documentation consistency and commit**

Run:

```bash
rg -n "navy analytical stage|restrained navy|structural navy" docs AGENTS.md
git diff --check
```

Expected: no live guidance recommends navy structural containers; references that prohibit structural navy are allowed. Then commit:

```bash
git add AGENTS.md docs/DESIGN_SYSTEM.md docs/QUANT_VISUALIZATION.md docs/academy/visual-labs.md
git commit -m "docs: codify semantic interactive surfaces"
```

---

### Task 4: Validate, review, release, and verify production

**Files:**
- Modify only if validation exposes an in-scope defect.

**Interfaces:**
- Consumes: the complete feature branch.
- Produces: a validated `main`, canonical GitHub update, Cloudflare Worker deployment, and production evidence.

- [ ] **Step 1: Run the frontend detector once**

```bash
node /Users/alejandrogarciamunoz/.agents/skills/impeccable/scripts/detect.mjs --json app/globals.css src/components/academy/AcademyLanding.tsx src/components/academy/AcademyComponents.tsx src/components/academy/VolSurfaceLab.tsx src/components/academy/RatesCurveLab.tsx src/components/academy/AdvancedConceptLab.tsx src/components/analytics/PortfolioGreeksLab.tsx src/components/analytics/StrategyPayoffLab.tsx src/components/labs/MarketMakingLab.tsx
```

Resolve only material findings within the approved surface scope.

- [ ] **Step 2: Run the automated release gates**

```bash
npm run typecheck
npm run lint
npm run i18n:audit
npm test
npm run build
npm run cloudflare:preflight
git diff --check
```

Expected: every command exits 0 with no test failures.

- [ ] **Step 3: Run browser QA in one batched pass**

Start the local production build and inspect:

- `/learn`
- `/learn/foundations/girsanov-risk-neutral-pricing`
- `/learn/volatility/volatility-surface`
- `/learn/rates/yield-curve-construction`
- `/learn/risk/first-order-greeks`
- `/analytics/portfolio`
- `/analytics/strategies`
- `/lab?lab=market-making`

At 375, 768, 1280, and 1440 pixels, check both themes for document overflow, surface hierarchy, 44-pixel touch targets, visible focus, formula scrolling, controls-first mobile order, chart readability, and retained data colors. Spot-check Spanish via the locale control/cookie. Verify computed focus styles after the final CSS cascade.

- [ ] **Step 4: Perform final diff review and commit any QA fixes**

Compare the final branch to `690f5f5`, confirm no `src/quant/` or route behavior changed, and commit only necessary QA fixes.

- [ ] **Step 5: Merge and verify the merged result**

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff codex/interactive-surface-system
npm test
npm run build
```

Stop if the merge or either merged-result validation fails.

- [ ] **Step 6: Push, deploy, and verify production**

```bash
git remote -v
git push origin main
npm run deploy:cloudflare
```

Then verify `https://thequantbateman.com`, `/learn`, `/learn/foundations/girsanov-risk-neutral-pricing`, `/analytics/portfolio`, `/analytics/strategies`, and `/lab?lab=market-making` return healthy responses and show the new neutral surface hierarchy. Stop and report exact evidence on any remote, authentication, deployment, or health failure.
