# 🚲 GCC-bikewall — 广商单车墙维修管理系统

面向 GCC 广商校园的单车维修管理平台。客户在线提交维修单（含价目表、图片上传），维修员自主接单并更新进度，运营者全局监控。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Tailwind CSS + Vite |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite (sql.js WASM) |
| 认证 | JWT |

## 快速启动

```bash
# 1. 安装依赖
cd server && npm install
cd ../client && npm install

# 2. 初始化数据库（含演示数据）
cd ../server && npm run seed

# 3. 启动后端 (http://localhost:3001)
npm run dev

# 4. 另开终端，启动前端 (http://localhost:5173)
cd ../client && npm run dev
```

## 演示账号

密码均为 `123456`

| 角色 | 用户名 |
|------|--------|
| 客户 | customer1 / customer2 |
| 维修员 | tech1 / tech2 |
| 运营者 | operator1 |

## 功能

- 🔐 注册/登录（JWT），客户自助注册，维修员和运营者由管理员创建
- 📝 客户提交维修申请（含 GCC 价目表服务项目选择）
- 📸 上传单车位置图片
- 📅 选择维修日期（周二/周五）和地点（四教/46栋停车场）
- ⚡ 加急选项
- 🔧 维修员查看待接订单、自主接单、更新维修进度
- 📊 运营者全局面板，按日期→地点→加急层级筛选
- 📋 完整进度日志

## 项目结构

```
bike-repair/
├── server/                 # Express + SQLite 后端
│   ├── src/
│   │   ├── index.ts        # 服务入口
│   │   ├── seed.ts         # 种子数据
│   │   ├── db/             # 数据库连接与 Schema
│   │   ├── middleware/      # JWT 认证中间件
│   │   └── routes/         # auth + orders 路由
│   └── package.json
├── client/                 # React 前端
│   ├── src/
│   │   ├── main.tsx / App.tsx
│   │   ├── hooks/          # useAuth (AuthContext) + useOrders
│   │   ├── lib/            # API 请求封装
│   │   ├── components/     # Layout, OrderCard, StatusBadge
│   │   └── pages/          # 登录/客户/维修员/运营者面板
│   └── package.json
└── start.bat               # Windows 一键启动脚本
```

## 生产部署

```bash
# 构建
cd client && npm run build     # → dist/
cd server && npm run build     # → dist/

# 启动（用 PM2）
pm2 start server/dist/index.js --name bike-repair

# Nginx 配置见 README 完整版
```

## License

MIT
