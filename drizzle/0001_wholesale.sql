CREATE TABLE `wholesale_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`phone` varchar(64),
	`state` varchar(8),
	`taxId` varchar(128),
	`website` varchar(500),
	`message` text,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `wholesale_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `wholesale_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `channel` enum('retail','wholesale') DEFAULT 'retail' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `wholesaleAccountId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `wholesalePriceCents` int;--> statement-breakpoint
CREATE INDEX `wholesale_status_idx` ON `wholesale_accounts` (`status`);--> statement-breakpoint
CREATE INDEX `order_channel_idx` ON `orders` (`channel`);