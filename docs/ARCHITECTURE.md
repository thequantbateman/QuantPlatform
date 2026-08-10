# Architecture

Routes compose domain components; components call typed content, provider and quant modules. The quant engine has no browser or React dependencies. Provider interfaces isolate demo data from future server integrations. Charts use local Canvas renderers so no heavy visualization code is loaded globally. Static content routes are generated from the typed catalog.

The current MVP stores no user data. Future persistence belongs behind server-owned repositories and declared Sites D1/R2 bindings, not ad-hoc browser storage. Theme and locale are device-local preferences.

`src/i18n` owns locale state and UI dictionaries. `src/content/localization.ts` localizes typed educational entries. Neither layer may leak into `src/quant`.

Quant visualization primitives live in `src/components/charts`; labs compose them without duplicating chart formatting. The contextual assistant reads serialized lab context from the presentation layer and never mutates pricing inputs.
