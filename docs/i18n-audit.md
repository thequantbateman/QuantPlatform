# Internationalization audit

## Architecture

- `src/i18n/index.tsx` owns the English and Spanish UI dictionary, locale state, locale-aware number/date formatting and explicit device preference.
- Locale is persisted in both `localStorage` and a one-year `SameSite=Lax; Secure` cookie. The cookie gives server-rendered metadata and `<html lang>` the active locale; browser language supplies the first device default.
- `src/content/localization.ts` localizes the typed concept catalog without duplicating presentation components.
- `src/content/academy/localization.ts` owns authored Academy metadata, formula labels and advanced-lesson Spanish, while sharing equations, Python code, identifiers and React components.
- `npm run i18n:audit` rejects dictionary-key drift between `en` and `es`.

## Coverage

Navigation, search, footer, breadcrumbs, home, Academy landing, lesson chrome, formula and derivation controls, track metadata, model-comparison chrome, source-reference chrome, Ask, analytics, volatility visualizations, Quant Lab, market workstation, prediction dashboard, research and editorial Desk use the active locale. Locale-aware metadata is generated from the persisted cookie on major routes. Labs and market components retain market-standard labels such as spot, forward, strike, delta, vega, SABR and Heston where translation would reduce professional clarity.

## Authored content boundary

- The 16 advanced Academy lessons that carry a `localized.es` payload are fully authored in Spanish.
- The 12 legacy volatility-track lessons use authored Spanish titles, subtitles, formula labels, track stages and interface chrome. Their long educational prose still uses the existing heuristic Spanish templates and phrase localization; it was not bulk rewritten in this release.
- The 13 legacy rates-track lessons use authored Spanish titles, subtitles, formula labels, lab titles and track metadata. Their remaining long lesson prose stays in the canonical English source until it receives lesson-by-lesson editorial translation.
- The older concept catalog in `src/content/localization.ts` retains its existing field-level localization strategy. It is outside the Academy lesson-authoring boundary.
- Model names, symbols, formulas, code, source titles, authors and quoted source metadata deliberately remain canonical. Only application-authored labels around them are translated.

## Intentional exceptions

- Code, Python identifiers, mathematical notation, URLs, market tickers and provider payloads remain unchanged.
- Established desk terminology may remain in English or appear alongside Spanish, including `front office`, `spot`, `forward`, `strike`, `smile`, `skew`, `carry`, `roll-down`, `moneyness`, `vega`, `vanna`, `volga`, `SABR` and `Heston`.
- External market-event titles and raw provider statuses are not translated because they are third-party data rather than application-authored UI.
- Quantitative code, formulas and provider status identifiers remain stable across languages so examples, logs and source references are reproducible.
- Remaining hardcoded English inside untouched legacy lesson prose and untouched lab implementations is content debt, not missing interface chrome. It must be translated through authored lesson payloads rather than a global string-replacement pass.

## Verification

- `npm run i18n:audit` verifies exact dictionary-key parity.
- Production browser QA samples 375px, 768px, 1280px and 1440px, with authored Spanish spot checks for home, search, formula labels, lesson metadata, model comparison and volatility-surface controls.
- Spanish rendering is checked for document language, route metadata, horizontal overflow and clipped controls.
