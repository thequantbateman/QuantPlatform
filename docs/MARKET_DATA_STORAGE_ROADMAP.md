# Market Data Storage Roadmap

This release intentionally uses ephemeral snapshots and bounded in-memory tick buffers.

Next storage stages:

1. Persist normalized snapshot metadata and provider lineage in Postgres/D1: snapshot ID, canonical instrument, requested/effective as-of, mode, provider, status and timestamps.
2. Store immutable daily/reference bars with a uniqueness key over instrument, provider, interval and timestamp.
3. Put licensed high-volume intraday bars in Parquet/object storage; keep only catalog metadata and aggregates in the relational store.
4. Add retention by provider contract, replay jobs, quality flags, corporate-action/version metadata and lineage hashes.
5. Build deterministic backfills and comparison jobs before enabling historical analytics or AI retrieval.

Raw vendor payload retention is excluded unless a provider agreement explicitly permits it. Never persist credentials or silently merge sources into one synthetic history.
