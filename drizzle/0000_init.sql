CREATE TABLE `catalog_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`default_unit` text NOT NULL,
	`reference_price` integer NOT NULL,
	`is_user_added` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "catalog_items_reference_price_valid" CHECK("catalog_items"."reference_price" >= 1),
	CONSTRAINT "catalog_items_default_unit_valid" CHECK("catalog_items"."default_unit" IN ('unit', 'kg', 'half_kg', 'quarter_kg'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_items_normalized_name_unique` ON `catalog_items` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_id` integer NOT NULL,
	`catalog_item_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`unit_price` integer NOT NULL,
	`manual_price` integer,
	`purchased_price` integer,
	`is_purchased` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "list_items_quantity_valid" CHECK("list_items"."quantity" > 0),
	CONSTRAINT "list_items_unit_valid" CHECK("list_items"."unit" IN ('unit', 'kg', 'half_kg', 'quarter_kg')),
	CONSTRAINT "list_items_unit_price_valid" CHECK("list_items"."unit_price" >= 1),
	CONSTRAINT "list_items_manual_price_valid" CHECK("list_items"."manual_price" IS NULL OR "list_items"."manual_price" >= 1),
	CONSTRAINT "list_items_purchased_price_valid" CHECK("list_items"."purchased_price" IS NULL OR "list_items"."purchased_price" >= 1)
);
--> statement-breakpoint
CREATE INDEX `list_items_list_idx` ON `list_items` (`list_id`);--> statement-breakpoint
CREATE TABLE `list_site_tags` (
	`list_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`list_id`, `tag_id`),
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_date` text NOT NULL,
	`used_date` text,
	`parent_tag_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`parent_tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `price_record_sites` (
	`price_record_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`price_record_id`, `tag_id`),
	FOREIGN KEY (`price_record_id`) REFERENCES `price_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `price_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`catalog_item_id` integer NOT NULL,
	`list_id` integer,
	`parent_tag_id` integer NOT NULL,
	`price` integer NOT NULL,
	`price_basis` text NOT NULL,
	`recorded_date` text NOT NULL,
	`recorded_at` text NOT NULL,
	FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`parent_tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "price_records_price_valid" CHECK("price_records"."price" >= 1),
	CONSTRAINT "price_records_price_basis_valid" CHECK("price_records"."price_basis" IN ('unit', 'kg'))
);
--> statement-breakpoint
CREATE INDEX `price_records_item_date_idx` ON `price_records` (`catalog_item_id`,`recorded_date`);--> statement-breakpoint
CREATE INDEX `price_records_parent_tag_idx` ON `price_records` (`parent_tag_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`slug` text,
	`name` text,
	`color` text,
	`created_at` text NOT NULL,
	CONSTRAINT "tags_kind_valid" CHECK("tags"."kind" IN ('parent', 'site')),
	CONSTRAINT "tags_kind_fields" CHECK(("tags"."kind" = 'parent' AND "tags"."slug" IS NOT NULL) OR ("tags"."kind" = 'site' AND "tags"."name" IS NOT NULL AND "tags"."color" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);