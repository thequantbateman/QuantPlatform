# Market data

The MVP uses frozen local records labelled `DEMO DATA`. `MarketDataProvider` separates presentation from future feeds. Production adapters must be server-side, licensed, timestamped, provenance-aware and normalised to explicit currency, unit, calendar and quote conventions. Never scrape Bloomberg, Reuters, ICE, CME or another licensed source.
