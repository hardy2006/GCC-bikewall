import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { get, run, insert } from "../db/connection";
import { signToken, authMiddleware } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", (req: Request, res: Response) => {
  try {
    const { username, password, role, phone, realName } = req.body;

    if (!username || !password || !role) {
      res.status(400).json({ error: "用户名、密码和角色为必填项" });
      return;
    }

    if (!["customer", "technician", "operator"].includes(role)) {
      res.status(400).json({ error: "无效的角色类型" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "密码至少需要6个字符" });
      return;
    }

    const existing = get("SELECT id FROM users WHERE username = ?", [username]);
    if (existing) {
      res.status(409).json({ error: "用户名已存在" });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newId = insert(
      "INSERT INTO users (username, password_hash, role, phone, real_name) VALUES (?, ?, ?, ?, ?)",
      [username, passwordHash, role, phone || null, realName || null]
    );

    const newUser = get(
      "SELECT id, username, role, phone, real_name, created_at FROM users WHERE id = ?",
      [newId]
    ) as any;

    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });

    res.status(201).json({
      message: "注册成功",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        phone: newUser.phone,
        realName: newUser.real_name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "注册失败: " + err.message });
  }
});

// POST /api/auth/login
router.post("/login", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "请输入用户名和密码" });
      return;
    }

    const user = get(
      "SELECT id, username, password_hash, role, phone, real_name FROM users WHERE username = ?",
      [username]
    ) as any;

    if (!user) {
      res.status(401).json({ error: "用户名或密码错误" });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "用户名或密码错误" });
      return;
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.json({
      message: "登录成功",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone,
        realName: user.real_name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "登录失败: " + err.message });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, (req: Request, res: Response) => {
  try {
    const user = get(
      "SELECT id, username, role, phone, real_name FROM users WHERE id = ?",
      [req.user!.userId]
    ) as any;

    if (!user) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone,
        realName: user.real_name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;