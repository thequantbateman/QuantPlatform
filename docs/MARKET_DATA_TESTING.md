# Market Data Testing

Normal validation:

```bash
npm run typecheck
npm run lint
npm run test:quant
npm run build
npm test
```

Opt-in network validation:

```bash
MARKET_DATA_INTEGRATION_TESTS=true npm run test:market-data:integration
```

The default suite is deterministic and covers the 44-instrument master/counts, symbol mappings, null normalization, tick direction, EUR/USD and USD/JPY pips, rate basis points, freshness/staleness, 120-tick cap, session-versus-tick semantics, ECB CSV/cross transformation, provider-unavailable states, explicit Demo routing, AI routing and a 50-subscription store budget. The integration test contacts Coinbase and is skipped unless explicitly enabled.

Manual QA should cover dark/light, EN/ES, desktop/mobile, mode/provider/date controls, source-link keyboard access, real BTC/ETH updates, static non-streaming behavior, pricer lineage, prediction source buttons, debug gating, navigation and console/network errors.
