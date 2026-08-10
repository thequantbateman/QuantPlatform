# Polymarket integration

The `/api/predictions` gateway uses public, unauthenticated, read-only endpoints: Gamma for active event discovery and CLOB for a featured probability history. It normalizes identifiers, question, category, probability, outcomes, volume, liquidity, timestamps and token ID. It filters for macro/finance subjects and never returns fabricated fallback probabilities.

No wallet, API credential, order, position, buy/sell control or gambling-oriented interaction exists. Failures return an explicit `UNAVAILABLE` state. Responses cache for 60 seconds with stale-while-revalidate; the upstream timeout is 6.5 seconds. Sources: [API introduction](https://docs.polymarket.com/api-reference/introduction), [market data overview](https://docs.polymarket.com/market-data/overview), [price history](https://docs.polymarket.com/api-reference/markets/get-prices-history), [rate limits](https://docs.polymarket.com/api-reference/rate-limits).

The official public market WebSocket supports order book, price changes, last trade and best bid/ask. A later iteration can add it through the streaming contract with heartbeat, reconnect and stale-state behavior: [WebSocket overview](https://docs.polymarket.com/market-data/websocket/overview).
