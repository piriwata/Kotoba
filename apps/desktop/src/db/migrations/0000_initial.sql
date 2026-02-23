CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` text NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` text,
	`context` text,
	`description` text,
	`local_path` text,
	`size_bytes` integer,
	`checksum` text,
	`downloaded_at` integer,
	`original_model` text,
	`speed` real,
	`accuracy` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`provider`, `id`)
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`language` text DEFAULT 'en',
	`audio_file` text,
	`confidence` real,
	`duration` integer,
	`speech_model` text,
	`formatting_model` text,
	`meta` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `models_provider_idx` ON `models` (`provider`);
--> statement-breakpoint
CREATE INDEX `models_type_idx` ON `models` (`type`);
