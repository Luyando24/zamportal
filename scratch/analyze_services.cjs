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

async function analyze() {
  const client = await pool.connect();
  try {
    const total = await client.query("SELECT count(*) FROM services");
    const seeded = await client.query("SELECT count(*) FROM services WHERE portal_id IS NULL");
    const unlinked = await client.query("SELECT count(*) FROM services WHERE id NOT IN (SELECT service_id FROM portal_services)");
    
    console.log(`Total Services: ${total.rows[0].count}`);
    console.log(`Seeded/Global (portal_id IS NULL): ${seeded.rows[0].count}`);
    console.log(`Unlinked (not in portal_services): ${unlinked.rows[0].count}`);
    
    const samples = await client.query("SELECT title, portal_id FROM services LIMIT 10");
    console.log('Samples:');
    console.table(samples.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

analyze();
