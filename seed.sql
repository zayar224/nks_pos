-- Kernex POS Sample Seed Data
-- Run AFTER migration.sql: mysql -u root -p testkernexpos < seed.sql

-- ============================================================
-- PREREQUISITES: ensure reference tables have base rows
-- ============================================================

INSERT IGNORE INTO `categories` (`id`, `name`, `shop_id`) VALUES
(1, 'Beverages', 1),
(2, 'Food', 1),
(3, 'Snacks', 1);

INSERT IGNORE INTO `currencies` (`id`, `code`, `exchange_rate`) VALUES
(1, 'USD', 1.0000),
(2, 'EUR', 0.8500);

INSERT IGNORE INTO `payment_methods` (`id`, `name`, `is_active`) VALUES
(1, 'Cash', 1),
(2, 'Card', 1),
(3, 'Digital', 1);

-- ============================================================
-- EXTRA CATEGORIES
-- ============================================================

INSERT IGNORE INTO `categories` (`id`, `name`, `shop_id`) VALUES
(4, 'Liquor', 1),
(5, 'Beer & Cider', 1),
(6, 'Wine', 1),
(7, 'Non-Alcoholic', 1);

-- ============================================================
-- LIQUOR / SPIRITS
-- ============================================================
INSERT IGNORE INTO `products` (`id`, `name`, `original_price`, `price`, `stock`, `category_id`, `barcode`, `is_weighted`, `shop_id`) VALUES
(10, 'Johnnie Walker Black Label 12yr 700ml', 45.00, 52.00, 24, 4, '4901234567890', 0, 1),
(11, 'Johnnie Walker Red Label 700ml', 28.00, 33.00, 30, 4, '4901234567891', 0, 1),
(12, 'Chivas Regal 12yr 700ml', 38.00, 45.00, 18, 4, '4901234567892', 0, 1),
(13, 'Jameson Irish Whiskey 700ml', 32.00, 38.00, 22, 4, '4901234567893', 0, 1),
(14, 'Absolut Vodka 700ml', 22.00, 27.00, 35, 4, '4901234567894', 0, 1),
(15, 'Smirnoff Vodka 700ml', 18.00, 22.00, 40, 4, '4901234567895', 0, 1),
(16, 'Bacardi Carta Blanca Rum 700ml', 20.00, 25.00, 28, 4, '4901234567896', 0, 1),
(17, 'Captain Morgan Spiced Rum 700ml', 22.00, 27.00, 26, 4, '4901234567897', 0, 1),
(18, 'Gordon\'s London Dry Gin 700ml', 16.00, 20.00, 32, 4, '4901234567898', 0, 1),
(19, 'Hennessy VS Cognac 700ml', 42.00, 50.00, 15, 4, '4901234567899', 0, 1);

-- Beer & Cider
INSERT IGNORE INTO `products` (`id`, `name`, `original_price`, `price`, `stock`, `category_id`, `barcode`, `is_weighted`, `shop_id`) VALUES
(20, 'Heineken Lager Beer 330ml Can', 1.50, 2.00, 200, 5, '4901234567900', 0, 1),
(21, 'Heineken Lager Beer 6 Pack', 8.00, 10.50, 40, 5, '4901234567901', 0, 1),
(22, 'Chang Beer 330ml Can', 1.20, 1.80, 250, 5, '4901234567902', 0, 1),
(23, 'Chang Beer 6 Pack', 6.50, 9.00, 50, 5, '4901234567903', 0, 1),
(24, 'Guinness Draught 440ml Can', 2.50, 3.50, 100, 5, '4901234567904', 0, 1),
(25, 'Corona Extra 355ml Bottle', 2.00, 3.00, 120, 5, '4901234567905', 0, 1),
(26, 'Strongbow Cider 500ml Can', 2.00, 2.80, 80, 5, '4901234567906', 0, 1);

-- Wine
INSERT IGNORE INTO `products` (`id`, `name`, `original_price`, `price`, `stock`, `category_id`, `barcode`, `is_weighted`, `shop_id`) VALUES
(27, 'Jacob\'s Creek Shiraz 750ml', 12.00, 16.00, 30, 6, '4901234567907', 0, 1),
(28, 'Jacob\'s Creek Chardonnay 750ml', 12.00, 16.00, 28, 6, '4901234567908', 0, 1),
(29, 'Yellow Tail Shiraz 750ml', 10.00, 14.00, 25, 6, '4901234567909', 0, 1),
(30, 'Moët & Chandon Brut Champagne 750ml', 45.00, 55.00, 10, 6, '4901234567910', 0, 1);

-- Non-Alcoholic
INSERT IGNORE INTO `products` (`id`, `name`, `original_price`, `price`, `stock`, `category_id`, `barcode`, `is_weighted`, `shop_id`) VALUES
(31, 'Coca-Cola 330ml Can', 0.80, 1.20, 300, 7, '4901234567911', 0, 1),
(32, 'Coca-Cola 1.5L Bottle', 1.50, 2.00, 150, 7, '4901234567912', 0, 1),
(33, 'Sprite 330ml Can', 0.80, 1.20, 280, 7, '4901234567913', 0, 1),
(34, 'Evian Spring Water 500ml', 1.00, 1.50, 200, 7, '4901234567914', 0, 1),
(35, 'Red Bull Energy Drink 250ml', 2.00, 3.00, 180, 7, '4901234567915', 0, 1),
(36, 'Monster Energy Drink 500ml', 2.50, 3.50, 120, 7, '14903182', 0, 1);

