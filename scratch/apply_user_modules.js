import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const sql = fs.readFileSync('db/user_modules_migration.sql', 'utf8');
    await pool.query(sql);
    console.log('User Modules Migration applied successfully');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
