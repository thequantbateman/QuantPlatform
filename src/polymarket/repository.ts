import { getD1 } from "@/db";
import type { PredictionCoverage, PredictionEvent, PredictionHistoryPoint, PredictionLivePatch, PredictionStats, PredictionTrade } from "./domain";

function at(value: string | null): number | null { if (!value) return null; const time = new Date(value).getTime(); return Number.isFinite(time) ? time : null; }
function bool(value: boolean): number { return value ? 1 : 0; }

async function runBatches(db: D1Database, statements: D1PreparedStatement[], size = 80): Promise<number> {
  let rows = 0;
  for (let index = 0; index < statements.length; index += size) { const result = await db.batch(statements.slice(index, index + size)); rows += result.reduce((sum, item) => sum + (item.meta.changes ?? 0), 0); }
  return rows;
}

export async function persistPredictionDiscovery(events: PredictionEvent[]): Promise<{ persistent: boolean; rows: number }> {
  const db = getD1(); if (!db || events.length === 0) return { persistent: false, rows: 0 }; const persistedAt = Date.now();
  const eventSql = `INSERT INTO prediction_events (id, slug, title, description, category, series_id, resolution_source, start_at, end_at, active, closed, negative_risk, volume, liquidity, open_interest, source_url, provider_updated_at, persisted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, title=excluded.title, description=excluded.description, category=excluded.category, series_id=excluded.series_id, resolution_source=excluded.resolution_source, start_at=excluded.start_at, end_at=excluded.end_at, active=excluded.active, closed=excluded.closed, negative_risk=excluded.negative_risk, volume=excluded.volume, liquidity=excluded.liquidity, open_interest=excluded.open_interest, source_url=excluded.source_url, provider_updated_at=excluded.provider_updated_at, persisted_at=excluded.persisted_at`;
  const marketSql = `INSERT INTO prediction_markets (id, event_id, condition_id, slug, question, description, active, closed, accepting_orders, negative_risk, min_tick_size, min_order_size, volume, volume_24h, liquidity, best_bid, best_ask, last_trade_price, change_1d, change_1w, end_at, provider_updated_at, persisted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET event_id=excluded.event_id, condition_id=excluded.condition_id, slug=excluded.slug, question=excluded.question, description=excluded.description, active=excluded.active, closed=excluded.closed, accepting_orders=excluded.accepting_orders, negative_risk=excluded.negative_risk, min_tick_size=excluded.min_tick_size, min_order_size=excluded.min_order_size, volume=excluded.volume, volume_24h=excluded.volume_24h, liquidity=excluded.liquidity, best_bid=excluded.best_bid, best_ask=excluded.best_ask, last_trade_price=excluded.last_trade_price, change_1d=excluded.change_1d, change_1w=excluded.change_1w, end_at=excluded.end_at, provider_updated_at=excluded.provider_updated_at, persisted_at=excluded.persisted_at`;
  const outcomeSql = `INSERT INTO prediction_outcomes (market_id, outcome_index, label, token_id, latest_price, persisted_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(market_id, outcome_index) DO UPDATE SET label=excluded.label, token_id=excluded.token_id, latest_price=excluded.latest_price, persisted_at=excluded.persisted_at`;
  const statSql = `INSERT OR IGNORE INTO prediction_stats (market_id, observed_at, volume, volume_24h, liquidity, open_interest) VALUES (?, ?, ?, ?, ?, ?)`;
  const statements: D1PreparedStatement[] = [];
  for (const event of events) {
    statements.push(db.prepare(eventSql).bind(event.id, event.slug, event.title, event.description, event.category, event.seriesId, event.resolutionSource, at(event.startDate), at(event.endDate), bool(event.active), bool(event.closed), bool(event.negativeRisk), event.volume, event.liquidity, event.openInterest, event.sourceUrl, at(event.updatedAt) ?? persistedAt, persistedAt));
    for (const market of event.markets) {
      statements.push(db.prepare(marketSql).bind(market.id, market.eventId, market.conditionId, market.slug, market.question, market.description, bool(market.active), bool(market.closed), bool(market.acceptingOrders), bool(market.negativeRisk), market.minTickSize, market.minOrderSize, market.volume, market.volume24h, market.liquidity, market.bid, market.ask, market.lastTradePrice, market.change1d, market.change1w, at(market.endDate), at(market.updatedAt) ?? persistedAt, persistedAt));
      for (const outcome of market.outcomes) statements.push(db.prepare(outcomeSql).bind(market.id, outcome.index, outcome.label, outcome.tokenId, outcome.price, persistedAt));
      statements.push(db.prepare(statSql).bind(market.id, at(market.updatedAt) ?? persistedAt, market.volume, market.volume24h, market.liquidity, market.openInterest));
    }
  }
  const rows = await runBatches(db, statements);
  await db.prepare(`INSERT INTO prediction_ingestion_checkpoints (job, cursor, status, rows_written, latest_data_at, updated_at, error) VALUES (?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(job) DO UPDATE SET cursor=excluded.cursor, status=excluded.status, rows_written=prediction_ingestion_checkpoints.rows_written + excluded.rows_written, latest_data_at=excluded.latest_data_at, updated_at=excluded.updated_at, error=NULL`).bind("gamma-discovery", events.at(-1)?.id ?? null, "HEALTHY", rows, persistedAt, persistedAt).run();
  return { persistent: true, rows };
}

