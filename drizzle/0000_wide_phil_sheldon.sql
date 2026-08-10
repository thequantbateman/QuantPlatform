CREATE TABLE `prediction_event_links` (
	`event_id` text NOT NULL,
	`instrument_id` text NOT NULL,
	`rationale` text NOT NULL,
	`learn_slug` text NOT NULL,
	PRIMARY KEY(`event_id`, `instrument_id`),
	FOREIGN KEY (`event_id`) REFERENCES `prediction_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prediction_events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Other' NOT NULL,
	`series_id` text,
	`resolution_source` text DEFAULT '' NOT NULL,
	`start_at` integer,
	`end_at` integer,
	`active` integer DEFAULT true NOT NULL,
	`closed` integer DEFAULT false NOT NULL,
	`negative_risk` integer DEFAULT false NOT NULL,
	`volume` real DEFAULT 0 NOT NULL,
	`liquidity` real DEFAULT 0 NOT NULL,
	`open_interest` real,
	`source_url` text NOT NULL,
	`provider_updated_at` integer NOT NULL,
	`persisted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prediction_events_slug_uq` ON `prediction_events` (`slug`);--> statement-breakpoint
CREATE INDEX `prediction_events_active_idx` ON `prediction_events` (`active`,`volume`);--> statement-breakpoint
CREATE TABLE `prediction_ingestion_checkpoints` (
	`job` text PRIMARY KEY NOT NULL,
	`cursor` text,
	`status` text NOT NULL,
	`rows_written` integer DEFAULT 0 NOT NULL,
	`latest_data_at` integer,
	`updated_at` integer NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `prediction_markets` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`condition_id` text NOT NULL,
	`slug` text NOT NULL,
	`question` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`closed` integer DEFAULT false NOT NULL,
	`accepting_orders` integer DEFAULT false NOT NULL,
	`negative_risk` integer DEFAULT false NOT NULL,
	`min_tick_size` real,
	`min_order_size` real,
	`volume` real DEFAULT 0 NOT NULL,
	`volume_24h` real DEFAULT 0 NOT NULL,
	`liquidity` real DEFAULT 0 NOT NULL,
	`best_bid` real,
	`best_ask` real,
	`last_trade_price` real,
	`change_1d` real,
	`change_1w` real,
	`end_at` integer,
	`provider_updated_at` integer NOT NULL,
	`persisted_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `prediction_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prediction_markets_condition_uq` ON `prediction_markets` (`condition_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `prediction_markets_slug_uq` ON `prediction_markets` (`slug`);--> statement-breakpoint
CREATE INDEX `prediction_markets_event_idx` ON `prediction_markets` (`event_id`);--> statement-breakpoint
CREATE INDEX `prediction_markets_activity_idx` ON `prediction_markets` (`active`,`volume_24h`);--> statement-breakpoint
CREATE TABLE `prediction_orderbook_snapshots` (
	`token_id` text NOT NULL,
	`observed_at` integer NOT NULL,
	`bid_depth` real NOT NULL,
	`ask_depth` real NOT NULL,
	`imbalance` real,
	`best_bid` real,
	`best_ask` real,
	`levels_json` text,
	PRIMARY KEY(`token_id`, `observed_at`)
);
--> statement-breakpoint
CREATE INDEX `prediction_books_time_idx` ON `prediction_orderbook_snapshots` (`observed_at`);--> statement-breakpoint
CREATE TABLE `prediction_outcomes` (
	`market_id` text NOT NULL,
	`outcome_index` integer NOT NULL,
	`label` text NOT NULL,
	`token_id` text NOT NULL,
	`latest_price` real,
	`persisted_at` integer NOT NULL,
	PRIMARY KEY(`market_id`, `outcome_index`),
	FOREIGN KEY (`market_id`) REFERENCES `prediction_markets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prediction_outcomes_token_uq` ON `prediction_outcomes` (`token_id`);--> statement-breakpoint
CREATE INDEX `prediction_outcomes_market_idx` ON `prediction_outcomes` (`market_id`);--> statement-breakpoint
CREATE TABLE `prediction_probability_bars` (
	`token_id` text NOT NULL,
	`interval` text NOT NULL,
	`bucket_at` integer NOT NULL,
	`open` real NOT NULL,
	`high` real NOT NULL,
	`low` real NOT NULL,
	`close` real NOT NULL,
	`observations` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`token_id`, `interval`, `bucket_at`)
);
--> statement-breakpoint
CREATE INDEX `prediction_bars_time_idx` ON `prediction_probability_bars` (`bucket_at`);--> statement-breakpoint
CREATE TABLE `prediction_quotes` (
	`token_id` text NOT NULL,
	`observed_at` integer NOT NULL,
	`market_id` text NOT NULL,
	`bid` real,
	`ask` real,
	`mid` real,
	`spread` real,
	`last` real,
	`source_event` text NOT NULL,
	PRIMARY KEY(`token_id`, `observed_at`)
);
--> statement-breakpoint
CREATE INDEX `prediction_quotes_market_time_idx` ON `prediction_quotes` (`market_id`,`observed_at`);--> statement-breakpoint
CREATE TABLE `prediction_stats` (
	`market_id` text NOT NULL,
	`observed_at` integer NOT NULL,
	`volume` real DEFAULT 0 NOT NULL,
	`volume_24h` real DEFAULT 0 NOT NULL,
	`liquidity` real DEFAULT 0 NOT NULL,
	`open_interest` real,
	PRIMARY KEY(`market_id`, `observed_at`)
);
--> statement-breakpoint
CREATE INDEX `prediction_stats_time_idx` ON `prediction_stats` (`observed_at`);--> statement-breakpoint
CREATE TABLE `prediction_trades` (
	`identity` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`token_id` text NOT NULL,
	`observed_at` integer NOT NULL,
	`price` real NOT NULL,
	`size` real NOT NULL,
	`side` text NOT NULL,
	`transaction_hash` text
);
--> statement-breakpoint
CREATE INDEX `prediction_trades_market_time_idx` ON `prediction_trades` (`market_id`,`observed_at`);