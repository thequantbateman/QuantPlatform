# Open-source attribution policy

`docs/legal/source-registry.json` is the licensing authority for external material. It distinguishes research-only references from code, assets, media, or data actually copied, adapted, embedded, or redistributed by the application.

- `npm run license:intake -- ...` creates a conservative source draft without storing a private local path.
- `npm run license:audit` validates policy decisions, evidence, affected files, and notice freshness. It is mandatory in `npm test` and Cloudflare preflight.
- `npm run license:notices` regenerates `THIRD_PARTY_NOTICES.md` from records whose current use requires public attribution.
- `/legal/third-party` renders only the safe public notice subset. Research-only references remain in the Academy bibliography and are not duplicated there.

Current pricing and learning implementations are independently written. A future change that copies or adapts external material must update the legal registry and affected paths before merge; generated notices must never be edited by hand.
