# Project Context Memory Design

**Status:** Approved in chat on 2026-08-21; implementation pending written-spec review.

## Purpose

Give a new Codex session enough durable context to work safely and effectively in QuantPlatform without rescanning the repository or replaying conversation history. The system must be compact, selective, current, public-safe, and inexpensive to maintain.

## Scope

This change creates one root `CONTEXT.md` and adds a short session-bootstrap section to `AGENTS.md`. It does not change product code, runtime behavior, dependencies, deployment configuration, README onboarding, or domain documentation. No competing memory files, generated indexes, or machine-specific configuration will be introduced.

## Chosen Architecture

```text
new Codex session
        |
        v
AGENTS.md — mandatory behaviour and invariants
        |
        v
CONTEXT.md — project mental model, current state, and routing
        |
        v
only task-relevant docs and source files
        |
        v
work
```

`AGENTS.md` remains authoritative for how an agent must work: coding, quant, security, testing, UI, content, dependency, and release rules. `CONTEXT.md` answers what the project is, how the current repository and runtimes fit together, where responsibilities live, and which deeper documents to load for a task. `README.md` remains human onboarding. `docs/` remains the source of detailed design and operational procedures.

This two-layer design is preferred over generated memory because it has no runtime, dependency, or synchronization cost. It is preferred over multiple domain memory files because the existing documentation tree already supplies selective depth; another hierarchy would duplicate it and increase routing ambiguity.

## `AGENTS.md` Change

Add a concise `Session bootstrap and context loading` section. A new session must:

1. verify the current Git root, branch, status, and recent commits;
2. read root `CONTEXT.md` after `AGENTS.md`;
3. classify the requested domain and follow the context router;
4. load only relevant documentation and source;
5. treat current source and configuration as authoritative when context appears stale.

No existing mandatory rule will be weakened or moved merely to shorten the file. Descriptive context may remain where it is inseparable from a rule, but `AGENTS.md` will not duplicate the new architectural map.

## `CONTEXT.md` Contract

Target length is 1,500–2,500 words. The document will use short sections, bullets, tables, direct links, and one compact ASCII architecture diagram. It will contain no chat history, long code excerpts, exhaustive file inventory, secret values, private URLs, personal data, or machine-specific paths.

Required content:

- project identity, audience, and product direction;
- canonical repository, source-of-truth, development, and deployment workflow;
- verified technology stack;
- current architecture and explicit current/planned runtime boundaries;
- concise repository map;
- TypeScript versus Python quant-engine responsibilities;
- critical quant correctness invariants with `AGENTS.md` as authority;
- infrastructure-agnostic compute tiers;
- market-data abstraction, provenance, modes, and licensing boundary;
- current Cloudflare deployment and custom-domain state;
- configuration and secret categories without values;
- frequent development and validation commands;
- non-negotiable architectural invariants;
- compact current state, `NOW / NEXT / LATER` roadmap, and verified limitations;
- documentation router and domain-based context-loading policy;
- new-session bootstrap, freshness metadata, staleness policy, and update policy.

Statements will explicitly distinguish `CURRENT`, `PLANNED`, and `POSSIBLE FUTURE`. Dynamic facts will be validated against the implementation and configuration at the time of writing. The live custom domain may be recorded as current because the user has verified it and the released repository configuration permits it; implementation plans that are not active will remain labelled planned.

## Source Precedence and Data Flow

The authoring pass uses this precedence:

```text
current source code
  > current configuration
  > current committed documentation
  > conversation history
```

The document is an index and mental model, not a second source of deep technical truth. Detailed procedures remain linked in `docs/`. For example, `CONTEXT.md` may record that production uses Cloudflare Workers and D1, while `docs/DEPLOYMENT_CLOUDFLARE.md` retains commands, migration procedures, rollback, and troubleshooting.

## Freshness Model

`CONTEXT.md` records the validation date and the exact short Git SHA used for the audit. If a future HEAD differs materially, an agent must inspect recent commits and revalidate only the task-relevant context. The file is updated only when architecture, runtime boundaries, deployment, provider strategy, quant-engine strategy, database strategy, canonical workflow, project phase, or a consequential limitation changes.

Minor UI changes, routine refactors, test additions, content entries, and small bug fixes do not trigger context updates. This prevents context churn and avoids meaningless freshness commits.

## Documentation Router

The router will be built from documents that actually exist. It will group rather than list every file, covering at least:

- product and architecture;
- Academy/content and internationalization;
- quant conventions, engine, QuantLib strategy, and visualization;
- market data, streaming, Polymarket, licensing, and intelligence;
- AI assistant, privacy, tools, and evaluation;
- design system and Quant Bateman assets;
- Cloudflare deployment and security;
- roadmap, research, and quality-assurance evidence.

Task routing will then point frontend, quant, market-data, deployment, Python-engine, content, AI, and infrastructure work to only the required group and related source directories.

## Validation

The implementation is complete only after:

1. canonical workspace commands confirm the Git root, remote, branch, status, and recent history;
2. every important stack, folder, runtime, database, deployment, command, and limitation statement is checked against current files;
3. every documentation link in `CONTEXT.md` resolves to a tracked file;
4. `CONTEXT.md` is within the target word range and is compressed for decision value;
5. scans find no credentials, secret values, personal paths, or machine-specific data;
6. reading only `AGENTS.md` and `CONTEXT.md` answers the twelve fresh-session questions in the task requirements;
7. the complete `AGENTS.md` and `CONTEXT.md` diff is reviewed and `git status` contains no unexpected changes.

Because this is documentation-only, product tests and builds are unnecessary unless an edited cross-reference or repository check reveals a product-affecting change. Product behavior must remain unchanged.

## Failure and Staleness Handling

- If repository facts conflict, current source/configuration wins and the mismatch is called out rather than silently reconciled.
- If a dynamic deployment fact cannot be verified safely, it is labelled user-confirmed or planned instead of asserted as repository-derived.
- If an existing deep document is stale, `CONTEXT.md` points to it for procedure but states the current fact explicitly; unrelated documentation is not rewritten in this task.
- If the target word count cannot hold a detail without duplication, the detail is removed and replaced with a direct documentation pointer.

## Definition of Done

A zero-history Codex session can read `AGENTS.md` and `CONTEXT.md`, identify the correct repository and architectural layer, preserve quant and deployment invariants, select only the relevant deeper context, run the correct validation commands, and begin useful work without asking the user to repeat established project decisions.
