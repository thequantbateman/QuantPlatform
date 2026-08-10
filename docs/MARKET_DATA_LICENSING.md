# Market Data Licensing

Supported deployment modes are `LOCAL_DEVELOPMENT`, `PRIVATE_BETA`, `PUBLIC_DEMO` and `PUBLIC_PRODUCTION`.

- ECB official reference data and visibly labelled TQB Demo data may be used in all modes with attribution.
- Coinbase public WebSocket display is enabled only for local development/private beta. Coinbase's current [market-data terms](https://www.coinbase.com/legal/market_data) prohibit public display, distribution and derived works to third parties without written consent.
- Twelve Data, Finnhub and Alpha Vantage are not enabled merely because a key exists. Appropriate commercial display and exchange permissions must also be confirmed.
- `PUBLIC_PRODUCTION` therefore has no public Coinbase stream and must show unavailable/reference/demo states until a licensed provider is configured.

Before a public launch: obtain written display/redistribution rights; record entitlements per asset/exchange; perform legal review; implement plan-specific limits and attribution; configure credentialed adapters server-side; add usage/entitlement monitoring; and rerun provider integration plus browser tests in production mode.
