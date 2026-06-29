import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { initDatabase } from "./db/schema";
import { run, all, insert } from "./db/connection";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orders";

async function seedIfEmpty() {
  const users = all("SELECT id FROM users LIMIT 1");
  if (users.length > 0) return;

  console.log("[Seed] 数据库为空，自动写入演示账号...");
  const hash = bcrypt.hashSync("123456", 10);
  const demoUsers = [
    { username: "tech1", role: "technician", realName: "王维修", phone: "13800000003" },
    { username: "tech2", role: "technician", realName: "赵维修", phone: "13800000004" },
    { username: "operator1", role: "operator", realName: "刘运营", phone: "13800000005" },
  ];
  for (const u of demoUsers) {
    run("INSERT INTO users (username, password_hash, role, real_name, phone) VALUES (?, ?, ?, ?, ?)",
      [u.username, hash, u.role, u.realName, u.phone]);
  }
  console.log("[Seed] 演示账号已创建: tech1, tech2, operator1");
}

function cleanCancelledImages() {
  const uploadDir = process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR, "uploads")
    : path.join(__dirname, "..", "uploads");

  if (!fs.existsSync(uploadDir)) return;

  const orders = all(
    "SELECT id, image_paths FROM repair_orders WHERE status = 'cancelled' AND image_paths IS NOT NULL AND image_paths != '[]'"
  ) as any[];

  if (orders.length === 0) return;

  let deleted = 0, freed = 0;
  for (const order of orders) {
    let paths: string[];
    try { paths = JSON.parse(order.image_paths); } catch { continue; }
    for (const url of paths) {
      const filename = url.split("/").pop();
      if (!filename) continue;
      const filepath = path.join(uploadDir, filename);
      try {
        if (fs.existsSync(filepath)) {
          freed += fs.statSync(filepath).size;
          fs.unlinkSync(filepath);
          deleted++;
        }
      } catch { /* ignore */ }
    }
    run("UPDATE repair_orders SET image_paths = '[]' WHERE id = ?", [order.id]);
  }
  console.log(`[Cleanup] 已清理 ${deleted} 个已取消订单的图片，释放 ${(freed / 1024 / 1024).toFixed(2)}MB`);
}

async function main() {
  await initDatabase();
  seedIfEmpty();
  cleanCancelledImages();

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://gcc-bikewall.pages.dev",
      "https://gcc-bike.top",
      "https://api.gcc-bike.top"
    ],
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use("/uploads", express.static(process.env.DATA_DIR ? path.join(process.env.DATA_DIR, "uploads") : path.join(__dirname, "..", "uploads")));

  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.path}`);
    next();
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "接口不存在" });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Error]", err.message);
    res.status(500).json({ error: "服务器内部错误" });
  });

  app.listen(PORT, () => {
    console.log(`[Server] Bike Repair API running on http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  });
}

main().catch(console.error);

export { main };
