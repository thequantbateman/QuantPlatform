# Design System

The flagship theme is dark, with a complete light override. The system is compact, editorial and institutional: espresso-black surfaces, warm ivory text, restrained burnt orange, monospace metadata, serif explanatory text and thin structural rules.

Core tokens are CSS custom properties in `app/globals.css`. Ownership is intentionally singular: one canonical `:root` defines the flagship dark theme and one `:root[data-theme="light"]` overrides it. Existing aliases such as `--paper`, `--paper-strong`, `--surface-elevated`, `--ink`, `--graphite`, `--muted`, `--border`, `--accent`, `--accent-strong`, `--gold`, `--positive`, `--negative`, `--focus-ring` and `--shadow` remain stable for consumers. Analytical surfaces use the `--academy-chart-*` family; code blocks use `--code-*`. Components should not introduce duplicate root ownership or raw replacements for these semantic roles.

Active states must be explicit. Controls need labels, a visible two-pixel focus indicator and a minimum 44px interactive target where the control is compact or touch-facing. Muted text must maintain at least WCAG AA contrast against its intended surface. Simulated data is labelled.

Responsive acceptance is checked at 375px, 768px, 1280px and 1440px. At 768px and below, the home knowledge map becomes a vertical list and Academy lab controls precede output. Long mathematics scrolls within its formula region; it must never widen the lesson column or page. The volatility surface opens in heatmap mode, with 3D available only after an explicit selection.

Motion is subtle and explanatory. Under `prefers-reduced-motion: reduce`, CSS animation and autoplay stop, while manual sliders, scenario selection and camera controls remain operable.