-- Snacks (new)
INSERT IGNORE INTO `products` (`id`, `name`, `original_price`, `price`, `stock`, `category_id`, `barcode`, `is_weighted`, `shop_id`) VALUES
(37, 'Lay\'s Classic Chips 40g', 0.80, 1.50, 200, 3, '4901234567917', 0, 1),
(38, 'Lay\'s Sour Cream & Onion 40g', 0.80, 1.50, 180, 3, '4901234567918', 0, 1),
(39, 'Pringles Original 110g', 2.00, 3.00, 100, 3, '4901234567919', 0, 1),
(40, 'Oreo Cookies 154g', 1.50, 2.50, 120, 3, '4901234567920', 0, 1);

-- Update existing products with better names
UPDATE `products` SET `original_price` = 3.00, `price` = 3.99, `stock` = 94 WHERE `id` = 1;
UPDATE `products` SET `name` = 'Grilled Chicken Sandwich', `original_price` = 5.00, `price` = 5.99, `stock` = 50 WHERE `id` = 2;
UPDATE `products` SET `name` = 'Fresh Orange Juice 500ml', `original_price` = 2.00, `price` = 2.99, `stock` = 80, `category_id` = 7 WHERE `id` = 3;

-- Insert sample customers
INSERT IGNORE INTO `customers` (`id`, `name`, `email`, `phone`, `loyalty_points`, `ewallet_balance`, `barcode`, `shop_id`) VALUES
(3, 'Alice Johnson', 'alice@example.com', '555-0102', 250, 100.00, 'CUST789', 1),
(4, 'Bob Williams', 'bob@example.com', '555-0103', 75, 25.00, 'CUST012', 1),
(5, 'Charlie Brown', 'charlie@example.com', '555-0104', 500, 200.00, 'CUST345', 1);

-- Insert sample orders with liquor products
INSERT IGNORE INTO `orders` (`id`, `total`, `created_at`, `customer_id`, `discount`, `currency_id`, `status`, `store_id`, `branch_id`) VALUES
(20, 52.00, '2025-06-10 10:30:00', 1, 0.00, 1, 'completed', 1, 1),
(21, 31.50, '2025-06-10 14:15:00', 3, 5.00, 1, 'completed', 1, 1),
(22, 10.50, '2025-06-11 09:00:00', NULL, 0.00, 1, 'completed', 1, 1),
(23, 156.00, '2025-06-11 16:45:00', 4, 10.00, 1, 'preparing', 1, 1),
(24, 27.00, '2025-06-12 11:30:00', 2, 0.00, 1, 'pending', 1, 1);

INSERT IGNORE INTO `order_items` (`order_id`, `product_id`, `quantity`) VALUES
(20, 10, 1),
(21, 20, 6),
(21, 31, 2),
(22, 21, 1),
(23, 12, 2),
(23, 19, 1),
(23, 30, 1),
(24, 15, 1),
(24, 18, 1);

INSERT IGNORE INTO `order_payments` (`order_id`, `payment_method_id`, `amount`) VALUES
(20, 1, 52.00),
(21, 2, 36.50),
(22, 1, 10.50),
(23, 2, 156.00);

INSERT IGNORE INTO `order_status_logs` (`order_id`, `status`, `changed_by`) VALUES
(20, 'completed', 1),
(21, 'completed', 1),
(22, 'completed', 1),
(23, 'preparing', 1);

-- Heineken: single can (base) and 6 pack
INSERT IGNORE INTO `product_units` (`id`, `product_id`, `name`, `quantity`, `price`, `is_base`) VALUES
(1, 20, 'Single Can', 1, NULL, 1),
(2, 20, '6 Pack', 6, 10.50, 0),
(3, 20, 'Case (24)', 24, 38.00, 0);

-- Chang: single can (base) and 6 pack
INSERT IGNORE INTO `product_units` (`id`, `product_id`, `name`, `quantity`, `price`, `is_base`) VALUES
(4, 22, 'Single Can', 1, NULL, 1),
(5, 22, '6 Pack', 6, 9.00, 0),
(6, 22, 'Case (24)', 24, 32.00, 0);

-- Johnnie Walker Black Label: bottle (base)
INSERT IGNORE INTO `product_units` (`id`, `product_id`, `name`, `quantity`, `price`, `is_base`) VALUES
(7, 10, 'Bottle', 1, NULL, 1);

-- Coca-Cola: can and bottle
INSERT IGNORE INTO `product_units` (`id`, `product_id`, `name`, `quantity`, `price`, `is_base`) VALUES
(9, 31, 'Can', 1, NULL, 1),
(10, 31, '6 Pack Cans', 6, 6.00, 0);

INSERT IGNORE INTO `product_units` (`id`, `product_id`, `name`, `quantity`, `price`, `is_base`) VALUES
(11, 32, '1.5L Bottle', 1, NULL, 1);
