# Architecture

Routes compose domain components; components call typed content, provider and quant modules. The product has two first-class cores: Education and Markets/Intelligence, bridged by deterministic Analytics and the tool-first assistant. The quant engine has no browser or React dependencies. Provider interfaces isolate demo, reference, public and licensed environments. Charts use local Canvas renderers so no heavy visualization code is loaded globally. Static content routes are generated from the typed catalog.

Observed-data path: browser → same-origin API gateway → official public or licensed server provider → normalized data passport → UI. Calculated-data path: typed input → local quant engine → model output with assumptions. These paths never silently merge. AI receives resolved evidence after those systems and is not an authority for prices or calculations.

The current MVP stores no user data. Prediction-market persistence belongs behind server-owned repositories and the declared Cloudflare D1 binding, not ad-hoc browser storage. Theme and locale are device-local preferences.

`src/i18n` owns locale state and UI dictionaries. `src/content/localization.ts` localizes typed educational entries. Neither layer may leak into `src/quant`.

Quant visualization primitives live in `src/components/charts`; labs compose them without duplicating chart formatting. The contextual assistant reads serialized lab context from the presentation layer and never mutates pricing inputs. Its authority order is quant engine, market providers, Polymarket gateway, reviewed Learn corpus, then optional language-model explanation.
