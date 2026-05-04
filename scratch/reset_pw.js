import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcrypt';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
  try {
    const hash = await bcrypt.hash('password', 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'admin@mof.gov.zm'", [hash]);
    console.log('Password reset successfully for admin@mof.gov.zm');
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    await pool.end();
  }
}

resetPassword();
