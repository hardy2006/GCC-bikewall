import express from "express";
import cors from "cors";
import path from "path";
import { initDatabase } from "./db/schema";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orders";

async function main() {
  // 初始化数据库
  await initDatabase();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // 中间件
  app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));

  // 静态文件：上传的图片
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  // 请求日志
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.path}`);
    next();
  });

  // API 路由
  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);

  // 健康检查
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: "接口不存在" });
  });

  // 错误处理
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
