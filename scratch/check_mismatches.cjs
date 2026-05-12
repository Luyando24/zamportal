const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    console.log('--- Services with non-null portal_id ---');
    const servicesRes = await pool.query(`
        SELECT s.id, s.title, s.portal_id, p.name as creator_portal 
        FROM services s 
        JOIN portals p ON s.portal_id = p.id 
        WHERE s.portal_id IS NOT NULL
    `);
    console.log('Services:', JSON.stringify(servicesRes.rows, null, 2));

    console.log('\n--- Checking for Cross-Portal Form Presence ---');
    // Services created in Portal A but having forms in Portal B
    const mismatchRes = await pool.query(`
        SELECT s.id as service_id, s.title, s.portal_id as creator_id, p1.name as creator_portal, 
               f.portal_id as form_portal_id, p2.name as form_portal
        FROM services s
        JOIN portal_service_forms f ON s.id = f.service_id
        JOIN portals p1 ON s.portal_id = p1.id
        JOIN portals p2 ON f.portal_id = p2.id
        WHERE s.portal_id != f.portal_id
    `);
    console.log('Mismatches:', JSON.stringify(mismatchRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
