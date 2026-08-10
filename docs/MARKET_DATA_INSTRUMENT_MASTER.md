# Market Data Instrument Master

The master contains 44 canonical instruments: FX 11, equities 12, indices 8, rates 5, commodities 6 and crypto 2.

Each instrument defines canonical ID and slug, display symbol/name, asset and instrument semantics, currency, exchange, timezone/session, precision, optional pip size, pricer mode and learning route. Vendor symbols are separate mappings for ECB, Coinbase, Twelve Data and Finnhub.

Important conventions:

- FX IDs use `fx-*`; JPY pairs use pip size `0.01`, others `0.0001`.
- Rates use percent levels; level differences are rendered in basis points (`change × 100`).
- Coinbase maps only `crypto-btcusd → BTC-USD` and `crypto-ethusd → ETH-USD`.
- ECB crosses are derived from same-date EUR reference legs. A cross is omitted when either leg is absent.
- Source URLs attach to mappings and flow into normalized quotes and verification buttons.

The default watchlist is 10 instruments. The API limit and tested UI/store budget are 50 active instruments.
