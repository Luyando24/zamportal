import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    console.log("Checking for specific columns in 'users' table...");
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('portal_id', 'first_name', 'last_name', 'role', 'is_active')
    `);
    console.log("Matching Columns:", res.rows);
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
