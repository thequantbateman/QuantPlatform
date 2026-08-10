# Architecture

Routes compose domain components; components call typed content, provider and quant modules. The quant engine has no browser or React dependencies. Provider interfaces isolate demo data from future server integrations. Charts use local Canvas renderers so no heavy visualization code is loaded globally. Static content routes are generated from the typed catalog.

The current MVP stores no user data. Future persistence belongs behind server-owned repositories and declared Sites D1/R2 bindings, not ad-hoc browser storage. Theme is the only device-local preference.
