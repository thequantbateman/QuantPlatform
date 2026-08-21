# Project Context Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a compact, durable project-memory layer that lets a new Codex session understand and route work in QuantPlatform after reading only `AGENTS.md` and `CONTEXT.md`.

**Architecture:** Keep mandatory behaviour in `AGENTS.md`, place the verified project mental model and documentation router in one root `CONTEXT.md`, and leave human onboarding and deep technical material in `README.md` and `docs/`. Dynamic context is anchored to a validation date and Git SHA; source/configuration remain authoritative.

**Tech Stack:** Markdown, Git, POSIX shell checks, existing repository documentation and configuration.

**Spec:** `docs/superpowers/specs/2026-08-21-project-context-memory-design.md`

## Global Constraints

- Modify product code: never.
- Normal deliverables: root `CONTEXT.md` and a minimal root `AGENTS.md` bootstrap section.
- Target `CONTEXT.md` length: 1,500–2,500 words.
- Do not create additional memory/session/start files or generated indexes.
- Do not include secrets, credential values, private URLs, personal data, or machine-specific paths.
- Distinguish `CURRENT`, `PLANNED`, and `POSSIBLE FUTURE` facts.
- Source precedence: current source > current configuration > current committed documentation > conversation history.
- Deep details stay in existing `docs/`; `CONTEXT.md` links rather than duplicates them.
- Do not run product builds or tests for this documentation-only change unless the scope unexpectedly touches product/configuration files.

---

### Task 1: Author the Verified Root Context

**Files:**
- Create: `CONTEXT.md`
- Read: `AGENTS.md`
- Read: `README.md`
- Read: `package.json`
- Read: `.env.example`
- Read: `wrangler.jsonc`
- Read: `vite.config.ts`
- Read: `.openai/hosting.json`
- Read: `THIRD_PARTY_NOTICES.md`
- Read selectively: `docs/`, `worker/`, `db/`, `src/`, `services/quant-engine/`

**Interfaces:**
- Consumes: current Git metadata, repository configuration, source layout, and committed technical documentation.
- Produces: `CONTEXT.md`, the single durable project identity/architecture/routing document consumed by the Task 2 bootstrap.

- [ ] **Step 1: Capture the canonical workspace and freshness facts**

Run:

```bash
pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status --short
git log -5 --oneline
git rev-parse --short HEAD
date +%F
```

Expected: Git root is the existing QuantPlatform clone, `origin` is `https://github.com/thequantbateman/QuantPlatform.git`, and no unexpected user changes are present. Record the exact date and pre-documentation short SHA; never record the local absolute path.

- [ ] **Step 2: Build the context skeleton with explicit responsibility boundaries**

Create `CONTEXT.md` with this structural contract:

```markdown
# QuantPlatform Context

> Last validated: 2026-08-21
> Validated against commit: 9b10244

## Project identity
## Canonical repository and workflow
## Current technology stack
## Architecture at a glance
## Repository map
## Runtime boundaries
## Quant architecture and invariants
## Compute strategy
## Market-data architecture
## Deployment model
## Configuration and secrets
## Development commands and quality gates
## Non-negotiable architectural invariants
## Current project state
## Active roadmap
## Known limitations
## Documentation router
## New-session bootstrap
## Context routing policy
## Freshness and update policy
```

If Step 1 finds that an architecture-affecting commit landed after `9b10244`, use the newly captured date and short SHA instead. Do not invent either value.

- [ ] **Step 3: Write current architecture and runtime facts**

Populate the identity, stack, diagram, repository map, runtime boundaries, quant architecture, compute strategy, market-data architecture, deployment, configuration, and commands from verified source/configuration. The architecture diagram must separate current and planned boundaries, following this shape:

```text
Browser
  -> Cloudflare Worker (vinext/React, APIs, server adapters, D1)
       -> framework-free TypeScript quant modules
       -> normalized external providers
       -> optional future versioned Python QuantEngine service
```

State that `src/quant/` is portable deterministic TypeScript and `services/quant-engine/` is the preserved advanced Python service boundary. Record Cloudflare Workers, Workers Builds, D1, and `thequantbateman.com` as current only when supported by current configuration/release state; label Cloud Run or another container runtime as planned rather than deployed.

- [ ] **Step 4: Add high-signal current state, roadmap, and limitations**

Keep these sections short. Include only facts that affect engineering decisions: active production posture, major working platform areas, current provider/demo/licensing limits, optional Python service status, and the next architectural direction. Use `NOW / NEXT / LATER`; do not reproduce completed task history or broad speculative model lists.

- [ ] **Step 5: Add a selective documentation router**

Link only to existing tracked files and group them by domain. At minimum cover:

```text
Product/architecture -> docs/PRODUCT.md, docs/ARCHITECTURE.md
Academy/content/i18n -> docs/academy/, docs/CONTENT_MODEL.md, docs/I18N.md
Quant -> docs/QUANT_CONVENTIONS.md, docs/QUANT_ENGINE.md,
         docs/QUANTLIB_STRATEGY.md, docs/QUANT_VISUALIZATION.md
Market data -> docs/MARKET_DATA_ARCHITECTURE.md and related market/Polymarket docs
AI -> docs/AI_ARCHITECTURE.md, docs/AI_PRIVACY.md, docs/AI_TOOLS.md
Design/avatar -> docs/DESIGN_SYSTEM.md and docs/design/
Deployment/security -> docs/DEPLOYMENT_CLOUDFLARE.md, docs/security/
Roadmap/research/QA -> docs/ROADMAP.md, docs/research/, docs/qa/
```

The router must tell agents to load only the relevant group plus related source directories.

