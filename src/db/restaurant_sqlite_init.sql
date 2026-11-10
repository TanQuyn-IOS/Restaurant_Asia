-- ============================================================================
-- CƠ SỞ DỮ LIỆU SQLITE: QUẢN LÝ NHÀ HÀNG PRO (RESTAURANT MANAGEMENT SYSTEM)
-- Mật khẩu mặc định tất cả tài khoản: 123
-- Tệp tin SQL: restaurant_sqlite_init.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. BẢNG TÀI KHOẢN & PHÂN QUYỀN (ACCOUNTS & RBAC)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS service_requests;
DROP TABLE IF EXISTS shift_schedules;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menu_categories;
DROP TABLE IF EXISTS tables;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS accounts;

CREATE TABLE accounts (
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

CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_role ON accounts(role);

-- NẠP DỮ LIỆU TÀI KHOẢN (Mật khẩu: 123)
INSERT INTO accounts (id, username, password, full_name, role, phone, avatar, assigned_table_id, is_active) VALUES
('acc-admin', 'admin', '123', 'Nguyễn Quản Trị (Admin Tổng)', 'admin', '0901 234 567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', NULL, 1),
('acc-cashier', 'thungan', '123', 'Nguyễn Thị Thu Ngân', 'cashier', '0912 888 999', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', NULL, 1),
('acc-kitchen', 'bep', '123', 'Trần Văn Bếp (Bếp Trưởng)', 'kitchen', '0938 111 222', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80', NULL, 1),
('acc-waiter', 'phucvu', '123', 'Lê Văn Phục Vụ', 'waiter', '0977 333 444', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', NULL, 1),
('acc-customer', 'khachhang', '123', 'Thực Khách Bàn 02', 'customer', '0988 999 000', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80', 't-102', 1),
('acc-hr', 'nhansu', '123', 'Hoàng Thị Nhân Sự (HR)', 'hr_manager', '0944 555 666', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', NULL, 1);

-- ----------------------------------------------------------------------------
-- 2. BẢNG KHU VỰC & BÀN ĂN (AREAS & TABLES)
-- ----------------------------------------------------------------------------
CREATE TABLE areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0
);

INSERT INTO areas (id, name, description, display_order) VALUES
('area-1', 'Tầng 1 - Sảnh Chính', 'Khu vực máy lạnh trung tâm, ấm cúng', 1),
('area-2', 'Tầng 2 - Sân Vườn & Ban Công', 'Không gian mở, thoáng mát ngắm phố', 2),
('area-3', 'Phòng VIP 1 & 2', 'Phòng riêng sang trọng dành cho gia đình & tiệc', 3);

CREATE TABLE tables (
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

CREATE INDEX idx_tables_area ON tables(area_id);
CREATE INDEX idx_tables_status ON tables(status);

-- NẠP DỮ LIỆU SƠ ĐỒ BÀN
INSERT INTO tables (id, name, area_id, capacity, shape, status, pos_x, pos_y, current_order_id, reservation_customer_name, reservation_phone, reservation_guest_count, reservation_time, reservation_notes) VALUES
('t-101', 'Bàn 01', 'area-1', 4, 'square', 'occupied', 20, 30, 'ord-101', NULL, NULL, NULL, NULL, NULL),
('t-102', 'Bàn 02', 'area-1', 4, 'square', 'occupied', 50, 30, 'ord-102', NULL, NULL, NULL, NULL, NULL),
('t-103', 'Bàn 03', 'area-1', 4, 'square', 'available', 80, 30, NULL, NULL, NULL, NULL, NULL, NULL),
('t-104', 'Bàn 04', 'area-1', 4, 'round', 'reserved', 20, 70, NULL, 'Anh Minh', '0912 345 678', 4, '19:30', 'Bàn kỷ niệm ngày cưới, chuẩn bị nến'),
('t-105', 'Bàn 05', 'area-1', 4, 'square', 'cleaning', 50, 70, NULL, NULL, NULL, NULL, NULL, NULL),
('t-106', 'Bàn 06', 'area-1', 4, 'round', 'available', 80, 70, NULL, NULL, NULL, NULL, NULL, NULL),
('t-201', 'Bàn 201', 'area-2', 4, 'round', 'available', 20, 30, NULL, NULL, NULL, NULL, NULL, NULL),
('t-202', 'Bàn 202', 'area-2', 4, 'square', 'occupied', 50, 30, 'ord-202', NULL, NULL, NULL, NULL, NULL),
('t-203', 'Bàn 203', 'area-2', 4, 'round', 'available', 80, 30, NULL, NULL, NULL, NULL, NULL, NULL),
('t-204', 'Bàn 204', 'area-2', 4, 'square', 'available', 20, 70, NULL, NULL, NULL, NULL, NULL, NULL),
('t-205', 'Bàn 205', 'area-2', 4, 'square', 'available', 50, 70, NULL, NULL, NULL, NULL, NULL, NULL),
('t-206', 'Bàn 206', 'area-2', 4, 'round', 'available', 80, 70, NULL, NULL, NULL, NULL, NULL, NULL),
('t-vip-1', 'VIP Hoàng Gia', 'area-3', 8, 'square', 'occupied', 32, 50, 'ord-vip1', NULL, NULL, NULL, NULL, NULL),
('t-vip-2', 'VIP Sen Vàng', 'area-3', 8, 'square', 'available', 68, 50, NULL, NULL, NULL, NULL, NULL, NULL);

-- ----------------------------------------------------------------------------
-- 3. BẢNG DANH MỤC & MÓN ĂN (MENU CATEGORIES & ITEMS)
-- ----------------------------------------------------------------------------
CREATE TABLE menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0
);

INSERT INTO menu_categories (id, name, display_order) VALUES
('cat-1', 'Khai vị', 1),
('cat-2', 'Món chính', 2),
('cat-3', 'Món lẩu', 3),
('cat-4', 'Hải sản', 4),
('cat-5', 'Món chay', 5),
('cat-6', 'Tráng miệng', 6),
('cat-7', 'Đồ uống', 7);

CREATE TABLE menu_items (
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
  tags TEXT,
  is_popular INTEGER DEFAULT 0
);

CREATE INDEX idx_menu_category ON menu_items(category);
CREATE INDEX idx_menu_available ON menu_items(is_available);

-- NẠP DỮ LIỆU MÓN ĂN
INSERT INTO menu_items (id, name, category, price, cost, unit, description, image, is_available, preparation_time_minutes, spicy_level, is_popular, tags) VALUES
('m-1', 'Gỏi Cuốn Tôm Thịt (4 Cuốn)', 'Khai vị', 65000, 25000, 'phần', 'Tôm tươi, thịt ba chỉ luộc cuộn cùng bún tươi, rau sống và chấm kèm sốt tương đen đậu phộng béo bùi.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 1, 8, 0, 1, '["Tươi ngon", "Món nhẹ"]'),
('m-2', 'Chả Giò Hải Sản Hoàng Kim', 'Khai vị', 85000, 32000, 'dĩa', 'Vỏ rế giòn rụm, nhân tôm sú băm, mực tươi, khoai môn thơm béo chấm xốt mayonnaise tương ớt.', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80', 1, 12, 0, 1, '["Giòn rụm", "Best seller"]'),
('m-3', 'Nộm Ngó Sen Tôm Thịt', 'Khai vị', 95000, 38000, 'dĩa', 'Ngó sen giòn ngọt quyện tôm thịt, cà rốt, rau răm, đậu phộng rang giòn và nước mắm chua ngọt chuẩn vị.', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 1, 10, 0, 0, '["Chua ngọt", "Thanh mát"]'),
('m-4', 'Phở Bò Thăn Đặc Biệt', 'Món chính', 89000, 35000, 'tô', 'Nước dùng hầm từ xương ống bò 18 tiếng, thịt thăn bò mềm ngọt, nạm giòn, bò viên kèm quẩy giòn.', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80', 1, 10, 0, 1, '["Đặc sản", "Nóng hổi"]'),
('m-5', 'Bún Chả Hà Nội Nướng Than Hoa', 'Món chính', 79000, 29000, 'phần', 'Chả miếng ba chỉ và chả viên nướng xém vàng than hoa thơm phức, nước chấm đu đủ cà rốt chua ngọt.', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80', 1, 12, 0, 1, '["Hà Nội", "Đậm đà"]'),
('m-6', 'Cơm Tấm Sườn Bì Chả Trứng Ốp La', 'Món chính', 75000, 28000, 'dĩa', 'Cơm tấm dẻo thơm, sườn cốt lết ướp mật ong nướng mềm mọng, chả trứng hấp béo bùi, mỡ hành tép mỡ giòn.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 1, 10, 0, 1, '["Sài Gòn", "No nê"]'),
('m-7', 'Bò Lúc Lắc Khoai Tây Chiên', 'Món chính', 165000, 75000, 'dĩa', 'Thịt bò Úc cắt hạt lựu mềm ngọt xào lửa lớn cùng ớt chuông, hành tây, kèm khoai tây chiên giòn tan.', 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80', 1, 15, 0, 1, '["Bò Úc", "Cao cấp"]'),
('m-8', 'Gà Hấp Lá Chanh Nửa Con', 'Món chính', 145000, 65000, 'dĩa', 'Gà ta thả vườn da vàng giòn sần sật, thịt săn ngọt ngào thơm nồng hương lá chanh tươi, chấm muối tiêu chanh.', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80', 1, 18, 0, 0, '["Gà ta", "Thơm ngon"]'),
('m-9', 'Lẩu Thái Hải Sản Tom Yum', 'Món lẩu', 320000, 140000, 'nồi', 'Nước lẩu chua cay đậm đà thơm mùi sả ớt, kèm tôm sú tươi, mực lá, nghêu, cá hồi, nấm kim châm và rau muống.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', 1, 20, 2, 1, '["Chua cay", "Ăn nhóm 3-4 người"]'),
('m-10', 'Tôm Sú Nướng Muối Ớt (300g)', 'Hải sản', 185000, 85000, 'dĩa', 'Tôm sú tươi sống nướng muối ớt cay nồng trên than hồng, thịt chắc ngọt đậm đà.', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80', 1, 15, 2, 0, '["Hải sản tươi"]'),
('m-11', 'Mực Trứng Hấp Gừng Hành', 'Hải sản', 175000, 80000, 'dĩa', 'Mực trứng tươi béo ngậy đầy ắp trứng, hấp cùng gừng non và hành hoa ngọt thanh.', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', 1, 15, 0, 0, '["Ngọt thịt"]'),
('m-12', 'Nấm Đùi Gà Kho Tiêu Chay', 'Món chay', 70000, 25000, 'tộ', 'Nấm đùi gà dai giòn kho trong tộ đất với sốt xì dầu ớt tiêu đen cay nồng thơm phức.', 'https://images.unsplash.com/photo-1546069901-d72d242948c3?auto=format&fit=crop&w=600&q=80', 1, 12, 0, 0, '["Ăn chay", "Healthy"]'),
('m-13', 'Đậu Hũ Lướt Ván Tẩm Hành', 'Món chay', 50000, 15000, 'dĩa', 'Đậu hũ non chiên phồng mềm tan bên trong, rưới mỡ hành thơm ngát.', 'https://images.unsplash.com/photo-1546069901-5ec6a79120b0?auto=format&fit=crop&w=600&q=80', 1, 8, 0, 0, '["Ăn chay"]'),
('m-14', 'Chè Hạt Sen Long Nhãn Táo Đỏ', 'Tráng miệng', 42000, 14000, 'ly', 'Hạt sen bùi bở nấu đường phèn thanh mát cùng long nhãn Hưng Yên ngọt dịu và táo đỏ bổ dưỡng.', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80', 1, 5, 0, 0, '["Thanh nhiệt", "Ít ngọt"]'),
('m-15', 'Trà Đào Cam Sả Tươi', 'Đồ uống', 45000, 12000, 'ly', 'Trà đen ủ lạnh ngát hương sả tươi, cam vàng mọng nước và miếng đào giòn ngọt.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', 1, 4, 0, 1, '["Giải nhiệt", "Best seller"]'),
('m-16', 'Cà Phê Muối Kem Béo Cố Đô', 'Đồ uống', 39000, 10000, 'ly', 'Cà phê Robusta nguyên chất pha phin, lớp kem mặn béo ngậy ngọt ngào gây thương nhớ.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 1, 4, 0, 1, '["Đậm đà", "Hot trend"]'),
('m-17', 'Nước Ép Dưa Hấu Bạc Hà', 'Đồ uống', 42000, 15000, 'ly', 'Dưa hấu ép tươi nguyên chất 100% không đường, the mát với lá bạc hà tươi.', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80', 1, 5, 0, 0, '["100% Fresh"]');

-- ----------------------------------------------------------------------------
-- 4. BẢNG ĐƠN HÀNG & CHI TIẾT ĐƠN (ORDERS & ORDER ITEMS)
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
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

CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE TABLE order_items (
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

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- NẠP DỮ LIỆU ĐƠN HÀNG MẪU
INSERT INTO orders (id, code, table_id, table_name, area_name, staff_name, customer_count, subtotal, discount_percent, tax_percent, final_total, status, created_at) VALUES
('ord-101', 'HD-8801', 't-101', 'Bàn 01', 'Tầng 1 - Sảnh Chính', 'Lê Văn Phục Vụ', 3, 404000, 0, 0, 404000, 'active', datetime('now', '-45 minutes')),
('ord-102', 'HD-8802', 't-102', 'Bàn 02', 'Tầng 1 - Sảnh Chính', 'Lê Văn Phục Vụ', 2, 209000, 0, 0, 209000, 'active', datetime('now', '-25 minutes'));

INSERT INTO order_items (id, order_id, menu_item_id, name, unit, price, quantity, note, status, ordered_at) VALUES
('oi-101-1', 'ord-101', 'm-9', 'Lẩu Thái Hải Sản Tom Yum', 'nồi', 320000, 1, 'Ít cay cho trẻ em', 'cooking', datetime('now', '-40 minutes')),
('oi-101-2', 'ord-101', 'm-15', 'Trà Đào Cam Sả Tươi', 'ly', 42000, 2, 'Ít đường, nhiều đá', 'served', datetime('now', '-40 minutes')),
('oi-102-1', 'ord-102', 'm-4', 'Phở Bò Thăn Đặc Biệt', 'tô', 89000, 1, 'Nhiều hành trần', 'ready', datetime('now', '-20 minutes')),
('oi-102-2', 'ord-102', 'm-5', 'Bún Chả Hà Nội Nướng Than Hoa', 'phần', 79000, 1, 'Nước chấm ấm', 'cooking', datetime('now', '-20 minutes')),
('oi-102-3', 'ord-102', 'm-16', 'Cà Phê Muối Kem Béo Cố Đô', 'ly', 39000, 1, 'Đậm đà', 'served', datetime('now', '-20 minutes'));

-- ----------------------------------------------------------------------------
-- 5. BẢNG NHÂN SỰ & PHÂN CA (STAFF & SHIFTS)
-- ----------------------------------------------------------------------------
CREATE TABLE staff (
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

INSERT INTO staff (id, name, avatar, role, phone, email, shift, salary_rate, salary_type, status, join_date, orders_handled) VALUES
('st-1', 'Nguyễn Văn Hùng', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80', 'Quản lý', '0903 123 456', 'hung.nguyen@nhahangpro.vn', 'Toàn thời gian', 18000000, 'monthly', 'active', '2023-01-15', 542),
('st-2', 'Trần Thị Mai', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80', 'Thu ngân', '0912 888 999', 'mai.tran@nhahangpro.vn', 'Ca sáng (06:00 - 14:00)', 9500000, 'monthly', 'active', '2023-03-10', 1230),
('st-3', 'Lê Hoàng Long', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80', 'Bếp trưởng', '0938 111 222', 'long.le@nhahangpro.vn', 'Toàn thời gian', 22000000, 'monthly', 'active', '2022-11-01', 3200),
('st-4', 'Phạm Quỳnh Anh', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', 'Phục vụ', '0977 333 444', 'quynhanh.pham@nhahangpro.vn', 'Ca chiều (14:00 - 22:00)', 30000, 'hourly', 'active', '2023-08-20', 890),
('st-5', 'Đặng Tuấn Kiệt', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'Pha chế', '0944 555 666', 'kiet.dang@nhahangpro.vn', 'Ca tối (18:00 - 23:00)', 35000, 'hourly', 'on_break', '2024-01-05', 410);

CREATE TABLE shift_schedules (
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

INSERT INTO shift_schedules (id, staff_id, staff_name, role, day_of_week, date, shift_name, time_range, attended) VALUES
('shift-1', 'st-2', 'Trần Thị Mai', 'Thu ngân', 1, '2025-05-19', 'Ca Sáng', '06:00 - 14:00', 1),
('shift-2', 'st-4', 'Phạm Quỳnh Anh', 'Phục vụ', 1, '2025-05-19', 'Ca Chiều', '14:00 - 22:00', 1),
('shift-3', 'st-5', 'Đặng Tuấn Kiệt', 'Pha chế', 1, '2025-05-19', 'Ca Sáng', '06:00 - 14:00', 1);

-- ----------------------------------------------------------------------------
-- 6. BẢNG YÊU CẦU PHỤC VỤ / CHUÔNG GỌI (SERVICE REQUESTS)
-- ----------------------------------------------------------------------------
CREATE TABLE service_requests (
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

CREATE INDEX idx_service_requests_status ON service_requests(status);

INSERT INTO service_requests (id, table_id, table_name, type, title, note, status, created_at) VALUES
('req-1', 't-101', 'Bàn 01', 'water', 'Xin thêm nước lọc & đá', 'Khách cần 2 ly đá lạnh', 'pending', datetime('now', '-5 minutes')),
('req-2', 't-102', 'Bàn 02', 'bill', 'Yêu cầu in hóa đơn tạm tính', 'Thanh toán chuyển khoản VietQR', 'pending', datetime('now', '-2 minutes'));
