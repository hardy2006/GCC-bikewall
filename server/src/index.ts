import express from "express";
import cors from "cors";
import path from "path";
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
    { username: "customer1", role: "customer", realName: "张三", phone: "13800000001" },
    { username: "customer2", role: "customer", realName: "李四", phone: "13800000002" },
    { username: "tech1", role: "technician", realName: "王维修", phone: "13800000003" },
    { username: "tech2", role: "technician", realName: "赵维修", phone: "13800000004" },
    { username: "operator1", role: "operator", realName: "刘运营", phone: "13800000005" },
  ];
  for (const u of demoUsers) {
    run("INSERT INTO users (username, password_hash, role, real_name, phone) VALUES (?, ?, ?, ?, ?)",
      [u.username, hash, u.role, u.realName, u.phone]);
  }

  const orders = [
    { cid: 1, svc: "刹车调试-双边(15r)", day: "周二", loc: "四教停车场", rush: 1, brand: "捷安特", model: "ATX 860", color: "黑色", desc: "前刹车不灵敏，刹车时有异响" },
    { cid: 2, svc: "内胎更换-前轮(25r)", day: "周五", loc: "46栋停车场", rush: 0, brand: "美利达", model: "公爵 600", color: "白色", desc: "后轮车胎漏气，骑行时有晃动感" },
    { cid: 1, svc: "链条更换(15r)", day: "周二", loc: "四教停车场", rush: 0, brand: "凤凰", model: "经典款", color: "红色", desc: "链条经常脱落，变速器换挡不顺畅" },
  ];
  for (const o of orders) {
    const id = insert(
      `INSERT INTO repair_orders (customer_id, service_type, image_paths, repair_day, location, is_rush, bike_brand, bike_model, bike_color, problem_description, urgent_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.cid, o.svc, "[]", o.day, o.loc, o.rush, o.brand, o.model, o.color, o.desc, o.rush ? "high" : "normal"]);
    run("INSERT INTO progress_logs (order_id, operator_id, action, new_status) VALUES (?, ?, ?, ?)",
      [id, o.cid, "提交维修申请", "pending"]);
  }

  console.log("[Seed] 5 个演示账号 + 3 个示例订单已创建");
}

async function main() {
  await initDatabase();
  seedIfEmpty();

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://gcc-bikewall.pages.dev"
    ],
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

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
