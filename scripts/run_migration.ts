import { query } from "../server/lib/db";
import fs from "fs";
import path from "path";

async function runMigration() {
  const migrationPath = path.join(process.cwd(), "db", "migrate_sub_services.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");
  
  try {
    console.log("Running sub-services migration...");
    // Split by semicolon and run each statement if transaction is complex
    // Or just run the whole thing if the driver supports it
    await query(sql);
    console.log("Migration successful!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
