import { query } from "../server/lib/db";
import fs from "fs";
import path from "path";

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, "../db/migrate_sub_services.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log("Running migration...");
    await query(sql, []);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit();
  }
}

migrate();