export async function persistPredictionHistory(tokenId: string, points: PredictionHistoryPoint[], interval = "raw"): Promise<{ persistent: boolean; rows: number }> {
  const db = getD1(); if (!db || points.length === 0) return { persistent: false, rows: 0 };
  const sql = `INSERT OR IGNORE INTO prediction_probability_bars (token_id, interval, bucket_at, open, high, low, close, observations) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`;
  const rows = await runBatches(db, points.map((point) => db.prepare(sql).bind(tokenId, interval, point.timestamp, point.probability, point.probability, point.probability, point.probability)));
  const now = Date.now(); await db.prepare(`INSERT INTO prediction_ingestion_checkpoints (job, cursor, status, rows_written, latest_data_at, updated_at, error) VALUES (?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(job) DO UPDATE SET cursor=excluded.cursor, status=excluded.status, rows_written=prediction_ingestion_checkpoints.rows_written + excluded.rows_written, latest_data_at=excluded.latest_data_at, updated_at=excluded.updated_at, error=NULL`).bind(`history:${tokenId}`, String(points.at(-1)?.timestamp ?? ""), "HEALTHY", rows, points.at(-1)?.timestamp ?? null, now).run();
  return { persistent: true, rows };
}

export async function readPredictionHistory(tokenId: string, from: number, interval: string): Promise<PredictionHistoryPoint[]> {
  const db = getD1(); if (!db) return [];
  const result = await db.prepare(`SELECT bucket_at AS timestamp, close AS probability FROM prediction_probability_bars WHERE token_id = ? AND interval = ? AND bucket_at >= ? ORDER BY bucket_at ASC LIMIT 5000`).bind(tokenId, interval, from).all<PredictionHistoryPoint>();
  return result.results;
}

export async function persistPredictionStats(stats: PredictionStats): Promise<boolean> {
  const db = getD1(); if (!db) return false;
  await db.prepare(`INSERT OR IGNORE INTO prediction_stats (market_id, observed_at, volume, volume_24h, liquidity, open_interest) VALUES (?, ?, ?, ?, ?, ?)`).bind(stats.marketId, stats.observedAt, stats.volume, stats.volume24h, stats.liquidity, stats.openInterest).run(); return true;
}

