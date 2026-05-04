import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDb() {
  try {
    const portalModules = await pool.query("SELECT * FROM portal_modules");
    console.log('Portal Modules:', portalModules.rows);

    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'module_entries' AND column_name = 'portal_id'
    `);
    console.log('module_entries has portal_id:', columnCheck.rows.length > 0);

  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await pool.end();
  }
}

checkDb();
