# Book-integrated Academy design

## Outcome

Use *Mathematical Modeling and Computation in Finance* (Oosterlee and Grzelak, 2020) as a private academic reference to improve the existing Academy without shipping the PDF, copying its prose/code/figures, or rebuilding the product. The Academy should read as a coherent quant curriculum: concise at first glance, rigorous on demand, interactive where state changes clarify the mathematics, and explicit about market conventions and implementation limits.

## Evidence and scope

The complete PDF structure was extracted before implementation: front matter, 15 textbook chapters, references/index, and a 735-page code supplement. The current platform was mapped against all six Academy tracks, 41 canonical lessons, 114 legacy concepts, formula/derivation components, labs, source registry, and EN/ES localization.

This release prioritizes the dependency chain that the book exposes as structurally incomplete:

1. distributions, expectations, moments, and characteristic functions;
2. Brownian motion, quadratic variation, stochastic integration, and Itô calculus;
3. geometric Brownian motion and physical versus risk-neutral asset dynamics;
4. Black–Scholes replication, PDE, Feynman–Kac, closed form, and delta hedging.

Advanced jump, hybrid, stochastic-local-volatility, LMM, and cross-currency topics remain mapped for later phases. They are not added merely because they occur in the book.

## Content architecture

### Source traceability

Persistent development records live under `docs/academy/book-integration/`:

- `overview.md`: ingestion facts, copyright boundary, and release policy;
- `book-coverage.md`: chapter-by-chapter coverage ledger;
- `academy-gap-analysis.md`: quality/gap/action scoring;
- `source-map.md`: book section to Academy mapping and classification;
- `implementation-progress.md`: resumable release checkpoints.

The textbook is registered as a copyrighted research source. Lessons reference chapters/sections/page ranges while retaining original platform prose and modern implementations.

### Narrative profiles

The content schema gains a lesson narrative profile rather than forcing all topics through the same headings. Profiles preserve the existing lesson fields and components while changing emphasis and section language:

- `foundation`: experiment → definition → construction → pricing link;
- `classical-derivation`: contract → replication → PDE/expectation → solution → hedge;
- `instrument`: cash flows → quote → valuation → sensitivities → lifecycle;
- `model`: dynamics → parameter effects → calibration → computation → limitations;
- `numerical-method`: target → algorithm → convergence → implementation → diagnostics;
- `risk-workflow`: exposure → scenarios → aggregation → hedge → governance.

Critical intuition, market context, mathematics, and interactive content remain visible. Long Python, macro, pitfalls, and sources remain progressively disclosed. Existing formula derivations stay inline and collapsed by default.

### Learning graph

Prerequisites become explicit lesson concepts rather than repeated placeholders. The foundations track is extended at its beginning:

`Probability → Brownian motion & Itô → GBM and P/Q dynamics → Black–Scholes → Filtrations → Conditional expectation → Measure change → Girsanov → Forward measures`

Direct entry to advanced lessons remains possible. Related links point backward to prerequisites and forward to the first dependent model.

## New canonical lessons

Only four additions are justified:

1. **Distributions, moments and characteristic functions** — prerequisite for Monte Carlo, transforms, affine models, and calibration diagnostics.
2. **Brownian motion and Itô calculus** — closes the gap between probability language and stochastic pricing dynamics; includes path/quadratic-variation interpretation.
3. **GBM and physical versus pricing dynamics** — separates estimation under P from valuation under Q and prepares measure change.
4. **Black–Scholes from replication to expectation** — unifies contract, hedge, PDE, Feynman–Kac, closed form, and limitations in one classical derivation.

Legacy routes for overlapping shallow pages resolve to these canonical lessons where safe. Existing engines and labs are reused; no second pricing or simulation engine is introduced.

## Content quality rules

- Every formula defines notation, units, assumptions, parameter response, and financial meaning.
- Derivations explain the transformation that carries the educational insight; no unexplained “after some algebra.”
- Python is Python 3 with deterministic examples, explicit checks, and no copied textbook code.
- P and Q, discounting, dividends, numeraire, day count, and quote conventions are named when relevant.
- Front-office sections state observable inputs, calibration objects, hedge risks, workflow, and production failure modes without inventing conventions.
- English and Spanish payloads are authored together; mathematics and Python remain shared.

## Interaction design

Reuse the existing advanced labs:

- probability and conditional expectation use the filtration/expectation explorer;
- Brownian motion, Itô, and GBM use the simulation-schemes explorer;
- Black–Scholes uses the existing Greeks/hedging and vanilla analytics paths.

The lesson explains what each control changes in the model and which invariant to check. Axes retain explicit financial units. No copied figure, decorative interaction, WebGL dependency, or new chart library is added.

## Validation

- Content contracts: route uniqueness, source resolution, prerequisite resolution, localized parity, narrative-profile coverage.
- Mathematical checks: distribution normalization/moments, Brownian variance and quadratic-variation convergence, GBM expectation and martingale discounting, Black–Scholes parity/limits/hedge relations.
- Rendered routes: canonical and legacy aliases, compact disclosures, EN/ES, no broken hash anchors.
- Browser: 375/768/1280/1440, formula overflow, Python disclosure, keyboard focus, and interactive response.
- Repository gates: typecheck, lint, i18n audit, tests, build, and Cloudflare preflight.

## Release boundary

Implementation and validation occur on `codex/book-integrated-academy`. Merge, push, and production deployment require a separate explicit confirmation after review.
