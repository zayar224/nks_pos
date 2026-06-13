-- Add category_units table
CREATE TABLE IF NOT EXISTS `category_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `is_base` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `category_units_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Optional: If you want to keep product_units as overrides
-- ALTER TABLE `order_items` 
--   ADD COLUMN `category_unit_id` int(11) DEFAULT NULL,
--   ADD KEY `category_unit_id` (`category_unit_id`);
