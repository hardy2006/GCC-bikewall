import { initDatabase } from "./db/schema";
import { all, run } from "./db/connection";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(process.env.DATA_DIR || path.join(__dirname, "..", ".."), "uploads");

async function cleanCancelledImages() {
  await initDatabase();

  // 查找所有已取消且有图片的订单
  const orders = all(
    "SELECT id, image_paths FROM repair_orders WHERE status = 'cancelled' AND image_paths IS NOT NULL AND image_paths != '[]'"
  ) as any[];

  let deletedCount = 0;
  let freedBytes = 0;

  for (const order of orders) {
    let paths: string[];
    try {
      paths = JSON.parse(order.image_paths);
    } catch {
      continue;
    }

    for (const url of paths) {
      // 从 URL 中提取文件名
      const filename = url.split("/").pop();
      if (!filename) continue;

      const filepath = path.join(UPLOAD_DIR, filename);
      try {
        if (fs.existsSync(filepath)) {
          const stats = fs.statSync(filepath);
          freedBytes += stats.size;
          fs.unlinkSync(filepath);
          deletedCount++;
          console.log(`[删除] ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
        }
      } catch (err: any) {
        console.log(`[跳过] ${filename}: ${err.message}`);
      }
    }

    // 清空该订单的图片记录
    run("UPDATE repair_orders SET image_paths = '[]' WHERE id = ?", [order.id]);
  }

  console.log(`\n✅ 清理完成！删除了 ${deletedCount} 个文件，释放了 ${(freedBytes / 1024 / 1024).toFixed(2)}MB`);
}

cleanCancelledImages().catch(console.error);
