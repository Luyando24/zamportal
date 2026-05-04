import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import pg from 'pg';

async function check() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const res = await pool.query("SELECT current_database(), current_user, current_schema();");
    console.log('Connection details:', res.rows[0]);
    
    const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users';");
    console.log('Users tables found:', tables.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();
