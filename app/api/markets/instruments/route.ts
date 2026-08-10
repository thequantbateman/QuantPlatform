import { defaultWatchlistIds, homeTickerIds, instrumentCounts, instrumentMaster, vendorSymbolMappings } from "@/src/market-data/instrumentMaster";

export async function GET() { return Response.json({ instruments: instrumentMaster, counts: instrumentCounts(), defaultWatchlistIds, homeTickerIds, mappings: vendorSymbolMappings.map(({ instrumentId, provider, vendorSymbol, exchange }) => ({ instrumentId, provider, vendorSymbol, exchange: exchange ?? null })) }, { headers: { "cache-control": "public, max-age=3600" } }); }
