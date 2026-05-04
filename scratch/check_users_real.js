import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    const users = await pool.query("SELECT email, role, portal_id FROM users");
    console.log('Users:', users.rows);
  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    await pool.end();
  }
}

checkUsers();
