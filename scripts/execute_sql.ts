import { query } from "../server/lib/db";
import fs from "fs";
import path from "path";

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error("Please specify a SQL file path");
    process.exit(1);
  }
  
  const sqlPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(sqlPath)) {
    console.error(`File not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  
  try {
    console.log(`Executing ${file}...`);
    await query(sql);
    console.log("Execution successful!");
    process.exit(0);
  } catch (error) {
    console.error("Execution failed:", error);
    process.exit(1);
  }
}

run();
