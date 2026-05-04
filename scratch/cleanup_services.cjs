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

async function cleanup() {
  const client = await pool.connect();
  try {
    console.log('--- Database Cleanup Start ---');
    
    // 1. Delete services that are not linked to any portal (Orphaned)
    const orphanedRes = await client.query(`
      DELETE FROM services 
      WHERE id NOT IN (SELECT service_id FROM portal_services)
    `);
    console.log(`Deleted ${orphanedRes.rowCount} orphaned services.`);

    // 2. Delete remaining seeded services (portal_id IS NULL)
    // (Note: Step 1 might have already covered many of these if they were unlinked)
    const seededRes = await client.query(`
      DELETE FROM services 
      WHERE portal_id IS NULL
    `);
    console.log(`Deleted ${seededRes.rowCount} seeded/global services.`);

    console.log('--- Database Cleanup End ---');
  } catch (err) {
    console.error('Cleanup Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup();
