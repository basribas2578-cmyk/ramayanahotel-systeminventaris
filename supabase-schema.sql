-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin', 'manager', 'staff'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  avatar_url TEXT
);

-- Create the 'suppliers' table
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the 'items' table
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  min_stock INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the 'transactions' table
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'in', 'out', 'borrow', 'return'
  item_id BIGINT REFERENCES items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT, -- Only for 'in' type
  borrower_id TEXT, -- Only for 'borrow' type
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'approved', 'completed', 'cancelled'
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE, -- Only for 'borrow' type
  return_date DATE -- Only for 'return' type
);

-- Create the 'depreciations' table
CREATE TABLE IF NOT EXISTS depreciations (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'completed' -- 'completed', 'pending'
);

-- Optional: Add RLS (Row Level Security) policies for production
-- For a full RLS setup, you would define policies for each table
-- based on user roles and authentication. This is a complex topic
-- and beyond the scope of this initial integration.
-- For now, we assume the `service_role` key or a user with full permissions
-- is used for server actions.

-- Optional: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_supplier_id ON items (supplier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions (item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_supplier_id ON transactions (supplier_id);
CREATE INDEX IF NOT EXISTS idx_depreciations_item_id ON depreciations (item_id);
CREATE INDEX IF NOT EXISTS idx_depreciations_user_id ON depreciations (user_id);

-- Seed initial data (optional, for testing purposes)
-- You can run these inserts after creating the tables if you want initial data.
-- DELETE FROM depreciations;
-- DELETE FROM transactions;
-- DELETE FROM items;
-- DELETE FROM suppliers;
-- DELETE FROM users;

INSERT INTO users (username, name, email, role, status, last_login, avatar_url) VALUES
('Bas', 'Bas', 'bas.admin@example.com', 'admin', 'active', '2025-07-15 10:00:00+00', '/placeholder.svg'),
('Kiswanto', 'Kiswanto', 'kiswanto.manager@example.com', 'manager', 'active', '2025-07-15 09:30:00+00', '/placeholder.svg'),
('hkcrew', 'Housekeeping Crew', 'hk.staff@example.com', 'staff', 'active', '2025-07-15 08:45:00+00', '/placeholder.svg')
ON CONFLICT (username) DO NOTHING;

INSERT INTO suppliers (code, name, contact, phone, email, address, status, created_at) VALUES
('SUP001', 'PT. Linen Jaya', 'Budi Santoso', '081234567890', 'budi@linenjaya.com', 'Jl. Merdeka No. 10, Jakarta', 'active', '2024-10-01 00:00:00+00'),
('SUP002', 'CV. Bersih Selalu', 'Siti Aminah', '087654321098', 'siti@bersihselalu.com', 'Jl. Kebon Jeruk No. 5, Bandung', 'active', '2024-11-15 00:00:00+00'),
('SUP003', 'Global Amenities', 'John Doe', '089876543210', 'john@globalamenities.com', 'Jl. Sudirman No. 20, Surabaya', 'active', '2024-12-01 00:00:00+00')
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, name, category, description, unit, min_stock, current_stock, location, supplier_id, price, status, created_at, updated_at, image_url) VALUES
('LN001', 'Sprei King Size', 'Linen', 'Sprei katun putih untuk kasur king size', 'pcs', 100, 150, 'Gudang Linen A', (SELECT id FROM suppliers WHERE code = 'SUP001'), 150000, 'active', '2025-01-01 00:00:00+00', '2025-07-10 00:00:00+00', '/placeholder.svg'),
('CS002', 'Pembersih Lantai', 'Cleaning Supplies', 'Cairan pembersih lantai serbaguna', 'liter', 50, 75, 'Gudang Cleaning', (SELECT id FROM suppliers WHERE code = 'SUP002'), 75000, 'active', '2025-01-05 00:00:00+00', '2025-07-08 00:00:00+00', '/placeholder.svg'),
('AM003', 'Sabun Mandi Cair', 'Amenities', 'Sabun mandi cair aroma lavender', 'botol', 200, 180, 'Gudang Amenities', (SELECT id FROM suppliers WHERE code = 'SUP003'), 15000, 'active', '2025-02-10 00:00:00+00', '2025-07-12 00:00:00+00', '/placeholder.svg'),
('EQ001', 'Vacuum Cleaner', 'Equipment', 'Vacuum cleaner industri untuk karpet', 'unit', 5, 3, 'Gudang Peralatan', (SELECT id FROM suppliers WHERE code = 'SUP001'), 2500000, 'active', '2025-03-01 00:00:00+00', '2025-07-01 00:00:00+00', '/placeholder.svg'),
('LN002', 'Handuk Mandi', 'Linen', 'Handuk mandi katun ukuran besar', 'pcs', 200, 250, 'Gudang Linen B', (SELECT id FROM suppliers WHERE code = 'SUP001'), 50000, 'active', '2025-01-15 00:00:00+00', '2025-07-05 00:00:00+00', '/placeholder.svg')
ON CONFLICT (code) DO NOTHING;

INSERT INTO transactions (type, item_id, quantity, user_id, supplier_id, borrower_id, notes, status, date, due_date, return_date) VALUES
('in', (SELECT id FROM items WHERE code = 'LN001'), 50, (SELECT id FROM users WHERE username = 'Bas'), (SELECT id FROM suppliers WHERE code = 'SUP001'), NULL, 'Pembelian rutin Q2', 'completed', '2025-07-01', NULL, NULL),
('borrow', (SELECT id FROM items WHERE code = 'AM003'), 10, (SELECT id FROM users WHERE username = 'hkcrew'), NULL, 'Room 301', 'Peminjaman sabun untuk tamu', 'pending', '2025-07-10', '2025-07-15', NULL),
('out', (SELECT id FROM items WHERE code = 'CS002'), 5, (SELECT id FROM users WHERE username = 'Kiswanto'), NULL, NULL, 'Pengeluaran untuk pembersihan area lobi', 'completed', '2025-07-12', NULL, NULL),
('return', (SELECT id FROM items WHERE code = 'AM003'), 10, (SELECT id FROM users WHERE username = 'hkcrew'), NULL, 'Room 301', 'Pengembalian sabun dari Room 301', 'completed', '2025-07-14', '2025-07-15', '2025-07-14'),
('borrow', (SELECT id FROM items WHERE code = 'EQ001'), 1, (SELECT id FROM users WHERE username = 'hkcrew'), NULL, 'Dept. Engineering', 'Peminjaman vacuum cleaner untuk perbaikan', 'pending', '2025-07-15', '2025-07-16', NULL),
('in', (SELECT id FROM items WHERE code = 'LN002'), 100, (SELECT id FROM users WHERE username = 'Bas'), (SELECT id FROM suppliers WHERE code = 'SUP001'), NULL, 'Pembelian handuk baru', 'completed', '2025-07-15', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO depreciations (item_id, quantity, date, reason, user_id, status) VALUES
((SELECT id FROM items WHERE code = 'LN001'), 5, '2025-06-20', 'Rusak tidak bisa digunakan', (SELECT id FROM users WHERE username = 'Kiswanto'), 'completed'),
((SELECT id FROM items WHERE code = 'EQ001'), 1, '2025-07-01', 'Hilang saat pemakaian', (SELECT id FROM users WHERE username = 'hkcrew'), 'pending')
ON CONFLICT DO NOTHING;
