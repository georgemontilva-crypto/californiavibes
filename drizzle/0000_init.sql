CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64),
	`topic` varchar(64),
	`message` text NOT NULL,
	`handled` boolean NOT NULL DEFAULT false,
	`ip` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`batch` varchar(128),
	`lab` varchar(255),
	`testedOn` varchar(32),
	`fileUrl` varchar(1024) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(255),
	`sizeBytes` bigint,
	`published` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(32) NOT NULL,
	`status` enum('pending','paid','shipped','delivered','cancelled','refunded','failed') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(32) NOT NULL,
	`transactionId` varchar(64),
	`cardLast4` varchar(16),
	`email` varchar(320) NOT NULL,
	`phone` varchar(64),
	`firstName` varchar(120) NOT NULL,
	`lastName` varchar(120) NOT NULL,
	`address1` varchar(255) NOT NULL,
	`address2` varchar(255),
	`city` varchar(120) NOT NULL,
	`state` varchar(8) NOT NULL,
	`zip` varchar(16) NOT NULL,
	`items` text NOT NULL,
	`subtotalCents` int NOT NULL,
	`shippingCents` int NOT NULL,
	`totalCents` int NOT NULL,
	`customerNote` text,
	`adminNote` text,
	`trackingNumber` varchar(128),
	`paymentError` varchar(500),
	`ip` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(255) NOT NULL,
	`collection` varchar(255),
	`subtitle` varchar(255),
	`strain` enum('indica','sativa','hybrid'),
	`accentColor` varchar(16),
	`description` text,
	`facts` text,
	`imageUrl` varchar(1024),
	`imageKey` varchar(512),
	`priceCents` int NOT NULL DEFAULT 0,
	`compareAtCents` int,
	`inStock` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` varchar(128) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`posterUrl` varchar(1024),
	`posterKey` varchar(512),
	`sizeBytes` bigint,
	`featured` boolean NOT NULL DEFAULT false,
	`published` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `contact_created_idx` ON `contact_messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `contact_handled_idx` ON `contact_messages` (`handled`);--> statement-breakpoint
CREATE INDEX `lab_report_product_idx` ON `lab_reports` (`productId`);--> statement-breakpoint
CREATE INDEX `lab_report_published_idx` ON `lab_reports` (`published`);--> statement-breakpoint
CREATE INDEX `lab_report_batch_idx` ON `lab_reports` (`batch`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `order_email_idx` ON `orders` (`email`);--> statement-breakpoint
CREATE INDEX `order_created_idx` ON `orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `product_collection_idx` ON `products` (`collection`);--> statement-breakpoint
CREATE INDEX `product_sort_idx` ON `products` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `video_published_idx` ON `videos` (`published`);