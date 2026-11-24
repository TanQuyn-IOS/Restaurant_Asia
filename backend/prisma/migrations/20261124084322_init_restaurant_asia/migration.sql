-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `name` ENUM('ADMIN', 'CASHIER', 'KITCHEN', 'WAITER', 'HR_MANAGER', 'CUSTOMER') NOT NULL,
    `title` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role_id` VARCHAR(36) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_activated` BOOLEAN NOT NULL DEFAULT false,
    `must_change_password` BOOLEAN NOT NULL DEFAULT true,
    `token_version` INTEGER NOT NULL DEFAULT 0,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `family` VARCHAR(36) NOT NULL,
    `is_revoked` BOOLEAN NOT NULL DEFAULT false,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_family_idx`(`family`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `token_type` ENUM('ACTIVATION', 'PASSWORD_RESET') NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    INDEX `password_reset_tokens_token_hash_idx`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_name` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(50) NOT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entity_name_entity_id_idx`(`entity_name`, `entity_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `role_title` VARCHAR(50) NOT NULL,
    `shift_default` VARCHAR(50) NULL,
    `salary_rate` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `salary_type` ENUM('MONTHLY', 'HOURLY') NOT NULL DEFAULT 'MONTHLY',
    `status` ENUM('ACTIVE', 'ON_BREAK', 'OFF') NOT NULL DEFAULT 'ACTIVE',
    `join_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orders_handled` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_schedules` (
    `id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `shift_date` DATE NOT NULL,
    `shift_name` VARCHAR(50) NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `is_attended` BOOLEAN NOT NULL DEFAULT false,
    `check_in_at` DATETIME(3) NULL,
    `check_out_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `employee_schedules_employee_id_idx`(`employee_id`),
    INDEX `employee_schedules_shift_date_idx`(`shift_date`),
    INDEX `employee_schedules_start_time_end_time_idx`(`start_time`, `end_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `leave_type` ENUM('ANNUAL', 'SICK', 'FAMILY', 'COMPENSATORY') NOT NULL DEFAULT 'ANNUAL',
    `reason` VARCHAR(255) NOT NULL,
    `approved_by_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `leave_requests_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `customer_type` ENUM('WALK_IN', 'REGULAR', 'VIP', 'GROUP') NOT NULL DEFAULT 'WALK_IN',
    `loyalty_points` INTEGER NOT NULL DEFAULT 0,
    `total_spent` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_user_id_key`(`user_id`),
    UNIQUE INDEX `customers_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table_areas` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `table_areas_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tables` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `area_id` VARCHAR(36) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 4,
    `shape` ENUM('ROUND', 'SQUARE', 'RECTANGLE') NOT NULL DEFAULT 'SQUARE',
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING') NOT NULL DEFAULT 'AVAILABLE',
    `pos_x` DOUBLE NOT NULL DEFAULT 0,
    `pos_y` DOUBLE NOT NULL DEFAULT 0,
    `width` DOUBLE NOT NULL DEFAULT 90,
    `height` DOUBLE NOT NULL DEFAULT 90,
    `occupied_since` DATETIME(3) NULL,
    `customer_type` ENUM('WALK_IN', 'REGULAR', 'VIP', 'GROUP') NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tables_area_id_idx`(`area_id`),
    INDEX `tables_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservations` (
    `id` VARCHAR(36) NOT NULL,
    `table_id` VARCHAR(36) NOT NULL,
    `customer_id` VARCHAR(36) NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `guest_count` INTEGER NOT NULL DEFAULT 2,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `customer_type` ENUM('WALK_IN', 'REGULAR', 'VIP', 'GROUP') NOT NULL DEFAULT 'REGULAR',
    `status` ENUM('CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'CONFIRMED',
    `notes` VARCHAR(255) NULL,
    `created_by_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reservations_table_id_idx`(`table_id`),
    INDEX `reservations_start_time_end_time_idx`(`start_time`, `end_time`),
    INDEX `reservations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` VARCHAR(36) NOT NULL,
    `category_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `unit` VARCHAR(20) NOT NULL DEFAULT 'phần',
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `prep_time_minutes` INTEGER NOT NULL DEFAULT 15,
    `spicy_level` INTEGER NOT NULL DEFAULT 0,
    `tags` VARCHAR(255) NULL,
    `is_popular` BOOLEAN NOT NULL DEFAULT false,
    `tax_rate_override` DECIMAL(5, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `menu_items_category_id_idx`(`category_id`),
    INDEX `menu_items_is_available_idx`(`is_available`),
    INDEX `menu_items_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingredients` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `base_unit` VARCHAR(20) NOT NULL,
    `current_stock` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `min_stock_level` DECIMAL(12, 3) NOT NULL DEFAULT 5,
    `cost_per_unit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `allow_negative_stock` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ingredients_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_conversions` (
    `id` VARCHAR(36) NOT NULL,
    `ingredient_id` VARCHAR(36) NOT NULL,
    `from_unit` VARCHAR(20) NOT NULL,
    `to_unit` VARCHAR(20) NOT NULL,
    `conversion_rate` DECIMAL(10, 4) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `unit_conversions_ingredient_id_from_unit_key`(`ingredient_id`, `from_unit`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recipes` (
    `id` VARCHAR(36) NOT NULL,
    `menu_item_id` VARCHAR(36) NOT NULL,
    `ingredient_id` VARCHAR(36) NOT NULL,
    `quantity_required` DECIMAL(10, 3) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recipes_menu_item_id_ingredient_id_key`(`menu_item_id`, `ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_configs` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `effective_from` DATETIME(3) NOT NULL,
    `effective_to` DATETIME(3) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `category_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tax_configs_code_key`(`code`),
    INDEX `tax_configs_effective_from_effective_to_idx`(`effective_from`, `effective_to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `table_id` VARCHAR(36) NOT NULL,
    `customer_id` VARCHAR(36) NULL,
    `served_by_id` VARCHAR(36) NULL,
    `customer_name` VARCHAR(100) NULL,
    `customer_phone` VARCHAR(20) NULL,
    `customer_type` ENUM('WALK_IN', 'REGULAR', 'VIP', 'GROUP') NOT NULL DEFAULT 'WALK_IN',
    `customer_count` INTEGER NOT NULL DEFAULT 2,
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `tax_percent` DECIMAL(5, 2) NOT NULL DEFAULT 8,
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `final_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `payment_status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `notes` VARCHAR(255) NULL,
    `parent_order_id` VARCHAR(36) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `completed_at` DATETIME(3) NULL,

    UNIQUE INDEX `orders_code_key`(`code`),
    INDEX `orders_table_id_idx`(`table_id`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_payment_status_idx`(`payment_status`),
    INDEX `orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `menu_item_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `tax_rate` DECIMAL(5, 2) NOT NULL DEFAULT 8,
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `note` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `is_stock_deducted` BOOLEAN NOT NULL DEFAULT false,
    `stock_deducted_at` DATETIME(3) NULL,
    `ordered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `payment_code` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'VIETQR', 'TRANSFER', 'CARD') NOT NULL DEFAULT 'CASH',
    `payment_status` ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
    `received_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `change_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `refunded_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `reference_code` VARCHAR(100) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `processed_by_id` VARCHAR(36) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_payment_code_key`(`payment_code`),
    UNIQUE INDEX `payments_idempotency_key_key`(`idempotency_key`),
    INDEX `payments_order_id_idx`(`order_id`),
    INDEX `payments_payment_status_idx`(`payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_refunds` (
    `id` VARCHAR(36) NOT NULL,
    `refund_code` VARCHAR(50) NOT NULL,
    `payment_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `refund_method` ENUM('CASH', 'VIETQR', 'TRANSFER', 'CARD') NOT NULL DEFAULT 'CASH',
    `refund_status` ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
    `processed_by_id` VARCHAR(36) NOT NULL,
    `reference_code` VARCHAR(100) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    UNIQUE INDEX `payment_refunds_refund_code_key`(`refund_code`),
    UNIQUE INDEX `payment_refunds_idempotency_key_key`(`idempotency_key`),
    INDEX `payment_refunds_payment_id_idx`(`payment_id`),
    INDEX `payment_refunds_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `address` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goods_receipts` (
    `id` VARCHAR(36) NOT NULL,
    `receipt_code` VARCHAR(50) NOT NULL,
    `supplier_id` VARCHAR(36) NOT NULL,
    `received_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total_amount` DECIMAL(14, 2) NOT NULL,
    `paid_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    `payment_method` ENUM('CASH', 'VIETQR', 'TRANSFER', 'CARD') NOT NULL DEFAULT 'TRANSFER',
    `notes` VARCHAR(255) NULL,
    `created_by_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `goods_receipts_receipt_code_key`(`receipt_code`),
    INDEX `goods_receipts_supplier_id_idx`(`supplier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goods_receipt_items` (
    `id` VARCHAR(36) NOT NULL,
    `receipt_id` VARCHAR(36) NOT NULL,
    `ingredient_id` VARCHAR(36) NOT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `total_price` DECIMAL(14, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `goods_receipt_items_receipt_id_idx`(`receipt_id`),
    INDEX `goods_receipt_items_ingredient_id_idx`(`ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_payments` (
    `id` VARCHAR(36) NOT NULL,
    `payment_code` VARCHAR(50) NOT NULL,
    `receipt_id` VARCHAR(36) NOT NULL,
    `supplier_id` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'VIETQR', 'TRANSFER', 'CARD') NOT NULL DEFAULT 'TRANSFER',
    `reference_code` VARCHAR(100) NULL,
    `notes` VARCHAR(255) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `processed_by_id` VARCHAR(36) NOT NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `supplier_payments_payment_code_key`(`payment_code`),
    UNIQUE INDEX `supplier_payments_idempotency_key_key`(`idempotency_key`),
    INDEX `supplier_payments_receipt_id_idx`(`receipt_id`),
    INDEX `supplier_payments_supplier_id_idx`(`supplier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `ingredient_id` VARCHAR(36) NOT NULL,
    `transaction_type` ENUM('GOODS_RECEIPT', 'ORDER_CONSUMPTION', 'ORDER_CANCELLATION_RETURN', 'STOCK_TAKE_ADJUSTMENT', 'WASTE_DAMAGE', 'SUPPLIER_RETURN') NOT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `balance_after` DECIMAL(12, 3) NOT NULL,
    `cost_per_unit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `source_type` VARCHAR(50) NOT NULL,
    `source_id` VARCHAR(50) NOT NULL,
    `source_line_id` VARCHAR(50) NOT NULL DEFAULT 'NONE',
    `idempotency_key` VARCHAR(100) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `created_by_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stock_transactions_idempotency_key_key`(`idempotency_key`),
    INDEX `stock_transactions_ingredient_id_idx`(`ingredient_id`),
    INDEX `stock_transactions_transaction_type_idx`(`transaction_type`),
    UNIQUE INDEX `stock_transactions_source_type_source_id_source_line_id_ingr_key`(`source_type`, `source_id`, `source_line_id`, `ingredient_id`, `transaction_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_flow_records` (
    `id` VARCHAR(36) NOT NULL,
    `type` ENUM('INFLOW', 'OUTFLOW') NOT NULL,
    `category` ENUM('REVENUE_ORDER', 'GOODS_PURCHASE', 'STAFF_SALARY', 'UTILITIES', 'MARKETING', 'REFUND', 'OTHER') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `method` ENUM('CASH', 'VIETQR', 'TRANSFER', 'CARD') NOT NULL DEFAULT 'CASH',
    `payment_id` VARCHAR(36) NULL,
    `refund_id` VARCHAR(36) NULL,
    `supplier_payment_id` VARCHAR(36) NULL,
    `reference_code` VARCHAR(100) NULL,
    `notes` VARCHAR(255) NULL,
    `created_by_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cash_flow_records_payment_id_key`(`payment_id`),
    UNIQUE INDEX `cash_flow_records_refund_id_key`(`refund_id`),
    UNIQUE INDEX `cash_flow_records_supplier_payment_id_key`(`supplier_payment_id`),
    INDEX `cash_flow_records_type_idx`(`type`),
    INDEX `cash_flow_records_category_idx`(`category`),
    INDEX `cash_flow_records_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_requests` (
    `id` VARCHAR(36) NOT NULL,
    `table_id` VARCHAR(36) NOT NULL,
    `type` ENUM('CALL_WAITER', 'REQUEST_BILL', 'REFILL_WATER', 'EXTRA_CUTLERY', 'CLEAN_TABLE', 'OTHER') NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `note` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'ATTENDING', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    `assigned_to_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_requests_table_id_idx`(`table_id`),
    INDEX `service_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outbox_events` (
    `id` VARCHAR(36) NOT NULL,
    `aggregate_type` VARCHAR(50) NOT NULL,
    `aggregate_id` VARCHAR(50) NOT NULL,
    `aggregate_sequence` INTEGER NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `locked_by` VARCHAR(50) NULL,
    `locked_at` DATETIME(3) NULL,
    `scheduled_at` DATETIME(3) NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `max_retries` INTEGER NOT NULL DEFAULT 5,
    `last_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `published_at` DATETIME(3) NULL,

    INDEX `outbox_events_status_scheduled_at_idx`(`status`, `scheduled_at`),
    UNIQUE INDEX `outbox_events_aggregate_type_aggregate_id_aggregate_sequence_key`(`aggregate_type`, `aggregate_id`, `aggregate_sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idempotency_records` (
    `id` VARCHAR(36) NOT NULL,
    `idempotency_key` VARCHAR(100) NOT NULL,
    `handler` VARCHAR(100) NOT NULL,
    `request_hash` VARCHAR(64) NOT NULL,
    `response_body` TEXT NOT NULL,
    `status_code` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `idempotency_records_idempotency_key_key`(`idempotency_key`),
    INDEX `idempotency_records_idempotency_key_idx`(`idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_schedules` ADD CONSTRAINT `employee_schedules_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tables` ADD CONSTRAINT `tables_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `table_areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_conversions` ADD CONSTRAINT `unit_conversions_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_menu_item_id_fkey` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_configs` ADD CONSTRAINT `tax_configs_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_served_by_id_fkey` FOREIGN KEY (`served_by_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_parent_order_id_fkey` FOREIGN KEY (`parent_order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_menu_item_id_fkey` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_processed_by_id_fkey` FOREIGN KEY (`processed_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_refunds` ADD CONSTRAINT `payment_refunds_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_refunds` ADD CONSTRAINT `payment_refunds_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_refunds` ADD CONSTRAINT `payment_refunds_processed_by_id_fkey` FOREIGN KEY (`processed_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipts` ADD CONSTRAINT `goods_receipts_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipts` ADD CONSTRAINT `goods_receipts_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipt_items` ADD CONSTRAINT `goods_receipt_items_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipt_items` ADD CONSTRAINT `goods_receipt_items_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_processed_by_id_fkey` FOREIGN KEY (`processed_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transactions` ADD CONSTRAINT `stock_transactions_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transactions` ADD CONSTRAINT `stock_transactions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_flow_records` ADD CONSTRAINT `cash_flow_records_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_flow_records` ADD CONSTRAINT `cash_flow_records_refund_id_fkey` FOREIGN KEY (`refund_id`) REFERENCES `payment_refunds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_flow_records` ADD CONSTRAINT `cash_flow_records_supplier_payment_id_fkey` FOREIGN KEY (`supplier_payment_id`) REFERENCES `supplier_payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_flow_records` ADD CONSTRAINT `cash_flow_records_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
