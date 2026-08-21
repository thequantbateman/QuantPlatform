# Book-integrated Academy implementation plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use superpowers:test-driven-development for every production change and execute inline in the current task.

**Goal:** Integrate the strongest foundational structure from Oosterlee and Grzelak into the existing Academy with traceable source mapping, varied lesson narratives, four justified canonical lessons, and no duplicate engines or copyrighted material.

**Architecture:** Keep `app/` as routing, typed curriculum data in `src/content/academy/`, presentation in `src/components/academy/`, and quantitative calculations in framework-free `src/quant/`. Extend the existing content contract with narrative profiles, reuse formula/disclosure/lab components, and validate mappings in content tests.

**Tech stack:** TypeScript, React 19, KaTeX, node:test, vinext/Cloudflare Workers, existing Canvas/SVG lab components.

---

### Task 1: Persist full-book coverage and source traceability

**Files:**
- Create: `docs/academy/book-integration/overview.md`
- Create: `docs/academy/book-integration/book-coverage.md`
- Create: `docs/academy/book-integration/academy-gap-analysis.md`
- Create: `docs/academy/book-integration/source-map.md`
- Create: `docs/academy/book-integration/implementation-progress.md`
- Modify: `src/content/academy/sources.ts`
- Test: `tests/content.test.ts`

1. Add a failing source-registry test for the textbook identifier, copyright policy, and HTTPS publisher reference.
2. Run `node --import tsx --test tests/content.test.ts` and capture the missing-source failure.
3. Add the research-only textbook source and the five persistent mapping documents.
4. Re-run the focused test.
5. Commit as `docs: map textbook coverage to academy`.

### Task 2: Add typed narrative profiles and profile-aware lesson chrome

**Files:**
- Modify: `src/content/academy/types.ts`
- Create: `src/content/academy/narrative.ts`
- Modify: `src/content/academy/advanced.ts`
- Modify: `src/content/academy/volatilityTrackLessons.ts`
- Modify: `src/content/academy/volatility.ts`
- Modify: `src/content/academy/rates.ts`
- Modify: `src/content/academy/ratesAdvancedLessons.ts`
- Modify: `src/content/academy/ratesOptionalityLesson.ts`
- Modify: `src/components/academy/AcademyLessonPage.tsx`
- Modify: `src/i18n/index.tsx`
- Test: `tests/content.test.ts`
- Test: `tests/academy-components.test.tsx`

1. Add failing tests requiring a valid narrative profile for every lesson and distinct EN/ES headings for foundation, model, numerical, instrument, and risk examples.
2. Run focused content/component tests and capture failures.
3. Add profile types and a pure localized section-definition helper.
4. Assign profiles by content family and use them in the page TOC/section headings without changing existing fields or formula behavior.
5. Re-run focused tests, typecheck, and i18n audit.
6. Commit as `refactor: vary academy lesson narratives`.

### Task 3: Add four canonical foundational lessons and repair dependencies

**Files:**
- Create: `src/content/academy/foundationsCore.ts`
- Modify: `src/content/academy/catalog.ts`
- Modify: `src/content/academy/advanced.ts`
- Modify: `src/content/academy/localization.ts`
- Modify: `src/content/academy/types.ts` only if an existing lab identifier is insufficient
- Test: `tests/content.test.ts`
- Test: `tests/academy-content.test.ts`

1. Add failing tests for four IDs/routes, authored Spanish parity, textbook references, legacy aliases, exact track order, and prerequisite resolution.
2. Run focused tests and capture failures.
3. Author the four bilingual lessons with topic-specific formulas, derivations, deterministic Python, existing labs, front-office workflows, limitations, and source locators.
4. Prepend them to the foundations track and replace repeated generic prerequisites with explicit concepts throughout the advanced family.
5. Re-run focused tests and typecheck.
6. Commit as `feat: add stochastic pricing foundations`.

### Task 4: Add numerical invariants for the new foundations

**Files:**
- Create: `src/quant/foundations.ts`
- Modify: `tests/quant.test.ts`
- Modify: `src/components/academy/AdvancedConceptLab.tsx` only where an existing lab needs a shared calculation

1. Add failing tests for normal moments/characteristic function, deterministic Brownian construction, quadratic-variation convergence, GBM analytical moments, discounted-Q martingale behavior, and Black–Scholes parity/limits.
2. Run focused quant tests and capture failures.
3. Implement the smallest framework-free functions with input validation and deterministic seeds.
4. Reuse them in the touched lab only if the UI currently duplicates the calculation.
5. Re-run focused tests and lint.
6. Commit as `feat: validate stochastic foundation invariants`.

### Task 5: Rewrite weak overlapping legacy entry points

**Files:**
- Modify: `src/content/catalog.ts`
- Modify: `src/content/localization.ts`
- Modify: `src/components/content/ConceptArticle.tsx`
- Test: `tests/content.test.ts`
- Test: `tests/rendered-html.test.mjs`

1. Add failing tests proving the overlapping probability/Brownian/Itô/Black–Scholes routes resolve to canonical deep lessons and no mapped entry uses the generic `Value=M(state,parameters,conventions)` placeholder.
2. Run focused tests and capture failures.
3. Prefer canonical route aliases; for remaining shallow mapped concepts, replace generic formula/intuition with topic-specific concise content and varied explanatory headings.
4. Preserve unrelated asset content and route stability.
5. Build and run rendered route assertions.
6. Commit as `refactor: retire generic foundation explanations`.

### Task 6: Integration and visual QA

**Files:**
- Modify: `docs/academy/book-integration/implementation-progress.md`
- Modify: `docs/academy/book-integration/book-coverage.md`
- Modify: `docs/academy/book-integration/source-map.md`
- Modify CSS only if browser inspection exposes a real overflow/focus defect

1. Run focused content, component, and quant tests.
2. Run `npm run typecheck`, `npm run lint`, `npm run i18n:audit`, `npm run build`, `npm test`, and `npm run cloudflare:preflight`.
3. Inspect representative new lessons at 375, 768, 1280, and 1440 pixels in EN/ES; test formula disclosures, Python, hashes, keyboard focus, and interactive controls.
4. Fix only observed defects and add a regression test before each fix.
5. Update the coverage/progress records with integrated/deferred statuses and evidence.
6. Request code review and apply material findings test-first.
7. Commit as `docs: record academy integration validation`.

## Explicit deferrals

- Jump/Lévy models, stochastic-local volatility, hybrid equity-rate models, LMM extensions, and cross-currency hybrids remain mapped, not implemented.
- The book’s MATLAB/Python supplement is an algorithm inventory only; none of its source code is copied.
- Homepage, global navigation, Analytics architecture, and unrelated Academy tracks are not redesigned.
- Merge, push, and production deployment are outside this plan until explicitly approved after review.
