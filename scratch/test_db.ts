import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  console.log('Testing connection to:', process.env.DATABASE_URL);
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
