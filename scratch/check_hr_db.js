import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDb() {
  try {
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('system_modules', 'portal_modules', 'module_entries', 'portals');
    `);
    console.log('Existing tables:', tables.rows.map(r => r.table_name));

    if (tables.rows.some(r => r.table_name === 'system_modules')) {
      const hrModule = await pool.query("SELECT * FROM system_modules WHERE slug = 'hr-management'");
      console.log('HR Module exists:', hrModule.rows.length > 0);
      if (hrModule.rows.length > 0) {
        console.log('HR Schema:', JSON.stringify(hrModule.rows[0].schema_definition, null, 2));
      }
    }

    const portals = await pool.query("SELECT id, name, slug FROM portals");
    console.log('Portals:', portals.rows);

  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await pool.end();
  }
}

checkDb();
