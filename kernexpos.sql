-- Kernex POS Database Schema
-- Server version: 10.4.28-MariaDB

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `testkernexpos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `testkernexpos`;

-- --------------------------------------------------------
-- Table structure for table `shops`
-- --------------------------------------------------------
CREATE TABLE `shops` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `shops` (`id`, `name`, `address`, `phone`, `logo_url`) VALUES
(1, 'Main Shop', '123 Main St, City', '555-0100', NULL);

-- --------------------------------------------------------
-- Table structure for table `branches`
-- --------------------------------------------------------
CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `branches` (`id`, `shop_id`, `name`, `address`, `phone`) VALUES
(1, 1, 'Downtown Branch', '456 Main St, City', '555-0101');

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'cashier',
  `shop_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- password for testuser is "password123"
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `shop_id`, `branch_id`) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$2guRgwSd4EJXP1DoFegZWeuMK79XQTT/MnEalJt5Ki5xNMoNSvirW', 'admin', 1, 1),
(2, 'cashier', 'cashier@example.com', '$2b$10$2guRgwSd4EJXP1DoFegZWeuMK79XQTT/MnEalJt5Ki5xNMoNSvirW', 'cashier', 1, 1);

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `shop_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `categories` (`id`, `name`, `shop_id`) VALUES
(1, 'Beverages', 1),
(2, 'Food', 1),
(3, 'Snacks', 1);

-- --------------------------------------------------------
-- Table structure for table `products`
-- --------------------------------------------------------
CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `original_price` decimal(10,2) DEFAULT 0.00,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `barcode_image_url` varchar(255) DEFAULT NULL,
  `is_weighted` tinyint(1) DEFAULT 0,
  `shop_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `products` (`id`, `name`, `original_price`, `price`, `stock`, `category_id`, `image_url`, `barcode`, `is_weighted`, `shop_id`) VALUES
(1, 'Coffee', 3.50, 3.99, 94, 1, NULL, 'PROD123', 0, 1),
(2, 'Sandwich', 5.50, 5.99, 50, 2, NULL, 'PROD456', 0, 1),
(3, 'Juice', 2.50, 2.99, 80, 1, NULL, 'PROD789', 1, 1);

-- --------------------------------------------------------
-- Table structure for table `tax_rates`
-- --------------------------------------------------------
CREATE TABLE `tax_rates` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `rate` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tax_rates` (`id`, `shop_id`, `name`, `rate`) VALUES
(1, 1, 'VAT', 7.00);

-- --------------------------------------------------------
-- Table structure for table `product_taxes`
-- --------------------------------------------------------
CREATE TABLE `product_taxes` (
  `product_id` int(11) NOT NULL,
  `tax_rate_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `stores`
-- --------------------------------------------------------
CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `stores` (`id`, `name`, `address`, `branch_id`) VALUES
(1, 'Main Store', '123 Main St, City', 1),
(2, 'Branch Store', '456 Branch Rd, City', 1);

-- --------------------------------------------------------
-- Table structure for table `receipt_settings`
-- --------------------------------------------------------
CREATE TABLE `receipt_settings` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `header_text` text DEFAULT NULL,
  `footer_text` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `receipt_settings` (`id`, `store_id`, `logo_url`, `header_text`, `footer_text`) VALUES
(1, 1, NULL, 'Welcome to Kernex PoS!', 'Thank you for shopping! Visit again!');

