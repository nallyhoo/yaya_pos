CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`color` varchar(32) DEFAULT '#6366f1',
	`icon` varchar(64) DEFAULT 'tag',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`loyaltyPoints` int NOT NULL DEFAULT 0,
	`totalSpent` decimal(12,2) NOT NULL DEFAULT '0.00',
	`visitCount` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(256) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`role` enum('admin','cashier','manager') NOT NULL DEFAULT 'cashier',
	`pin` varchar(6),
	`isActive` boolean NOT NULL DEFAULT true,
	`hireDate` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int,
	`type` enum('restock','sale','adjustment','return','damage') NOT NULL,
	`quantityBefore` int NOT NULL,
	`quantityChange` int NOT NULL,
	`quantityAfter` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(256) NOT NULL,
	`productSku` varchar(64),
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`taxRate` decimal(5,2) DEFAULT '0.00',
	`taxAmount` decimal(10,2) DEFAULT '0.00',
	`discountAmount` decimal(10,2) DEFAULT '0.00',
	`lineTotal` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`customerId` int,
	`employeeId` int,
	`shiftId` int,
	`status` enum('pending','completed','refunded','cancelled') NOT NULL DEFAULT 'pending',
	`subtotal` decimal(12,2) NOT NULL,
	`taxAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`discountAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(12,2) NOT NULL,
	`paymentMethod` enum('cash','card','wallet','mixed') NOT NULL,
	`amountPaid` decimal(12,2) NOT NULL,
	`changeGiven` decimal(12,2) DEFAULT '0.00',
	`loyaltyPointsEarned` int DEFAULT 0,
	`loyaltyPointsUsed` int DEFAULT 0,
	`notes` text,
	`receiptPrinted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(64) NOT NULL,
	`barcode` varchar(128),
	`name` varchar(256) NOT NULL,
	`description` text,
	`categoryId` int,
	`price` decimal(10,2) NOT NULL,
	`costPrice` decimal(10,2) DEFAULT '0.00',
	`taxRate` decimal(5,2) DEFAULT '0.00',
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`stockQuantity` int NOT NULL DEFAULT 0,
	`reorderPoint` int NOT NULL DEFAULT 10,
	`unit` varchar(32) DEFAULT 'pcs',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`openingCash` decimal(10,2) DEFAULT '0.00',
	`closingCash` decimal(10,2),
	`totalSales` decimal(12,2) DEFAULT '0.00',
	`transactionCount` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','cashier') NOT NULL DEFAULT 'cashier';--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_shiftId_shifts_id_fk` FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;