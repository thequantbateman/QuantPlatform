# Academy source registry

The Academy registry in `src/content/academy/sources.ts` records scholarly roles, locators, and public original-source links. `docs/legal/source-registry.json` is the authority for licensing evidence, permitted use, and public-attribution placement.

| ID | Source | Academic role | Current use |
|---|---|---|---|
| `oosterlee-grzelak-2020` | *Mathematical Modeling and Computation in Finance* | Research and independent validation | Curriculum mapping, notation review, and numerical cross-checking; no book content is distributed |
| `grzelak-computational-finance` | LechGrzelak/Computational-Finance-Course | Research | Volatility progression, numerical experiments, and Heston curriculum mapping |
| `grzelak-ir-xva` | LechGrzelak/FinancialEngineering_IR_xVA | Research | Rates, curves, and xVA dependency mapping |
| `grzelak-quantlib-fork` | LechGrzelak/QuantLib | Historical implementation reference | Architecture context only; not current API authority |
| `quantlib-upstream` | lballabio/QuantLib | Current implementation reference | Independent validation against current public implementation and tests |

Learner pages show only compact academic references where they improve further study. They do not repeat legal metadata. Any future copied, adapted, embedded, or redistributed material must first pass the intake and audit workflow documented in `docs/legal/README.md`.
