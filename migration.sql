-- Kernex POS Migration Script
-- Safely adds missing tables and columns to existing database
-- Run: mysql -u root -p testkernexpos < migration.sql

-- ============================================================
-- NEW TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS `shops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default shop if table was just created
INSERT IGNORE INTO `shops` (`id`, `name`, `address`, `phone`) VALUES (1, 'Main Shop', '123 Main St, City', '555-0100');

CREATE TABLE IF NOT EXISTS `branches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `branches` (`id`, `shop_id`, `name`, `address`, `phone`) VALUES (1, 1, 'Downtown Branch', '456 Main St, City', '555-0101');

CREATE TABLE IF NOT EXISTS `tax_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `rate` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `tax_rates` (`id`, `shop_id`, `name`, `rate`) VALUES (1, 1, 'VAT', 7.00);

CREATE TABLE IF NOT EXISTS `product_taxes` (
  `product_id` int(11) NOT NULL,
  `tax_rate_id` int(11) NOT NULL,
  PRIMARY KEY (`product_id`, `tax_rate_id`),
  KEY `tax_rate_id` (`tax_rate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `promotions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `product_ids` text DEFAULT NULL,
  `min_purchase` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `loyalty_tiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `min_points` int(11) NOT NULL,
  `point_multiplier` decimal(5,2) NOT NULL DEFAULT 1.00,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `employee_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `branch_id` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `order_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `product_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) DEFAULT NULL,
  `is_base` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `stock_transfers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_branch_id` int(11) NOT NULL,
  `to_branch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `from_branch_id` (`from_branch_id`),
  KEY `to_branch_id` (`to_branch_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- ALTER EXISTING TABLES (add missing columns)
-- ============================================================

-- users: handle password column (may be `password` or `password_hash`), add shop_id, branch_id
-- If column is still named `password`, rename it
SET @has_password_col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password');
SET @s = IF(@has_password_col > 0, 'ALTER TABLE `users` CHANGE COLUMN `password` `password_hash` varchar(255) NOT NULL', 'SELECT 1');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `shop_id` int(11) DEFAULT NULL AFTER `role`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `branch_id` int(11) DEFAULT NULL AFTER `shop_id`;

-- Update existing users with default shop/branch
UPDATE `users` SET `shop_id` = 1, `branch_id` = 1 WHERE `shop_id` IS NULL;

-- categories: add shop_id
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `shop_id` int(11) DEFAULT NULL AFTER `name`;
UPDATE `categories` SET `shop_id` = 1 WHERE `shop_id` IS NULL;

-- products: add original_price, barcode_image_url, shop_id
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `original_price` decimal(10,2) DEFAULT 0.00 AFTER `name`;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `barcode_image_url` varchar(255) DEFAULT NULL AFTER `barcode`;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `shop_id` int(11) DEFAULT NULL AFTER `is_weighted`;
UPDATE `products` SET `original_price` = `price`, `shop_id` = 1 WHERE `shop_id` IS NULL;

-- order_items: add unit_id
ALTER TABLE `order_items` ADD COLUMN IF NOT EXISTS `unit_id` int(11) DEFAULT NULL AFTER `product_id`;

-- orders: add tax_total, branch_id
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `tax_total` decimal(10,2) DEFAULT 0.00 AFTER `total`;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `branch_id` int(11) DEFAULT NULL AFTER `store_id`;
UPDATE `orders` SET `branch_id` = 1 WHERE `branch_id` IS NULL;

-- stores: add branch_id
ALTER TABLE `stores` ADD COLUMN IF NOT EXISTS `branch_id` int(11) DEFAULT NULL AFTER `address`;
UPDATE `stores` SET `branch_id` = 1 WHERE `branch_id` IS NULL;

-- customers: add shop_id
ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `shop_id` int(11) DEFAULT NULL AFTER `barcode`;
UPDATE `customers` SET `shop_id` = 1 WHERE `shop_id` IS NULL;

-- currencies: add branch_id
ALTER TABLE `currencies` ADD COLUMN IF NOT EXISTS `branch_id` int(11) DEFAULT NULL AFTER `exchange_rate`;

-- payment_methods: add branch_id
ALTER TABLE `payment_methods` ADD COLUMN IF NOT EXISTS `branch_id` int(11) DEFAULT NULL AFTER `is_active`;

-- Fix Monster Energy Drink barcode (scanner reads 14903182, old seed had 4901234567916)
UPDATE `products` SET `barcode` = '14903182' WHERE `name` = 'Monster Energy Drink 500ml' AND `barcode` = '4901234567916';

-- Add default admin user if none exists with admin role
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `shop_id`, `branch_id`)
VALUES (2, 'admin', 'admin@example.com', '$2b$10$2guRgwSd4EJXP1DoFegZWeuMK79XQTT/MnEalJt5Ki5xNMoNSvirW', 'admin', 1, 1);

-- Indexes for new columns
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `shop_id` (`shop_id`);
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `branch_id` (`branch_id`);
ALTER TABLE `categories` ADD INDEX IF NOT EXISTS `shop_id` (`shop_id`);
ALTER TABLE `products` ADD INDEX IF NOT EXISTS `shop_id` (`shop_id`);
ALTER TABLE `stores` ADD INDEX IF NOT EXISTS `branch_id` (`branch_id`);
ALTER TABLE `customers` ADD INDEX IF NOT EXISTS `shop_id` (`shop_id`);
ALTER TABLE `orders` ADD INDEX IF NOT EXISTS `branch_id` (`branch_id`);

-- ============================================================
-- FOREIGN KEY CONSTRAINTS (safe add)
-- ============================================================

-- Note: If foreign keys already exist, these will fail harmlessly.
-- Run them separately after verifying state if needed.

-- ALTER TABLE `branches` ADD CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);
-- ALTER TABLE `users` ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);
-- ALTER TABLE `users` ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
-- ALTER TABLE `categories` ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);
-- ALTER TABLE `products` ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);
-- ALTER TABLE `tax_rates` ADD CONSTRAINT `tax_rates_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);
-- ALTER TABLE `product_taxes` ADD CONSTRAINT `product_taxes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
-- ALTER TABLE `product_taxes` ADD CONSTRAINT `product_taxes_ibfk_2` FOREIGN KEY (`tax_rate_id`) REFERENCES `tax_rates` (`id`);
-- ALTER TABLE `stores` ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
-- ALTER TABLE `customers` ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);
-- ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
