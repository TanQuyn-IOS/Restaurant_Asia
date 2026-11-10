/**
 * SQLite Database Schema & DDL Definitions
 * Quản Lý Nhà Hàng Pro - SQLite Relational Database Architecture
 * 
 * This file defines standard SQLite relational tables, schemas, and queries.
 * It is structured to allow immediate plug-and-play with SQLite engines
 * (such as better-sqlite3, sqlite3, sql.js, or backend SQLite microservices).
 */

export const SQLITE_DDL_SCHEMA = `
-- ==========================================================
-- 1. ACCOUNTS & RBAC TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT '123',
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'customer', 'cashier', 'kitchen', 'waiter', 'hr_manager')),
  phone TEXT,
  avatar TEXT,
  assigned_table_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_role ON accounts(role);

-- ==========================================================
-- 2. AREAS & SEATING TABLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area_id TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  shape TEXT NOT NULL DEFAULT 'square' CHECK(shape IN ('round', 'square', 'rectangle')),
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved', 'cleaning')),
  pos_x REAL NOT NULL DEFAULT 0,
  pos_y REAL NOT NULL DEFAULT 0,
  width REAL DEFAULT 90,
  height REAL DEFAULT 90,
  current_order_id TEXT,
  reservation_customer_name TEXT,
  reservation_phone TEXT,
  reservation_guest_count INTEGER,
  reservation_time TEXT,
  reservation_notes TEXT,
  occupied_since TEXT,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tables_area ON tables(area_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- ==========================================================
-- 3. MENU & CATEGORIES TABLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  cost REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'phần',
  description TEXT,
  image TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  preparation_time_minutes INTEGER DEFAULT 15,
  spicy_level INTEGER DEFAULT 0,
  tags TEXT, -- JSON array of tags: '["popular", "chef"]'
  is_popular INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(is_available);

-- ==========================================================
-- 4. ORDERS & ORDER ITEMS TABLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  table_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  area_name TEXT NOT NULL,
  staff_id TEXT,
  staff_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_count INTEGER DEFAULT 2,
  subtotal REAL NOT NULL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  tax_percent REAL DEFAULT 0,
  final_total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
  payment_method TEXT CHECK(payment_method IN ('cash', 'transfer', 'card', 'qr')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (table_id) REFERENCES tables(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'phần',
  price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'cooking', 'ready', 'served', 'cancelled')),
  ordered_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- ==========================================================
-- 5. STAFF & HUMAN RESOURCES TABLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  shift TEXT,
  salary_rate REAL NOT NULL DEFAULT 0,
  salary_type TEXT NOT NULL DEFAULT 'monthly' CHECK(salary_type IN ('monthly', 'hourly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'on_break', 'off')),
  join_date TEXT NOT NULL DEFAULT (datetime('now')),
  orders_handled INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shift_schedules (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  role TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  date TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  time_range TEXT NOT NULL,
  attended INTEGER DEFAULT 0,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- ==========================================================
-- 6. SERVICE REQUESTS / WAITER CALL BELL TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'attending', 'resolved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  staff_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
`;