-- --------------------------------------------------------
-- Table structure for table `currencies`
-- --------------------------------------------------------
CREATE TABLE `currencies` (
  `id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `exchange_rate` decimal(10,4) NOT NULL DEFAULT 1.0000,
  `branch_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `currencies` (`id`, `code`, `exchange_rate`) VALUES
(1, 'USD', 1.0000),
(2, 'EUR', 0.8500);

-- --------------------------------------------------------
-- Table structure for table `payment_methods`
-- --------------------------------------------------------
CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `branch_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `payment_methods` (`id`, `name`, `is_active`) VALUES
(1, 'Cash', 1),
(2, 'Card', 1),
(3, 'Digital', 1);

-- --------------------------------------------------------
-- Table structure for table `customers`
-- --------------------------------------------------------
CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `loyalty_points` int(11) DEFAULT 0,
  `ewallet_balance` decimal(10,2) DEFAULT 0.00,
  `barcode` varchar(50) DEFAULT NULL,
  `shop_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `customers` (`id`, `name`, `email`, `phone`, `loyalty_points`, `ewallet_balance`, `barcode`, `shop_id`) VALUES
(1, 'John Doe', 'john@example.com', '123-456-7890', 100, 50.00, 'CUST123', 1),
(2, 'Jane Smith', 'jane@example.com', '098-765-4321', 50, 0.00, 'CUST456', 1);

-- --------------------------------------------------------
-- Table structure for table `orders`
-- --------------------------------------------------------
CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `tax_total` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `customer_id` int(11) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `currency_id` int(11) DEFAULT 1,
  `is_refunded` tinyint(1) DEFAULT 0,
  `is_online` tinyint(1) DEFAULT 0,
  `pickup_time` datetime DEFAULT NULL,
  `store_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `status` enum('pending','preparing','prepared','completed','cancelled') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `orders` (`id`, `total`, `created_at`, `customer_id`, `discount`, `currency_id`, `is_refunded`, `is_online`, `pickup_time`, `store_id`, `branch_id`, `status`) VALUES
(2, 3.99, '2025-06-01 02:11:01', NULL, 0.00, 1, 1, 0, NULL, 1, 1, 'cancelled'),
(3, 3.99, '2025-06-01 06:20:17', NULL, 0.00, 1, 0, 0, NULL, 1, 1, 'completed'),
(4, 15.99, '2025-06-02 11:01:50', 1, 0.00, 1, 0, 1, '2025-06-03 14:00:00', 1, 1, 'completed'),
(5, 22.50, '2025-06-02 11:01:50', 2, 5.00, 1, 0, 1, '2025-06-03 15:00:00', 2, 1, 'prepared'),
(13, 11.98, '2025-06-03 05:39:39', NULL, 0.00, 1, 0, 0, NULL, 1, 1, 'completed'),
(14, 19.95, '2025-06-03 11:16:55', NULL, 0.00, 1, 0, 0, NULL, 1, 1, 'completed');

-- --------------------------------------------------------
-- Table structure for table `product_units`
-- --------------------------------------------------------
CREATE TABLE `product_units` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) DEFAULT NULL,
  `is_base` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `order_items`
-- --------------------------------------------------------
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `customer_note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `discount`, `customer_note`) VALUES
(2, 2, 1, 1, 0.00, NULL),
(3, 3, 1, 1, 0.00, NULL),
(4, 4, 1, 2, 0.00, NULL),
(5, 4, 3, 1, 0.00, NULL),
(6, 5, 2, 3, 0.00, NULL),
(7, 13, 2, 2, 0.00, NULL),
(8, 14, 1, 5, 0.00, NULL);

-- --------------------------------------------------------
-- Table structure for table `order_payments`
-- --------------------------------------------------------
CREATE TABLE `order_payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `payment_method_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `order_payments` (`id`, `order_id`, `payment_method_id`, `amount`) VALUES
(2, 2, 1, 10.00),
(3, 3, 1, 4.00),
(4, 13, 1, 12.00),
(5, 14, 1, 20.00);

