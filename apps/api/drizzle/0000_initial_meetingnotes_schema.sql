CREATE TABLE `action_items` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`task` text NOT NULL,
	`assignee` text,
	`due_date_text` text,
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `action_items_meeting_id_idx` ON `action_items` (`meeting_id`);--> statement-breakpoint
CREATE TABLE `captures` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`audio_filename` text,
	`started_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	`failed_at` integer,
	`failure_code` text,
	`output_language` text,
	`requested_title` text,
	CONSTRAINT "captures_status_check" CHECK("captures"."status" IN ('starting', 'capturing', 'stopping', 'ready', 'transcribing', 'summarizing', 'completed', 'failed')),
	CONSTRAINT "captures_language_check" CHECK("captures"."output_language" IS NULL OR "captures"."output_language" IN ('es', 'en'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `captures_audio_filename_unique` ON `captures` (`audio_filename`);--> statement-breakpoint
CREATE INDEX `captures_status_failed_at_idx` ON `captures` (`status`,`failed_at`);--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`capture_id` text NOT NULL,
	`title` text,
	`output_language` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`capture_id`) REFERENCES `captures`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "meetings_language_check" CHECK("meetings"."output_language" IN ('es', 'en'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meetings_capture_id_unique` ON `meetings` (`capture_id`);--> statement-breakpoint
CREATE INDEX `meetings_created_id_idx` ON `meetings` (`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `processing_staging` (
	`capture_id` text PRIMARY KEY NOT NULL,
	`summary` text NOT NULL,
	`action_items_json` text NOT NULL,
	`staged_at` integer NOT NULL,
	FOREIGN KEY (`capture_id`) REFERENCES `captures`(`id`) ON UPDATE no action ON DELETE cascade
);
