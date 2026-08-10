# Market data provider matrix

Reviewed 2026-08-10.

| Provider | Public use | REST | Stream | Current decision |
|---|---|---:|---:|---|
| TQB frozen scenarios | Public educational | Yes | No | Default fallback; always `DEMO` |
| ECB Data Portal | Public reference | Yes | No | Reference FX/rates; always `REFERENCE` |
| Twelve Data | API key; display/redistribution depends on licence | Yes | Yes | Server-only adapter; selectable only when `MARKET_DATA_DISPLAY_LICENSE=confirmed` |
| Finnhub | Free tier is personal-use | Yes | Yes | Researched, not enabled for public deployment |
| Alpha Vantage | Free quota is limited; real-time US data is premium/licensed | Yes | Provider-dependent | Researched, not enabled |

AUTO selects a licensed server provider only when credentials and a confirmed display licence exist; otherwise it returns the explicit public demo environment. Sources: [Twelve Data docs](https://twelvedata.com/docs/advanced), [Twelve Data usage](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage), [Finnhub pricing](https://finnhub.io/pricing), [Alpha Vantage support](https://www.alphavantage.co/support/), [ECB API](https://data.ecb.europa.eu/help/api/data).
