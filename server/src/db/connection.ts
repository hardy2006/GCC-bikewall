import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "..", "data", "bike-repair.db");

let db: SqlJsDatabase | null = null;

async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;
  const SQL = await initSqlJs();
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// 执行写操作（INSERT/UPDATE/DELETE）
export function run(sql: string, params: any[] = []): number {
  if (!db) throw new Error("Database not initialized");
  try {
    db.run(sql, params);
    saveDatabase();
    return db.getRowsModified();
  } catch (err: any) {
    throw new Error(`SQL Error: ${err.message}`);
  }
}

// 执行 INSERT 并返回新插入行的 ID
export function insert(sql: string, params: any[] = []): number {
  if (!db) throw new Error("Database not initialized");
  try {
    db.run(sql, params);
    // 必须在 saveDatabase / export 之前获取 last_insert_rowid
    const result = db.exec("SELECT last_insert_rowid() as id");
    saveDatabase();
    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0] as number;
    }
    return 0;
  } catch (err: any) {
    throw new Error(`SQL Error: ${err.message}`);
  }
}

export function get<T = any>(sql: string, params: any[] = []): T | undefined {
  if (!db) throw new Error("Database not initialized");
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as unknown as T;
    }
    stmt.free();
    return undefined;
  } catch (err: any) {
    throw new Error(`SQL Error: ${err.message}`);
  }
}

export function all<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error("Database not initialized");
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return rows;
  } catch (err: any) {
    throw new Error(`SQL Error: ${err.message}`);
  }
}

export function exec(sql: string): void {
  if (!db) throw new Error("Database not initialized");
  try {
    db.exec(sql);
    saveDatabase();
  } catch (err: any) {
    throw new Error(`SQL Error: ${err.message}`);
  }
}

export function getLastInsertId(): number {
  if (!db) throw new Error("Database not initialized");
  const result = db.exec("SELECT last_insert_rowid() as id");
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number;
  }
  return 0;
}

export async function initConnection(): Promise<void> {
  await getDatabase();
}

export default { run, insert, get, all, exec, initConnection, getLastInsertId };