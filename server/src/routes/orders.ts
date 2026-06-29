import { Router, Request, Response } from "express";
import { get, all, run, insert } from "../db/connection";
import { authMiddleware, requireRole } from "../middleware/auth";
import fs from "fs";
import path from "path";

const router = Router();

// 图片保存目录（支持 Railway Volume 持久化）
const UPLOAD_DIR = path.join(
  process.env.DATA_DIR || path.join(__dirname, "..", ".."),
  "uploads"
);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 公共 SELECT 字段片段
const ORDER_FIELDS = `
  r.id, r.customer_id as customerId, r.technician_id as technicianId,
  r.bike_brand as bikeBrand, r.bike_model as bikeModel, r.bike_color as bikeColor,
  r.problem_description as problemDescription, r.urgent_level as urgentLevel,
  r.status, r.repair_notes as repairNotes,
  r.service_type as serviceType, r.image_paths as imagePaths,
  r.repair_day as repairDay, r.rush_time as rushTime, r.location, r.is_rush as isRush,
  r.created_at as createdAt, r.updated_at as updatedAt,
  c.username as customerName, c.phone as customerPhone,
  t.username as technicianName
`;

// 所有订单路由都需要登录
router.use(authMiddleware);

// ==================== 图片上传 ====================

// POST /api/orders/upload - 上传图片
router.post("/upload", requireRole("customer"), (req: Request, res: Response) => {
  try {
    const { image } = req.body; // base64 字符串
    if (!image) {
      res.status(400).json({ error: "请提供图片数据" });
      return;
    }

    // 去掉 data:image/...;base64, 前缀
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    const ext = matches ? matches[1] : "png";
    const data = matches ? matches[2] : image;

    const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));

    const url = `/uploads/${filename}`;
    res.json({ url, filename });
  } catch (err: any) {
    res.status(500).json({ error: "图片上传失败: " + err.message });
  }
});

// ==================== 订单 CRUD ====================

