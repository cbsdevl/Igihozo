-- ============================================================
-- Gihozo Pharmacy Management System v1.0 - SQLite Schema
-- ============================================================

PRAGMA foreign_keys = ON;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Users (Admin & Workers)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role_id INTEGER NOT NULL DEFAULT 2,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  outstanding_balance REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- Medicines
CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand TEXT,
  category_id INTEGER,
  description TEXT,
  supplier_id TEXT,
  purchase_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  profit_margin REAL GENERATED ALWAYS AS (
    CASE WHEN purchase_price > 0
      THEN ROUND(((selling_price - purchase_price) / purchase_price) * 100, 2)
      ELSE 0 END
  ) STORED,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  batch_number TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  storage_location TEXT,
  prescription_required INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','discontinued')),
  image TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  worker_id TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  amount_paid REAL NOT NULL DEFAULT 0,
  balance REAL GENERATED ALWAYS AS (amount_paid - total) STORED,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash','card','mobile_money')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','cancelled','refunded')),
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  medicine_id TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  purchase_price REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  profit REAL GENERATED ALWAYS AS ((unit_price - purchase_price) * quantity - discount) STORED,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Purchases (Stock-in)
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  reference_number TEXT UNIQUE,
  supplier_id TEXT,
  worker_id TEXT NOT NULL,
  total_cost REAL NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','pending','cancelled')),
  purchased_at DATETIME DEFAULT (datetime('now')),
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (worker_id) REFERENCES users(id)
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  medicine_id TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  medicine_id TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('sale','purchase','adjustment','damage','return','expiry_write_off')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id TEXT,
  notes TEXT,
  worker_id TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (worker_id) REFERENCES users(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK(severity IN ('info','success','warning','error')),
  is_read INTEGER NOT NULL DEFAULT 0,
  target_role TEXT DEFAULT 'admin',
  reference_id TEXT,
  reference_type TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK(status IN ('success','failed')),
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settings (Key-Value store)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  label TEXT,
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- Backups metadata
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_supplier ON medicines(supplier_id);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medicines_quantity ON medicines(quantity);

CREATE INDEX IF NOT EXISTS idx_sales_worker ON sales(worker_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_medicine ON sale_items(medicine_id);

CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory_logs(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_created ON inventory_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update medicine updated_at
CREATE TRIGGER IF NOT EXISTS trg_medicines_updated
AFTER UPDATE ON medicines
BEGIN
  UPDATE medicines SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update user updated_at
CREATE TRIGGER IF NOT EXISTS trg_users_updated
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;
