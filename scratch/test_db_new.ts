import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;

// Try the new project ref with the same password found in .env.local
const newProjectRef = "qlzmdmfkrpxhvdjdsbgo";
const password = "0aw7cuTf9XBbitGO"; // From the "wrong" project config
const connectionString = `postgresql://postgres.${newProjectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  console.log('Testing connection to NEW project:', newProjectRef);
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
