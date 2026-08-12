# Academy lesson content model

The canonical schema is `AcademyLesson` in `src/content/academy/types.ts`.

## Identity and discovery

- `id`, `slug`, `title`, `subtitle`
- `domain`, `assetClass`, `level`
- `prerequisites`, `learningObjectives`, `tags`
- `estimatedMinutes`, `lastReviewed`

The four depth labels are `foundation`, `intermediate`, `advanced` and `front-office`. They describe expected depth; they do not create duplicated lesson variants.

## Educational sections

- `intuition`: mental model before equations
- `marketContext`: why the market needs the concept, instruments and quote convention
- `mathematics`: notation and formula objects rendered with KaTeX
- `derivation`: ordered steps, equations and numerical checks
- `pricing`: method, calibration and limitations
- `implementation`: architecture, optional current QuantLib note and modern Python lab
- `interactiveLabs`: stable lab identifiers rather than embedded components
- `frontOffice`: inputs, calibration, risk, workflow and production failures
- `macroConnections`: lightweight transmission graph
- `pitfalls`, `references`, `relatedLessonIds`

## Authoring rules

- Rates and volatilities are decimal values in code; display conversions are explicit.
- Formula claims include their assumptions and conventions.
- Python examples are original, typed where useful, deterministic and include sanity checks.
- Synthetic visuals must say `SYNTHETIC / EDUCATIONAL` in visible UI.
- A reference identifies the registry source plus an exact lecture, file or implementation area.
- External material is research input. Do not paste PDFs, prose or monolithic scripts.
- Related lessons use stable IDs and preserve existing concept routes when a deep lesson does not yet exist.