-- --------------------------------------------------------
-- Table structure for table `order_status_logs`
-- --------------------------------------------------------
CREATE TABLE `order_status_logs` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `changed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `order_status_logs` (`id`, `order_id`, `status`, `changed_at`, `changed_by`) VALUES
(13, 4, 'completed', '2025-06-03 05:32:30', 1),
(14, 13, 'completed', '2025-06-03 05:39:39', 1),
(15, 14, 'completed', '2025-06-03 11:16:55', 1);

-- --------------------------------------------------------
-- Table structure for table `refunds`
-- --------------------------------------------------------
CREATE TABLE `refunds` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `refunds` (`id`, `order_id`, `amount`, `reason`, `created_at`) VALUES
(1, 2, 3.99, 'test', '2025-06-01 06:12:29');

-- --------------------------------------------------------
-- Table structure for table `promotions`
-- --------------------------------------------------------
CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `product_ids` text DEFAULT NULL,
  `min_purchase` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `loyalty_tiers`
-- --------------------------------------------------------
CREATE TABLE `loyalty_tiers` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `min_points` int(11) NOT NULL,
  `point_multiplier` decimal(5,2) NOT NULL DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `employee_attendance`
-- --------------------------------------------------------
CREATE TABLE `employee_attendance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `audit_logs`
-- --------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `order_audit_logs`
-- --------------------------------------------------------
CREATE TABLE `order_audit_logs` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `stock_transfers`
-- --------------------------------------------------------
CREATE TABLE `stock_transfers` (
  `id` int(11) NOT NULL,
  `from_branch_id` int(11) NOT NULL,
  `to_branch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

ALTER TABLE `shops`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `branch_id` (`branch_id`);

ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `shop_id` (`shop_id`);

ALTER TABLE `tax_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

ALTER TABLE `product_taxes`
  ADD PRIMARY KEY (`product_id`, `tax_rate_id`),
  ADD KEY `tax_rate_id` (`tax_rate_id`);

ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_id` (`branch_id`);

ALTER TABLE `receipt_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `shop_id` (`shop_id`);

ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `currency_id` (`currency_id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `branch_id` (`branch_id`);

ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `unit_id` (`unit_id`);

ALTER TABLE `product_units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

ALTER TABLE `order_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_method_id` (`payment_method_id`),
  ADD KEY `order_id` (`order_id`);

ALTER TABLE `order_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `changed_by` (`changed_by`);

ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

ALTER TABLE `loyalty_tiers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

ALTER TABLE `employee_attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `branch_id` (`branch_id`);

ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `order_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

ALTER TABLE `stock_transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `from_branch_id` (`from_branch_id`),
  ADD KEY `to_branch_id` (`to_branch_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT
--

ALTER TABLE `shops` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `branches` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `users` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `categories` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `products` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `tax_rates` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `stores` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `receipt_settings` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `currencies` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `payment_methods` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `customers` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `orders` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
ALTER TABLE `order_items` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
ALTER TABLE `product_units` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `order_payments` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
ALTER TABLE `order_status_logs` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
ALTER TABLE `refunds` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `promotions` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `loyalty_tiers` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `employee_attendance` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `audit_logs` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `order_audit_logs` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `stock_transfers` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Foreign key constraints
--

ALTER TABLE `branches`
  ADD CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

ALTER TABLE `tax_rates`
  ADD CONSTRAINT `tax_rates_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

ALTER TABLE `product_taxes`
  ADD CONSTRAINT `product_taxes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `product_taxes_ibfk_2` FOREIGN KEY (`tax_rate_id`) REFERENCES `tax_rates` (`id`);

ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

ALTER TABLE `receipt_settings`
  ADD CONSTRAINT `receipt_settings_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);

ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `product_units` (`id`);

ALTER TABLE `product_units`
  ADD CONSTRAINT `product_units_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `order_payments`
  ADD CONSTRAINT `order_payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_payments_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`);

ALTER TABLE `order_status_logs`
  ADD CONSTRAINT `order_status_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_status_logs_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);

ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

ALTER TABLE `promotions`
  ADD CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

ALTER TABLE `loyalty_tiers`
  ADD CONSTRAINT `loyalty_tiers_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`);

ALTER TABLE `employee_attendance`
  ADD CONSTRAINT `employee_attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `employee_attendance_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `order_audit_logs`
  ADD CONSTRAINT `order_audit_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

ALTER TABLE `stock_transfers`
  ADD CONSTRAINT `stock_transfers_ibfk_1` FOREIGN KEY (`from_branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `stock_transfers_ibfk_2` FOREIGN KEY (`to_branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `stock_transfers_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

COMMIT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
