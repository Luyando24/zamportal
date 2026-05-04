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
    const users = await pool.query("SELECT * FROM profiles LIMIT 5");
    console.log('Profiles:', users.rows.map(u => ({ email: u.email, role: u.role, portal_id: u.portal_id })));
  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    await pool.end();
  }
}

checkUsers();
