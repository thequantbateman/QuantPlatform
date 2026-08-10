# Market Data Architecture

## Implemented flow

`Instrument master → request/router → provider adapter → normalized MarketQuote/MarketSnapshot → external per-instrument store → Home, Markets, Intelligence, AI and pricer lineage`.

- Canonical IDs and vendor mappings live in `src/market-data/instrumentMaster.ts`.
- Server-only selection and failover live in `src/market-data/router.ts`.
- Adapters normalize immediately; vendor payloads do not enter UI code.
- `/api/markets/snapshot` caps requests at 50 instruments and exposes no credentials.
- The client store uses `useSyncExternalStore` and listeners keyed by instrument ID. A BTC tick does not rerender every quote row.
- The rolling live buffer is capped at 120 observations per instrument.
- Snapshots are ephemeral in this release. `snapshotId`, requested time, effective as-of, mode and provider metadata make later persistence compatible.

## Provider selection

AUTO selects ECB for mapped FX/rates, Coinbase for mapped crypto only in local/private live mode, and explicit Demo for the remainder. Unsupported explicit provider requests return normalized `OFFLINE` quotes; they never silently invent or relabel data.

## Security

Credentialed providers remain server-side. The only browser transport is Coinbase's unauthenticated public WebSocket. No raw payloads or secrets appear in the debug page. Public production must disable Coinbase display unless separate permission is obtained.
