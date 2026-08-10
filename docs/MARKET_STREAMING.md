# Market streaming contract

`StreamingMarketDataProvider.subscribe(symbols, onQuote, onState)` returns an idempotent `unsubscribe`. A production adapter must authenticate server-side, subscribe once, emit provider and market timestamps, heartbeat, reconnect with bounded exponential backoff, resubscribe, and mark the last quote stale after its asset-specific threshold.

The public build does not simulate a live stream. Frozen values remain `DEMO`; ECB observations remain `REFERENCE`. Twelve Data documents subscribe/unsubscribe/reset events and a ten-second heartbeat at [its streaming guide](https://support.twelvedata.com/en/articles/5620516-how-to-stream-the-data).
