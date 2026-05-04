const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding summary column to portals table...');
    await client.query('ALTER TABLE portals ADD COLUMN IF NOT EXISTS summary TEXT;');
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
