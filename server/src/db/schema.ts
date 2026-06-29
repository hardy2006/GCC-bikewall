import { exec, initConnection } from "./connection";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ("customer", "technician", "operator")),
  phone TEXT,
  real_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repair_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  technician_id INTEGER REFERENCES users(id),
  bike_brand TEXT,
  bike_model TEXT,
  bike_color TEXT,
  problem_description TEXT NOT NULL,
  urgent_level TEXT NOT NULL DEFAULT "normal" CHECK(urgent_level IN ("low", "normal", "high", "urgent")),
  status TEXT NOT NULL DEFAULT "pending" CHECK(status IN (
    "pending",
    "accepted",
    "repairing",
    "completed",
    "cancelled"
  )),
  repair_notes TEXT,
  service_type TEXT,
  image_paths TEXT,
  repair_day TEXT,
  rush_time TEXT,
  location TEXT,
  detail_location TEXT,
  is_rush INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES repair_orders(id),
  operator_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON repair_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_technician ON repair_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_progress_order ON progress_logs(order_id);
`;

export async function initDatabase(): Promise<void> {
  await initConnection();
  exec(SCHEMA);
  // 兼容旧数据库：添加可能缺失的列
  try { exec("ALTER TABLE repair_orders ADD COLUMN rush_time TEXT"); } catch {}
  try { exec("ALTER TABLE repair_orders ADD COLUMN detail_location TEXT"); } catch {}
  try { exec("ALTER TABLE repair_orders ADD COLUMN is_rush INTEGER NOT NULL DEFAULT 0"); } catch {}
  console.log("[DB] Schema initialized successfully");
}