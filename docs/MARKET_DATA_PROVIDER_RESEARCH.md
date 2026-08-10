# Market Data Provider Research

Research checked 2026-08-10 against first-party documentation.

| Provider | Coverage / transport | Free limit found | Display conclusion | Current role |
|---|---|---:|---|---|
| [ECB Data Portal](https://data.ecb.europa.eu/help/api/data) | Official FX reference rates, €STR and policy rates; REST/CSV | Public API | Public official reference data; preserve attribution | Selected server-side reference and history |
| [Twelve Data](https://twelvedata.com/docs/advanced) | Broad multi-asset REST + WebSocket | Basic: 8 credits/min, 800/day; trial WS | Individual use is personal/internal; commercial display/redistribution needs the appropriate agreement | Adapter deferred until credentials and display licence are confirmed |
| [Finnhub](https://finnhub.io/pricing) | Equities/FX/crypto REST + WebSocket | 60 calls/min, 50 WS symbols | Free and standard plans are described as personal use | Researched mapping/failover candidate, not enabled |
| [Alpha Vantage](https://www.alphavantage.co/documentation/) | Equities, FX, crypto, commodities, economics | 25 requests/day free | Real-time/delayed data is premium and regulated; commercial use requires contact | EOD fallback candidate, not enabled |
| [Coinbase Advanced](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-overview) | Genuine public crypto ticker WebSocket | Public channels require no auth | [Market-data terms](https://www.coinbase.com/legal/market_data) restrict third-party public display/redistribution without consent | Selected only for local/private beta BTC/USD and ETH/USD |

The Twelve Data demo WebSocket did not complete a WebSocket upgrade during verification. Coinbase returned genuine ticker snapshots and successive updates. Provider errors remain visible and do not trigger fake-live animation.
