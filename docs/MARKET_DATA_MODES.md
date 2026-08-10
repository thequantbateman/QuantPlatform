# Market Data Modes

| Mode | Meaning | Animation | Implemented source behavior |
|---|---|---|---|
| `LIVE_STREAM` | Successive provider ticks | Only genuine Coinbase ticks | ECB stays daily reference; other supported fixtures remain visibly Demo |
| `LIVE_SNAPSHOT` | One current retrieval | None | ECB reference or explicit Demo |
| `INTRADAY_SNAPSHOT` | Reproducible point-in-time request | None | Domain/API supported; provider coverage currently limited |
| `PREVIOUS_CLOSE` | Prior completed observation | None | Normalized mode supported; ECB uses its business-day series |
| `END_OF_DAY` | Completed daily observation | None | ECB official daily values or explicit Demo |
| `HISTORICAL` | Date-constrained retrieval | None | ECB requests `endPeriod`; effective provider date and daily resolution are displayed |

`requestedAsOf` is the user's request. `asOf` is the effective quote/provider time and can differ due to weekends, holidays or provider resolution. Mixed-source snapshots retain per-quote timestamps instead of claiming false simultaneity.
