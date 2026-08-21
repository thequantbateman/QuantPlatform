# Textbook integration progress

Last updated: 2026-08-21

| Phase | Status | Evidence / next action |
|---|---|---|
| Repository and Academy audit | Complete | 41 canonical lessons, 6 tracks, 114 legacy entries, current formula/lab/i18n architecture inspected |
| PDF structural extraction | Complete | 1,310 pages; 15 chapters; 66 sections; 149 nested subsections; 735-page code supplement |
| Book taxonomy | Complete | Foundations → derivatives → volatility/models → numerics → rates/xVA → hybrids/FX |
| Academy mapping | Complete | Chapter and section mappings recorded in `book-coverage.md` and `source-map.md` |
| Gap analysis | Complete | P0 foundation gaps selected; advanced additions explicitly deferred |
| Source registry | Pending | Add copyrighted research-source record and contract test |
| Narrative profiles | Pending | Add typed profiles and profile-aware EN/ES headings |
| Foundation content | Pending | Author four canonical bilingual lessons and track/prerequisite changes |
| Numerical invariants | Pending | Add framework-free foundation calculations and tests |
| Legacy overlap cleanup | Pending | Route shallow overlapping entry points to canonical lessons |
| Integration validation | Pending | Full gates, responsive EN/ES browser QA, review |

## Decision log

- The book is reference input, never a production asset.
- Four foundation lessons are the minimum coherent addition; chapter-by-chapter page creation is rejected.
- Existing labs and engines are reused.
- Jump/Lévy, SLV, hybrid, LMM, and cross-currency additions are deferred.
- Merge, push, and production deployment require explicit approval after validation.
