import { initDatabase } from "./db/schema";
import { run, all, insert } from "./db/connection";
import bcrypt from "bcryptjs";

async function seed() {
  await initDatabase();

  console.log("Seeding demo data...");

  // 检查是否已有数据
  const existingUsers = all("SELECT id FROM users");
  if (existingUsers.length > 0) {
    console.log("Database already has users, skipping seed.");
    return;
  }

  const hash = bcrypt.hashSync("123456", 10);

  // 创建演示用户
  const users = [
    { username: "customer1", role: "customer", realName: "张三", phone: "13800000001" },
    { username: "customer2", role: "customer", realName: "李四", phone: "13800000002" },
    { username: "tech1", role: "technician", realName: "王维修", phone: "13800000003" },
    { username: "tech2", role: "technician", realName: "赵维修", phone: "13800000004" },
    { username: "operator1", role: "operator", realName: "刘运营", phone: "13800000005" },
  ];

  for (const u of users) {
    run(
      "INSERT INTO users (username, password_hash, role, real_name, phone) VALUES (?, ?, ?, ?, ?)",
      [u.username, hash, u.role, u.realName, u.phone]
    );
  }

  console.log(`Created ${users.length} demo users`);

  // 创建示例订单
  const sampleOrders = [
    {
      customerId: 1,
      serviceType: "刹车调试-双边(15r)",
      imagePaths: "[]",
      repairDay: "周二",
      location: "四教停车场",
      isRush: 1,
      bikeBrand: "捷安特",
      bikeModel: "ATX 860",
      bikeColor: "黑色",
      problemDescription: "前刹车不灵敏，刹车时有异响",
      urgentLevel: "high",
    },
    {
      customerId: 2,
      serviceType: "内胎更换-前轮(25r)",
      imagePaths: "[]",
      repairDay: "周五",
      location: "46栋停车场",
      isRush: 0,
      bikeBrand: "美利达",
      bikeModel: "公爵 600",
      bikeColor: "白色",
      problemDescription: "后轮车胎漏气，骑行时有晃动感",
      urgentLevel: "normal",
    },
    {
      customerId: 1,
      serviceType: "链条更换(15r)",
      imagePaths: "[]",
      repairDay: "周二",
      location: "四教停车场",
      isRush: 0,
      bikeBrand: "凤凰",
      bikeModel: "经典款",
      bikeColor: "红色",
      problemDescription: "链条经常脱落，变速器换挡不顺畅",
      urgentLevel: "low",
    },
  ];

  for (const o of sampleOrders) {
    const orderId = insert(
      `INSERT INTO repair_orders (customer_id, service_type, image_paths, repair_day, location, is_rush,
       bike_brand, bike_model, bike_color, problem_description, urgent_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.customerId, o.serviceType, o.imagePaths, o.repairDay, o.location, o.isRush,
       o.bikeBrand, o.bikeModel, o.bikeColor, o.problemDescription, o.urgentLevel]
    );

    // 记录创建日志
    run(
      "INSERT INTO progress_logs (order_id, operator_id, action, new_status) VALUES (?, ?, ?, ?)",
      [orderId, o.customerId, "提交维修申请", "pending"]
    );
  }

  console.log(`Created ${sampleOrders.length} sample orders`);
  console.log("Seed completed!");
}

seed().catch(console.error);