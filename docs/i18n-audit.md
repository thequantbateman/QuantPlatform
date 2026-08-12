# Internationalization audit

## Architecture

- `src/i18n/index.tsx` owns the English and Spanish UI dictionary, locale state, locale-aware number/date formatting and explicit device preference.
- Locale is persisted in both `localStorage` and a one-year `SameSite=Lax; Secure` cookie. The cookie gives server-rendered metadata and `<html lang>` the active locale; browser language supplies the first device default.
- `src/content/localization.ts` localizes the typed concept catalog without duplicating presentation components.
- `src/content/academy/localization.ts` localizes the structured volatility curriculum while sharing equations, Python code, identifiers and React components.
- `npm run i18n:audit` rejects dictionary-key drift between `en` and `es`.

## Coverage

Navigation, search, footer, breadcrumbs, home, Academy landing, concept catalog, structured volatility lessons, Ask, analytics, volatility visualizations, Quant Lab, market workstation, prediction dashboard, research and editorial Desk use the active locale. Locale-aware metadata is generated from the persisted cookie on major routes. Labs and market components retain market-standard labels such as spot, forward, strike, delta, vega, SABR and Heston where translation would reduce professional clarity.

## Intentional exceptions

- Code, Python identifiers, mathematical notation, URLs, market tickers and provider payloads remain unchanged.
- Established desk terminology may remain in English or appear alongside Spanish, including `front office`, `spot`, `forward`, `strike`, `smile`, `skew`, `carry`, `roll-down`, `moneyness`, `vega`, `vanna`, `volga`, `SABR` and `Heston`.
- External market-event titles and raw provider statuses are not translated because they are third-party data rather than application-authored UI.
- Quantitative code, formulas and provider status identifiers remain stable across languages so examples, logs and source references are reproducible.

## Verification

- `npm run i18n:audit` verifies exact dictionary-key parity.
- Production browser QA samples both locales at 375px, 768px, 1280px and 1440px.
- Spanish rendering is checked for document language, route metadata, horizontal overflow and clipped controls.
