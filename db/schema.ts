import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const predictionEvents = sqliteTable("prediction_events", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Other"),
  seriesId: text("series_id"),
  resolutionSource: text("resolution_source").notNull().default(""),
  startAt: integer("start_at"),
  endAt: integer("end_at"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  negativeRisk: integer("negative_risk", { mode: "boolean" }).notNull().default(false),
  volume: real("volume").notNull().default(0),
  liquidity: real("liquidity").notNull().default(0),
  openInterest: real("open_interest"),
  sourceUrl: text("source_url").notNull(),
  providerUpdatedAt: integer("provider_updated_at").notNull(),
  persistedAt: integer("persisted_at").notNull(),
}, (table) => [uniqueIndex("prediction_events_slug_uq").on(table.slug), index("prediction_events_active_idx").on(table.active, table.volume)]);

export const predictionMarkets = sqliteTable("prediction_markets", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => predictionEvents.id, { onDelete: "cascade" }),
  conditionId: text("condition_id").notNull(),
  slug: text("slug").notNull(),
  question: text("question").notNull(),
  description: text("description").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  acceptingOrders: integer("accepting_orders", { mode: "boolean" }).notNull().default(false),
  negativeRisk: integer("negative_risk", { mode: "boolean" }).notNull().default(false),
  minTickSize: real("min_tick_size"),
  minOrderSize: real("min_order_size"),
  volume: real("volume").notNull().default(0),
  volume24h: real("volume_24h").notNull().default(0),
  liquidity: real("liquidity").notNull().default(0),
  bestBid: real("best_bid"),
  bestAsk: real("best_ask"),
  lastTradePrice: real("last_trade_price"),
  change1d: real("change_1d"),
  change1w: real("change_1w"),
  endAt: integer("end_at"),
  providerUpdatedAt: integer("provider_updated_at").notNull(),
  persistedAt: integer("persisted_at").notNull(),
}, (table) => [uniqueIndex("prediction_markets_condition_uq").on(table.conditionId), uniqueIndex("prediction_markets_slug_uq").on(table.slug), index("prediction_markets_event_idx").on(table.eventId), index("prediction_markets_activity_idx").on(table.active, table.volume24h)]);

export const predictionOutcomes = sqliteTable("prediction_outcomes", {
  marketId: text("market_id").notNull().references(() => predictionMarkets.id, { onDelete: "cascade" }),
  outcomeIndex: integer("outcome_index").notNull(),
  label: text("label").notNull(),
  tokenId: text("token_id").notNull(),
  latestPrice: real("latest_price"),
  persistedAt: integer("persisted_at").notNull(),
}, (table) => [primaryKey({ columns: [table.marketId, table.outcomeIndex] }), uniqueIndex("prediction_outcomes_token_uq").on(table.tokenId), index("prediction_outcomes_market_idx").on(table.marketId)]);

export const predictionQuotes = sqliteTable("prediction_quotes", {
  tokenId: text("token_id").notNull(),
  observedAt: integer("observed_at").notNull(),
  marketId: text("market_id").notNull(),
  bid: real("bid"),
  ask: real("ask"),
  mid: real("mid"),
  spread: real("spread"),
  last: real("last"),
  sourceEvent: text("source_event").notNull(),
}, (table) => [primaryKey({ columns: [table.tokenId, table.observedAt] }), index("prediction_quotes_market_time_idx").on(table.marketId, table.observedAt)]);

export const predictionTrades = sqliteTable("prediction_trades", {
  identity: text("identity").primaryKey(),
  marketId: text("market_id").notNull(),
  tokenId: text("token_id").notNull(),
  observedAt: integer("observed_at").notNull(),
  price: real("price").notNull(),
  size: real("size").notNull(),
  side: text("side").notNull(),
  transactionHash: text("transaction_hash"),
}, (table) => [index("prediction_trades_market_time_idx").on(table.marketId, table.observedAt)]);

export const predictionStats = sqliteTable("prediction_stats", {
  marketId: text("market_id").notNull(),
  observedAt: integer("observed_at").notNull(),
  volume: real("volume").notNull().default(0),
  volume24h: real("volume_24h").notNull().default(0),
  liquidity: real("liquidity").notNull().default(0),
  openInterest: real("open_interest"),
}, (table) => [primaryKey({ columns: [table.marketId, table.observedAt] }), index("prediction_stats_time_idx").on(table.observedAt)]);

export const predictionProbabilityBars = sqliteTable("prediction_probability_bars", {
  tokenId: text("token_id").notNull(),
  interval: text("interval").notNull(),
  bucketAt: integer("bucket_at").notNull(),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  close: real("close").notNull(),
  observations: integer("observations").notNull().default(1),
}, (table) => [primaryKey({ columns: [table.tokenId, table.interval, table.bucketAt] }), index("prediction_bars_time_idx").on(table.bucketAt)]);

export const predictionOrderbookSnapshots = sqliteTable("prediction_orderbook_snapshots", {
  tokenId: text("token_id").notNull(),
  observedAt: integer("observed_at").notNull(),
  bidDepth: real("bid_depth").notNull(),
  askDepth: real("ask_depth").notNull(),
  imbalance: real("imbalance"),
  bestBid: real("best_bid"),
  bestAsk: real("best_ask"),
  levelsJson: text("levels_json"),
}, (table) => [primaryKey({ columns: [table.tokenId, table.observedAt] }), index("prediction_books_time_idx").on(table.observedAt)]);

export const predictionIngestionCheckpoints = sqliteTable("prediction_ingestion_checkpoints", {
  job: text("job").primaryKey(),
  cursor: text("cursor"),
  status: text("status").notNull(),
  rowsWritten: integer("rows_written").notNull().default(0),
  latestDataAt: integer("latest_data_at"),
  updatedAt: integer("updated_at").notNull(),
  error: text("error"),
});

export const predictionEventLinks = sqliteTable("prediction_event_links", {
  eventId: text("event_id").notNull().references(() => predictionEvents.id, { onDelete: "cascade" }),
  instrumentId: text("instrument_id").notNull(),
  rationale: text("rationale").notNull(),
  learnSlug: text("learn_slug").notNull(),
}, (table) => [primaryKey({ columns: [table.eventId, table.instrumentId] })]);
