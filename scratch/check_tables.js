import { query } from "./server/lib/db.js";

async function checkTables() {
  try {
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Error:", err);
  }
}

checkTables();
