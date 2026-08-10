# Polymarket intelligence architecture

Reviewed 2026-08-10 against the current official [API introduction](https://docs.polymarket.com/api-reference/introduction), [market-data overview](https://docs.polymarket.com/market-data/overview), [real-time guide](https://docs.polymarket.com/market-data/realtime-data), [rate limits](https://docs.polymarket.com/api-reference/rate-limits), [negative-risk model](https://docs.polymarket.com/concepts/negative-risk), [resolution model](https://docs.polymarket.com/concepts/resolution), [geographic restrictions](https://docs.polymarket.com/api-reference/geoblock), and the complete [documentation index](https://docs.polymarket.com/llms.txt).

## Capability map

| Domain | Official surface | Implemented | Boundary |
| --- | --- | --- | --- |
| Discovery | Gamma events, markets, public search, tags, series | Events, nested markets, search-ready API, categories, series identifiers and metadata sync | UI uses current offset listing for volume ranking; keyset is the next pagination upgrade |
| Identity | Gamma event/market/outcome/token metadata | Distinct event, condition market, outcome and CLOB token models | Never infer that every event is a single Yes/No market |
| Live prices | Public Market WebSocket and batch books | Server WebSocket, dynamic multi-token subscription, heartbeat, reconnect and normalized SSE; batch-book polling takes over when a hosting edge buffers SSE | User/wallet channel intentionally excluded |
| Order books | CLOB REST and Market WebSocket | Full L2 state, top of book, midpoint, spread, depth and imbalance | Midpoint is analytical, not necessarily executable |
| Trades | Data API plus `last_trade_price` stream | Public tape, deduplication and D1 persistence | No wallet attribution analytics in the product UX |
| History | CLOB `prices-history` | 1H/1D/7D/30D/ALL backfill, checkpoint and D1 query path | Vendor points are persisted as observations; live OHLC aggregates are maintained separately |
| Analytics | Gamma/Data volume, liquidity, OI, holders | Volume, 24H volume, liquidity, open interest and top-holder count | Leaderboard is researched but not surfaced; it adds little event-risk signal and can encourage gambling UX |
| Persistence | Site-native D1 | 10 relational tables, migration, idempotent upserts, deduplicated time series, buffered live writes | PostgreSQL/Timescale is the scale-up path, not falsely claimed as provisioned |
| Cross asset | TQB normalized market data | Deterministic keyword rules, separate-unit panels and Learn links | No AI-created relationships and no causal claims |
| AI | TQB evidence router | Current prediction questions use the normalized service; answers include bid/ask, activity and lineage | The model never calls raw Polymarket APIs independently |
| Trading | Authenticated CLOB/order endpoints | Not implemented | No wallet, signing, orders, deposits, withdrawals or geographic workarounds |

## Persistence and time series

D1 is selected because this application is hosted with Sites and D1 is its supported durable structured store. It provides a real deployed database without a paid external service. PostgreSQL with Timescale hypertables remains the recommended scale-up when ingest concurrency, analytical joins, retention jobs or dataset size exceed D1's operating envelope.

The schema separates events, markets, outcomes/tokens, quotes, trades, market-stat snapshots, sampled order-book depth, probability bars, curated cross-asset links and ingestion checkpoints. Live callbacks only normalize and enqueue patches. A two-second writer drains up to 250 patches and sends prepared statements in bounded D1 batches. Duplicate quote timestamps, trade identities, history coordinates and book timestamps are ignored. Live midpoint/last updates maintain 1m, 5m, 15m, 1h and 1d OHLC aggregates.

Interactive discovery persists the compact market subset rendered by the client so a high-cardinality event cannot block the page on thousands of writes. Event detail persists the full selected event, while the resumable backfill remains the path for exhaustive coverage.

Current retention is conservative: durable metadata and deduplicated history are retained, while order books store only the top ten levels per normalized snapshot rather than unbounded raw payloads. Automated age-based deletion is not enabled yet; it should be added with measured dataset growth. A future Timescale deployment should use hypertable retention/compression and continuous aggregates.

## Public-use and paid-function findings

Gamma and Data APIs are documented as public without authentication; public CLOB book and pricing endpoints also require no authentication. Polymarket's help center describes linked developer code as open source and free to use. The docs do not grant a general, explicit redistribution licence for all market content, so public endpoint status must not be treated as blanket data-rights permission. The product therefore preserves provider attribution, verification links, timestamps, read-only semantics, rate-limit discipline and no trading. Terms and data-policy changes must be reviewed before commercial redistribution.

Authenticated trading, wallet analytics, Bridge, Relayer and user WebSocket capabilities are out of scope. The RTDS Pyth equity reference feed is a future paid-data candidate; current official documentation advertises a trial followed by a paid plan. It must remain feature-gated until licensing and budget are approved.

## Operations

```bash
npm run db:migrate
npm run dev
npm run predictions:backfill
npm run predictions:benchmark
npm run predictions:ingest
npm run predictions:health
```

Set `TQB_BASE_URL` when the application is not running at `http://localhost:3000`. Backfill size can be controlled with `POLYMARKET_BACKFILL_PAGES` and `POLYMARKET_BACKFILL_MARKETS`; live collection duration uses `POLYMARKET_INGEST_SECONDS`.

`npm run db:migrate` targets the local D1 emulator declared in `wrangler.jsonc`. Sites provisions the production `DB` binding from `.openai/hosting.json` and applies the checked-in migrations during its deployment workflow; the local placeholder database ID must never be used as a remote target.
