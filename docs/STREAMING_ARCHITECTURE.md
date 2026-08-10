# Streaming Architecture

The current private-beta stream is deliberately small and genuine:

1. A mounted consumer asks for canonical IDs.
2. The subscription manager filters to Coinbase mappings, reference-counts IDs and deduplicates requests.
3. One browser WebSocket subscribes to `ticker` plus `heartbeats`.
4. The adapter immediately converts each event into `MarketTick` and then `MarketQuote`.
5. The per-instrument external store notifies only listeners for that ID.
6. Disconnects use exponential backoff capped at 30 seconds plus jitter. Zero consumers closes the socket.

The feed exposes connection state, subscription count, timestamps and recent error. Tick direction compares successive ticks; session/24-hour change uses the provider's separate field. Bid/ask and spread appear only when supplied. The buffer retains the newest 120 prices.

Static modes do not subscribe or animate. The validated ceiling for this iteration is 50 active store subscriptions; actual live coverage is two crypto symbols because that is the only display-safe genuine stream selected for private beta.