export async function persistLivePatches(patches: PredictionLivePatch[]): Promise<{ persistent: boolean; rows: number }> {
  const db = getD1(); if (!db || patches.length === 0) return { persistent: false, rows: 0 };
  const quoteSql = `INSERT OR IGNORE INTO prediction_quotes (token_id, observed_at, market_id, bid, ask, mid, spread, last, source_event) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const barSql = `INSERT INTO prediction_probability_bars (token_id, interval, bucket_at, open, high, low, close, observations) VALUES (?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(token_id, interval, bucket_at) DO UPDATE SET high=MAX(prediction_probability_bars.high, excluded.high), low=MIN(prediction_probability_bars.low, excluded.low), close=excluded.close, observations=prediction_probability_bars.observations + 1`;
  const tradeSql = `INSERT OR IGNORE INTO prediction_trades (identity, market_id, token_id, observed_at, price, size, side, transaction_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const bookSql = `INSERT OR IGNORE INTO prediction_orderbook_snapshots (token_id, observed_at, bid_depth, ask_depth, imbalance, best_bid, best_ask, levels_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const statements: D1PreparedStatement[] = [];
  for (const patch of patches) {
    if (patch.type === "quote") { statements.push(db.prepare(quoteSql).bind(patch.tokenId, patch.observedAt, patch.marketId, patch.bid, patch.ask, patch.mid, patch.spread, patch.last, patch.sourceEvent)); const price = patch.mid ?? patch.last; if (price !== null) for (const [interval, width] of [["1m", 60_000], ["5m", 300_000], ["15m", 900_000], ["1h", 3_600_000], ["1d", 86_400_000]] as const) { const bucket = Math.floor(patch.observedAt / width) * width; statements.push(db.prepare(barSql).bind(patch.tokenId, interval, bucket, price, price, price, price)); } }
    if (patch.type === "trade") { const trade: PredictionTrade = patch.trade; statements.push(db.prepare(tradeSql).bind(trade.identity, trade.marketId, trade.tokenId, trade.timestamp, trade.price, trade.size, trade.side, trade.transactionHash)); }
    if (patch.type === "book") { const book = patch.book; const levels = JSON.stringify({ bids: book.bids.slice(0, 10), asks: book.asks.slice(0, 10) }); statements.push(db.prepare(bookSql).bind(book.tokenId, book.observedAt, book.bidDepth, book.askDepth, book.imbalance, book.bestBid, book.bestAsk, levels)); }
  }
  const rows = await runBatches(db, statements); const observedAt = patches.reduce((latest, patch) => {
    if (patch.type === "quote" || patch.type === "lifecycle") return Math.max(latest, patch.observedAt);
    if (patch.type === "trade") return Math.max(latest, patch.trade.timestamp);
    if (patch.type === "book") return Math.max(latest, patch.book.observedAt);
    return latest;
  }, 0);
  if (observedAt) { const now = Date.now(); await db.prepare(`INSERT INTO prediction_ingestion_checkpoints (job, cursor, status, rows_written, latest_data_at, updated_at, error) VALUES (?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(job) DO UPDATE SET cursor=excluded.cursor, status=excluded.status, rows_written=prediction_ingestion_checkpoints.rows_written + excluded.rows_written, latest_data_at=excluded.latest_data_at, updated_at=excluded.updated_at, error=NULL`).bind("live-market-stream", String(observedAt), "HEALTHY", rows, observedAt, now).run(); }
  return { persistent: true, rows };
}

export async function persistTrades(trades: PredictionTrade[]): Promise<{ persistent: boolean; rows: number }> {
  return persistLivePatches(trades.map((trade) => ({ type: "trade", trade })));
}

export async function predictionCoverage(): Promise<PredictionCoverage> {
  const db = getD1(); if (!db) return { persistent: false, events: 0, markets: 0, outcomes: 0, quotes: 0, trades: 0, bars: 0, latestDataAt: null, lagMs: null };
  const statements = ["prediction_events", "prediction_markets", "prediction_outcomes", "prediction_quotes", "prediction_trades", "prediction_probability_bars"].map((table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`));
  const results = await db.batch<{ count: number }>(statements); const counts = results.map((result) => Number(result.results[0]?.count ?? 0));
  const latest = await db.prepare(`SELECT MAX(latest_data_at) AS latest FROM prediction_ingestion_checkpoints`).first<{ latest: number | null }>(); const latestDataAt = latest?.latest ?? null;
  return { persistent: true, events: counts[0], markets: counts[1], outcomes: counts[2], quotes: counts[3], trades: counts[4], bars: counts[5], latestDataAt, lagMs: latestDataAt ? Math.max(0, Date.now() - latestDataAt) : null };
}

export async function recentPersistedQuotes(limit = 100): Promise<Record<string, unknown>[]> {
  const db = getD1(); if (!db) return [];
  const result = await db.prepare(`SELECT q.token_id AS tokenId, q.market_id AS marketId, m.question, q.observed_at AS observedAt, q.bid, q.ask, q.mid, q.spread, q.last, q.source_event AS sourceEvent FROM prediction_quotes q LEFT JOIN prediction_markets m ON m.id = q.market_id ORDER BY q.observed_at DESC LIMIT ?`).bind(Math.min(500, Math.max(1, limit))).all<Record<string, unknown>>(); return result.results;
}
