# Interactive Surface System Design

## Purpose

Unify the platform's interactive Academy and Analytics surfaces with the established black, warm-ivory, and burnt-orange identity. The change removes disconnected structural navy blocks while preserving quantitative calculations, routes, content, interaction contracts, chart meaning, and the existing Bloomberg-like editorial character.

## Scope

- Normalize shared page, panel, control, plot, active, and overlay surfaces in light and dark themes.
- Migrate Academy track grids, formula/derivation presentation, concept labs, volatility surfaces, rates labs, advanced labs, and the chart containers they share.
- Align Analytics portfolio, payoff-strategy, Greeks, hedging, and market-making surfaces only where they bypass the canonical surface hierarchy.
- Preserve semantic series colors and heatmap/3D palettes when color communicates data.
- Update the canonical design documentation and permanent agent guidance.
- Validate representative routes in English and Spanish, both themes, and widths 375, 768, 1280, and 1440 pixels.

## Non-goals

- No new Academy lessons, Analytics modules, quantitative models, datasets, or dependencies.
- No route, navigation, content-schema, pricing, calibration, scenario, or state-management changes.
- No redesign of the global black/orange shell, typography, character system, or chart semantics.
- No blanket removal of blue when it is an intentional data series or heat-scale value.
- No component-by-component palette fork or broad unrelated CSS rewrite.

## Current-state audit

### Already consistent — keep

- The global page shell, near-black dark theme, warm editorial light theme, thin rules, serif display copy, monospace measurements, and burnt-orange actions.
- Portfolio and strategy shells that consume `--paper-*`, `--surface-*`, `--border`, and chart aliases.
- Existing positive, negative, gold, series, and heatmap colors used to encode quantitative meaning.
- High-contrast code, terminal, raw diagnostic, and data-table areas where contrast is functional.

### Shared structural inconsistency — migrate

- `--academy-chart-surface`, `--academy-chart-panel`, and `--academy-chart-selected` are fixed navy values and remain navy in light mode.
- `.track-path a.deep`, `.academy-vol-lab`, `.vol-concept-lab`, `.advanced-lab`, `.rates-curve-lab`, and rates-specific variants use those fixed colors or redefine raw navy values locally.
- Canvas consumers correctly read Academy chart variables, but the variables currently describe a palette rather than semantic roles.

### Minor refinement — compact, do not rebuild

- Formula and derivation containers already use semantic surfaces. They need a clearer parent/child relationship and quieter optional-detail hierarchy, not a new rendering system.
- Shared Analytics panels should inherit the same hierarchy where any remaining local override creates a disconnected block.

## Surface architecture

The canonical hierarchy is:

1. `--paper`: page canvas.
2. `--surface-elevated`: primary editorial section.
3. `--surface-interactive`: interactive workbench shell.
4. `--surface-inset`: controls, metadata, and subordinate regions.
5. `--surface-plot`: charts, heatmaps, matrices, and graphical output.
6. `--surface-active`: selected tabs, stages, and active rows.
7. `--surface-overlay`: tooltips and compact floating readouts.

Supporting roles:

- `--border` for ordinary structure and `--border-strong` for active/plot boundaries.
- `--accent` and `--accent-strong` for action, focus, sequence, and state.
- `--accent-soft` for a restrained active wash without inventing a new hue.
- `--ink`, `--muted`, and `--graphite` for text hierarchy.

The existing `--academy-chart-*` variables remain stable compatibility aliases for canvas and chart consumers. Structural Academy aliases resolve to the semantic surface and border roles above. Heat and series variables remain explicit data colors.

### Dark theme

- Page: near black.
- Elevated: espresso/charcoal.
- Interactive: neutral charcoal distinct from the page without blue bias.
- Inset and plot: deeper neutral graphite with visible but restrained boundaries.
- Active: slightly lighter warm graphite, optionally mixed with the orange accent.
- Overlay: opaque charcoal for legible tooltips.

### Light theme

- Page: warm ivory.
- Elevated: pale parchment.
- Interactive: warm stone.
- Inset and plot: quiet warm gray/cream, darker only enough to establish hierarchy.
- Active: warm accent wash with dark text.
- Overlay: dark espresso with ivory text where a floating readout needs strong contrast.

## Component migration

### Academy tracks

