# Design System

The flagship theme is dark, with a complete light override. The system is compact, editorial and institutional: espresso-black surfaces, warm ivory text, restrained burnt orange, monospace metadata, serif explanatory text and thin structural rules.

Core tokens are CSS custom properties in `app/globals.css`. Ownership is intentionally singular: one canonical `:root` defines the flagship dark theme and one `:root[data-theme="light"]` overrides it. Existing aliases such as `--paper`, `--paper-strong`, `--ink`, `--graphite`, `--muted`, `--accent`, `--accent-strong`, `--gold`, `--positive`, `--negative`, `--focus-ring` and `--shadow` remain stable for consumers.

Interactive depth has one canonical, theme-aware hierarchy:

- `--paper`: page canvas;
- `--surface-elevated`: editorial cards and formula shells;
- `--surface-interactive`: analytical workbenches and lab shells;
- `--surface-inset`: controls, readouts and secondary panels inside a workbench;
- `--surface-plot`: plots, grids and data-dense canvases;
- `--surface-active`: selected states and emphasized structural cells;
- `--surface-overlay`: tooltips, popovers and floating analytical details;
- `--border` and `--border-strong`: structural separation;
- `--accent-soft`: low-emphasis orange selection and hover state.

Academy `--academy-chart-*` variables are compatibility aliases over this hierarchy, not an independent palette. Structural surfaces must stay neutral, warm and theme-aware. Blue, cyan and heat colors are reserved for data series, risk states and quantitative encodings; they must not color generic containers, cards, grids or selected navigation states. Formula shells use elevated surfaces, derivations use inset surfaces, lab shells use interactive surfaces, controls use inset surfaces and charts use plot surfaces. Code blocks retain their dedicated `--code-*` exception. Components must not introduce duplicate root ownership or raw replacements for semantic roles.

Active states must be explicit. Controls need labels, a visible two-pixel focus indicator and a minimum 44px interactive target where the control is compact or touch-facing. Muted text must maintain at least WCAG AA contrast against its intended surface. Simulated data is labelled.

Responsive acceptance is checked at 375px, 768px, 1280px and 1440px. At 768px and below, the home knowledge map becomes a vertical list and Academy lab controls precede output. Long mathematics scrolls within its formula region; it must never widen the lesson column or page. The volatility surface opens in heatmap mode, with 3D available only after an explicit selection.

Motion is subtle and explanatory. Under `prefers-reduced-motion: reduce`, CSS animation and autoplay stop, while manual sliders, scenario selection and camera controls remain operable.