// POST /api/orders - 客户提交维修订单
router.post("/", requireRole("customer"), (req: Request, res: Response) => {
  try {
    const {
      serviceType, imagePaths, repairDay, location, isRush, rushTime,
      bikeBrand, bikeColor, problemDescription, urgentLevel
    } = req.body;

    if (!serviceType) {
      res.status(400).json({ error: "请选择服务项目" });
      return;
    }
    if (!repairDay) {
      res.status(400).json({ error: "请选择维修日期" });
      return;
    }
    if (repairDay === "加急" && !rushTime) {
      res.status(400).json({ error: "请填写加急时间" });
      return;
    }
    if (!location) {
      res.status(400).json({ error: "请选择维修地点" });
      return;
    }
    if (!imagePaths || (Array.isArray(imagePaths) && imagePaths.length === 0)) {
      res.status(400).json({ error: "请上传单车位置图片" });
      return;
    }

    const validLevels = ["low", "normal", "high", "urgent"];
    const level = validLevels.includes(urgentLevel) ? urgentLevel : "normal";
    const rush = isRush ? 1 : 0;
    const imgs = JSON.stringify(Array.isArray(imagePaths) ? imagePaths : []);

    const newId = insert(
      `INSERT INTO repair_orders
       (customer_id, service_type, image_paths, repair_day, rush_time, location, is_rush,
        bike_brand, bike_color, problem_description, urgent_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.userId, serviceType, imgs, repairDay, rushTime || null, location, rush,
       bikeBrand || null, bikeColor || null, problemDescription || "", level]
    );

    run(
      "INSERT INTO progress_logs (order_id, operator_id, action, new_status) VALUES (?, ?, ?, ?)",
      [newId, req.user!.userId, "提交维修申请", "pending"]
    );

    const rows = all(`SELECT ${ORDER_FIELDS} FROM repair_orders r
      JOIN users c ON r.customer_id = c.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE r.id = ?`, [newId]) as any[];
    const order = rows[0];
    if (order) order.imagePaths = order.imagePaths ? JSON.parse(order.imagePaths) : [];

    res.status(201).json({ message: "维修订单已提交", order });
  } catch (err: any) {
    res.status(500).json({ error: "提交订单失败: " + err.message });
  }
});

// GET /api/orders - 运营者查看所有订单（支持筛选）
router.get("/", requireRole("operator"), (req: Request, res: Response) => {
  try {
    let { repairDay, location, isRush } = req.query;
    let where = "1=1";
    const params: any[] = [];
    if (repairDay && repairDay !== "all") { where += " AND r.repair_day = ?"; params.push(repairDay); }
    if (location && location !== "all") { where += " AND r.location = ?"; params.push(location); }
    if (isRush !== undefined && isRush !== "all") { where += " AND r.is_rush = ?"; params.push(isRush === "1" ? 1 : 0); }

    const orders = all(`SELECT ${ORDER_FIELDS} FROM repair_orders r
      JOIN users c ON r.customer_id = c.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE ${where}
      ORDER BY r.is_rush DESC, r.created_at DESC`, params) as any[];

    for (const o of orders) {
      o.imagePaths = o.imagePaths ? JSON.parse(o.imagePaths) : [];
    }

    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/my - 客户查看自己的订单
router.get("/my", requireRole("customer"), (req: Request, res: Response) => {
  try {
    const orders = all(`SELECT ${ORDER_FIELDS} FROM repair_orders r
      JOIN users c ON r.customer_id = c.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC`, [req.user!.userId]) as any[];

    for (const o of orders) {
      o.imagePaths = o.imagePaths ? JSON.parse(o.imagePaths) : [];
    }

    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/technician - 维修员查看订单（支持筛选）
router.get("/technician", requireRole("technician"), (req: Request, res: Response) => {
  try {
    let { repairDay, location, isRush } = req.query;
    let where = "(r.status = ? OR r.technician_id = ?)";
    const params: any[] = ["pending", req.user!.userId];
    if (repairDay && repairDay !== "all") { where += " AND r.repair_day = ?"; params.push(repairDay); }
    if (location && location !== "all") { where += " AND r.location = ?"; params.push(location); }
    if (isRush !== undefined && isRush !== "all") { where += " AND r.is_rush = ?"; params.push(isRush === "1" ? 1 : 0); }

    const orders = all(`SELECT ${ORDER_FIELDS} FROM repair_orders r
      JOIN users c ON r.customer_id = c.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE ${where}
      ORDER BY r.is_rush DESC, r.created_at DESC`, params) as any[];

    for (const o of orders) {
      o.imagePaths = o.imagePaths ? JSON.parse(o.imagePaths) : [];
    }

    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id - 查看订单详情
router.get("/:id", (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = get(`SELECT ${ORDER_FIELDS} FROM repair_orders r
      JOIN users c ON r.customer_id = c.id
      LEFT JOIN users t ON r.technician_id = t.id
      WHERE r.id = ?`, [orderId]) as any;

    if (!order) { res.status(404).json({ error: "订单不存在" }); return; }

    const { user } = req;
    if (user!.role === "customer" && order.customerId !== user!.userId) {
      res.status(403).json({ error: "无权查看此订单" }); return;
    }
    order.imagePaths = order.imagePaths ? JSON.parse(order.imagePaths) : [];

    const logs = all(`SELECT p.id, p.order_id as orderId, p.operator_id as operatorId,
      u.username as operatorName, p.action, p.old_status as oldStatus, p.new_status as newStatus,
      p.note, p.created_at as createdAt
      FROM progress_logs p JOIN users u ON p.operator_id = u.id
      WHERE p.order_id = ? ORDER BY p.created_at ASC`, [orderId]);

    res.json({ order, logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/accept - 接单
router.patch("/:id/accept", requireRole("technician", "operator"), (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = get("SELECT * FROM repair_orders WHERE id = ?", [orderId]) as any;
    if (!order) { res.status(404).json({ error: "订单不存在" }); return; }
    if (order.status !== "pending") { res.status(400).json({ error: "该订单已被接单或已完成" }); return; }

    const techId = req.user!.role === "operator" ? req.body.technicianId || req.user!.userId : req.user!.userId;
    run("UPDATE repair_orders SET technician_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [techId, "accepted", orderId]);
    run("INSERT INTO progress_logs (order_id, operator_id, action, old_status, new_status) VALUES (?, ?, ?, ?, ?)",
      [orderId, req.user!.userId, "接单", "pending", "accepted"]);

    const updated = get(`SELECT ${ORDER_FIELDS} FROM repair_orders r
      JOIN users c ON r.customer_id = c.id LEFT JOIN users t ON r.technician_id = t.id
      WHERE r.id = ?`, [orderId]) as any;
    if (updated) updated.imagePaths = updated.imagePaths ? JSON.parse(updated.imagePaths) : [];

    res.json({ message: "接单成功", order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status - 更新订单状态
router.patch("/:id/status", requireRole("technician", "operator"), (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, note } = req.body;
    const validStatuses = ["accepted", "repairing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) { res.status(400).json({ error: "无效的状态值" }); return; }

    const order = get("SELECT * FROM repair_orders WHERE id = ?", [orderId]) as any;
    if (!order) { res.status(404).json({ error: "订单不存在" }); return; }

    const oldStatus = order.status;
    const actionMap: Record<string, string> = {
      accepted: "重新接受", repairing: "开始维修", completed: "维修完成", cancelled: "取消订单",
    };

    if (note) {
      run("UPDATE repair_orders SET status = ?, repair_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, note, orderId]);
    } else {
      run("UPDATE repair_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, orderId]);
    }

    run("INSERT INTO progress_logs (order_id, operator_id, action, old_status, new_status, note) VALUES (?, ?, ?, ?, ?, ?)",
      [orderId, req.user!.userId, actionMap[status] || status, oldStatus, status, note || null]);

    const updated = get(`SELECT ${ORDER_FIELDS} FROM repair_orders r
      JOIN users c ON r.customer_id = c.id LEFT JOIN users t ON r.technician_id = t.id
      WHERE r.id = ?`, [orderId]) as any;
    if (updated) updated.imagePaths = updated.imagePaths ? JSON.parse(updated.imagePaths) : [];

    res.json({ message: "状态已更新", order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;