- Keep the existing stage-grid layout, order, numbering, arrows, and focus behavior.
- Replace navy stage backgrounds with `--surface-interactive` and active/deep stages with `--surface-active`.
- Keep orange sequence numbers, arrows, and action text.
- Preserve empty grid space and accordion behavior; do not cardify the layout.

### Shared labs

- Map lab shells to `--surface-interactive`, controls to `--surface-inset`, and chart output to `--surface-plot`.
- Keep controls integrated with the workbench and preserve the current desktop control/output split and mobile controls-first stacking.
- Remove local redefinitions of `--ink`, `--muted`, and `--border` when canonical tokens already express the role.
- Preserve tabs, sliders, selections, keyboard behavior, reduced-motion behavior, chart data, and numerical fallbacks.

### Formula and derivation

- Keep the existing KaTeX renderer, formula disclosure contract, ARIA bindings, and same-page derivation.
- Use the editorial elevated surface for the formula and a subordinate inset surface for expanded derivation steps.
- Keep critical formula content visible and optional mathematics disclosed.
- Maintain controlled horizontal scrolling for long mathematics at 375 pixels.

### Analytics

- Preserve portfolio, strategy, Greeks, hedging, and market-making functionality and their existing black/orange presentation.
- Replace only structural navy or independently hardcoded cool panels with canonical surfaces.
- Preserve semantically meaningful series colors, gain/loss colors, risk colors, heatmaps, and payoff geometry.

### High-contrast exceptions

Terminal, code, raw JSON, diagnostic output, and dense numerical inspection regions may remain high contrast. They still use documented code or plot roles and may not become a second general-purpose page theme.

## Responsive and accessibility behavior

- 1440/1280: workbenches retain their full hierarchy without oversized empty chrome.
- 768: controls stack before output; stage grids reduce columns; plot containers remain readable.
- 375: no document-level horizontal overflow; long mathematics scrolls inside its region; interactive targets remain at least 44 pixels where touch-facing.
- Both themes must retain WCAG AA text contrast for normal body and control text.
- Existing focus-visible rings remain two pixels and must be verified from computed styles after late CSS overrides.
- Selection cannot be color-only: existing text, pressed/selected state, borders, and labels remain.
- Reduced motion disables autoplay and decorative transitions while manual controls remain available.

## Quantitative and behavioral preservation

- No changes to `src/quant/` calculations, scenario semantics, conventions, units, interpolation, curve construction, Greeks, payoff functions, or hedging logic.
- No change to component public props or route/query contracts unless a failing visual-accessibility test proves a minimal change necessary.
- Canvas plots continue to consume the established Academy chart aliases; only the theme-resolved values change.

## Documentation and permanent rules

- `docs/DESIGN_SYSTEM.md` remains the single canonical design source and documents the semantic surface hierarchy.
- `docs/QUANT_VISUALIZATION.md` must no longer prescribe a navy analytical stage; it references the canonical surface hierarchy and reserves color for data meaning.
- `AGENTS.md` gains a compact permanent contract: preserve the black/orange identity, use semantic surfaces, prohibit fixed structural navy, preserve data colors, validate both themes and representative responsive routes, and run the detector once after frontend edits.

## Test-first acceptance

1. Add a focused executable design-contract test that reads computed CSS structure through the real stylesheet and catches:
   - missing semantic surface roles;
   - Academy structural aliases that remain fixed navy instead of semantic;
   - local concept/rates lab palette redefinitions;
   - deep stage tiles bypassing semantic surfaces;
   - missing light-theme surface definitions.
2. Observe the test fail on the current stylesheet before production edits.
3. Implement the minimum token and selector migration required to make it pass.
4. Run focused design, component, chart, and rendered-route tests.
5. Run `npm run typecheck`, `npm run lint`, `npm run i18n:audit`, `npm test`, `npm run build`, and `npm run cloudflare:preflight`.
6. Run the Impeccable detector once against changed frontend targets and resolve material findings.
7. Browser-check representative Academy probability/Girsanov, volatility surface, rates, Greeks, portfolio, strategy, and market-making routes at 375/768/1280/1440 in light/dark; spot-check Spanish copy without changing content.

## Release

After all gates pass and the branch is clean, follow the repository's solo-developer release policy: merge into local `main`, push canonical `origin/main`, deploy with `npm run deploy:cloudflare`, and verify `https://thequantbateman.com` plus representative Academy and Analytics routes. Stop on any failed validation, target mismatch, authentication failure, deployment error, or unhealthy production response.
