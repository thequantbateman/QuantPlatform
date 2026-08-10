# Market data provider research

Reviewed official provider documentation and terms on 10 August 2026. Limits and plans can change; confirm before production launch.

| Provider | Coverage / data | Free tier observed | Key / streaming | Display and redistribution | MVP decision |
|---|---|---|---|---|---|
| Twelve Data | FX, equities, crypto; wider plans add commodities/fixed income; quote/OHLC/history/intraday | Basic: 8 API credits/min, 800/day, 8 trial WS credits; real-time FX/US equity advertised | Key required; REST + WS | Individual plans are personal/internal and explicitly exclude redistribution/commercial public display | Server adapter implemented, disabled without an appropriately licensed key |
| Finnhub | US equities and company/fundamental data; separate FX plans | Free stock plan shown as 60 calls/min and personal use; WS 50 symbols | Key required; REST + WS | Personal-use licence; written approval required for commercial/professional use | Research reference; no public integration |
| Alpha Vantage | Stocks, FX, crypto, fundamentals, indicators, daily/intraday | 25 requests/day; real-time and 15-minute US data premium | Key required; REST | Terms apply; exchange-approved real-time/delayed entitlements are premium | Fallback candidate for low-frequency private research, not board polling |
| ECB Data Portal | Official euro reference rates, FX reference series and macro/financial statistics | Public SDMX 2.1 REST service; no API key | REST/bulk; daily/reference frequency | €STR use is not charged; source and reference nature should be clear | Selected source for public reference rates |
| Stooq | Broad website quotes/history sourced from multiple vendors | Download/UI access; no stable official commercial API contract found | No official primary API selected | Upstream vendor rights vary | Reference only |
| Yahoo unofficial ecosystem | Broad consumer quote coverage | Unofficial endpoints | No stable supported production contract | Scraping/redistribution uncertainty | Rejected as primary architecture |

## Status policy

- **LIVE / NEAR REAL TIME / DELAYED / EOD** only when the provider response and licence justify the label.
- **REFERENCE** for ECB observations such as €STR and policy rates.
- **DEMO** for frozen product scenarios. Demo values always carry a source, market timestamp and received timestamp.

## Operational design

Provider calls are server-only, use a 4.5-second timeout, map HTTP 429 explicitly and fall back to typed demo records. The UI consumes normalized quotes and never branches on provider-specific response fields. Conservative polling/caching is required before enabling a licensed external feed.
