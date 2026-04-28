import { query } from "../server/lib/db";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function runMigration() {
  const migrationPath = path.join(process.cwd(), "db", "add_status_history.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");
  
  try {
    console.log("Running status history migration...");
    await query(sql);
    console.log("Migration successful!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
