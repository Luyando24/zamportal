import { query } from "../server/lib/db.ts";

async function checkTable() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_settings'
    `);
    console.log("AI Settings Columns:", res.rows);
    
    const data = await query("SELECT * FROM ai_settings LIMIT 1");
    console.log("AI Settings Data:", data.rows);
  } catch (err) {
    console.error("Error checking table:", err.message);
  } finally {
    process.exit(0);
  }
}

checkTable();