- [ ] **Step 6: Add bootstrap, staleness, and update policies**

The new-session sequence must be:

```text
1. Verify Git root, branch, status, and recent commits.
2. Read AGENTS.md and CONTEXT.md.
3. Classify the requested domain.
4. Load only the routed docs and source.
5. Revalidate task-relevant context when HEAD materially differs.
```

State exactly which material changes require a context update and which routine changes do not.

- [ ] **Step 7: Run the first compression and integrity check**

Run:

```bash
wc -w CONTEXT.md
rg -n 'T[B]D|T[O]DO|/Users/|API[_ -]?KEY\s*[:=]\s*\S+|TOKEN\s*[:=]\s*\S+|PASSWORD\s*[:=]\s*\S+' CONTEXT.md
git diff --check -- CONTEXT.md
```

Expected: 1,500–2,500 words; no template markers, personal paths, or credential-like assignments; no whitespace errors. Remove any paragraph whose absence would not worsen a future engineering decision.

- [ ] **Step 8: Commit the independently reviewable context document**

```bash
git add CONTEXT.md
git commit -m "docs: add durable project context"
```

Expected: one commit containing only `CONTEXT.md`.

---

### Task 2: Add the Minimal Agent Bootstrap

**Files:**
- Modify: `AGENTS.md`
- Read: `CONTEXT.md`

**Interfaces:**
- Consumes: root `CONTEXT.md` from Task 1.
- Produces: the mandatory session entry sequence that routes future agents into `CONTEXT.md` without duplicating it.

- [ ] **Step 1: Verify the bootstrap is currently absent**

Run:

```bash
rg -n 'Session bootstrap|Context loading|CONTEXT\.md' AGENTS.md
```

Expected before implementation: no dedicated session-bootstrap/context-loading section, or an existing section that does not yet define the five required actions.

- [ ] **Step 2: Add the concise bootstrap section**

Insert this policy near `How future agents should work`, adapting only wording needed to avoid duplication:

```markdown
## Session bootstrap and context loading

At the beginning of a new session:

1. Verify the current Git root, branch, status and recent commits.
2. Read root `CONTEXT.md` after this file.
3. Classify the task and use the documentation router in `CONTEXT.md`.
4. Load only the relevant documentation and source; do not scan the repository by default.
5. Treat current source and configuration as authoritative when context appears stale.
```

Preserve every existing coding, quant, testing, UI, content, security, dependency, and deployment rule.

- [ ] **Step 3: Verify responsibility separation**

Run:

```bash
rg -n '^## ' AGENTS.md CONTEXT.md
git diff --check -- AGENTS.md CONTEXT.md
```

Expected: `AGENTS.md` explains required behaviour, `CONTEXT.md` supplies identity/architecture/routing, and neither contains duplicated long-form sections.

- [ ] **Step 4: Commit the bootstrap independently**

```bash
git add AGENTS.md
git commit -m "docs: route new sessions through project context"
```

Expected: one commit containing only the minimal `AGENTS.md` change.

---

### Task 3: Validate the Complete Memory System

**Files:**
- Verify: `AGENTS.md`
- Verify: `CONTEXT.md`
- Verify: paths referenced from `CONTEXT.md`

**Interfaces:**
- Consumes: both documentation layers from Tasks 1 and 2.
- Produces: evidence that the memory system is compact, safe, correctly routed, and sufficient for a zero-history session.

- [ ] **Step 1: Validate every local documentation reference**

Extract Markdown targets beginning with `docs/` and confirm every file or directory exists. Use this exact check:

```bash
node -e 'const fs=require("fs"); const text=fs.readFileSync("CONTEXT.md","utf8"); const refs=[...text.matchAll(/`(docs\/[A-Za-z0-9_./-]+)`/g)].map(m=>m[1]); const missing=[...new Set(refs)].filter(p=>!fs.existsSync(p)); if(missing.length){console.error(missing.join("\n"));process.exit(1)} console.log(`${new Set(refs).size} documentation references verified`);'
```

Expected: exit code 0 and zero missing paths.

- [ ] **Step 2: Validate size, privacy, and public safety**

Run:

```bash
wc -w -c CONTEXT.md
rg -n '/Users/|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|gh[pousr]_[A-Za-z0-9]+|sk-[A-Za-z0-9]+|password\s*[:=]|token\s*[:=]|api[_-]?key\s*[:=]' CONTEXT.md AGENTS.md
git grep -n 'CONTEXT.md' -- AGENTS.md
```

Expected: 1,500–2,500 words; no private paths, keys, tokens, or assigned credential values; `AGENTS.md` contains the bootstrap link.

- [ ] **Step 3: Simulate the fresh-session decision test**

Read only `AGENTS.md` and `CONTEXT.md`, then verify they explicitly answer:

```text
project and canonical repository;
current architecture and deployment;
UI, TypeScript quant, Python quant, database, and provider ownership;
compute evolution and secret handling;
frequent validation commands;
task-specific documentation routing;
non-negotiable invariants and staleness behaviour.
```

If any answer requires an unlinked third document just to identify where to work, tighten `CONTEXT.md`; detailed implementation may remain routed.

- [ ] **Step 4: Inspect the complete documentation diff**

Run:

```bash
git diff HEAD~2 --stat
git diff HEAD~2 -- AGENTS.md CONTEXT.md
git status --short
```

Expected: only the approved context layer changes are present and the working tree has no unrelated modifications.

- [ ] **Step 5: Record final evidence**

Capture for the handoff:

```text
Created: CONTEXT.md
Updated: AGENTS.md
Context word/byte count
Validation date and recorded SHA
Documentation reference count
Product changes: none
```

No production deployment is required because this task changes repository documentation only.
