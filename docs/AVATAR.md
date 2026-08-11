# Quant Bateman integration

The active character architecture is documented in:

- `docs/design/quant-bateman-assistant.md` — product behavior, state machine, canonical asset map, dragging, Ask integration, accessibility and extension guides.
- `docs/design/quant-bateman-rive.md` — current runtime assessment and the authored `.riv` migration contract.

The stable product states are `idle | thinking | fetching | working | pricing | talking | success | warning | error | easterEgg`. Pages call `useQuantBateman()`; they do not select images or control renderer internals.

Approved PNG originals live under `public/characters/quant-bateman/source`. Do not regenerate, reinterpret or replace them without owner approval.
