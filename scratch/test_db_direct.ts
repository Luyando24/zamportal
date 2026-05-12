import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;

// Try direct connection instead of pooler
const directUrl = "postgresql://postgres:0aw7cuTf9XBbitGO@db.stofrjkiypnqwyjzvzgx.supabase.co:5432/postgres";

const pool = new Pool({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  console.log('Testing DIRECT connection to:', directUrl);
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW()');
    console.log('Success:', res.rows[0]);
    console.log('Duration:', Date.now() - start, 'ms');
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await pool.end();
  }
}

test();
