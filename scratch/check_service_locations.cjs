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
    const serviceTitle = 'Mining License Application';
    console.log(`--- Checking Portals for "${serviceTitle}" ---`);
    
    // Check creator portal
    const creatorRes = await pool.query(`
        SELECT p.name as creator_portal
        FROM services s
        JOIN portals p ON s.portal_id = p.id
        WHERE s.title = $1
    `, [serviceTitle]);
    console.log('Creator Portal:', JSON.stringify(creatorRes.rows, null, 2));

    // Check all linked portals
    const linkedRes = await pool.query(`
        SELECT p.name as linked_portal
        FROM portal_services ps
        JOIN portals p ON ps.portal_id = p.id
        JOIN services s ON ps.service_id = s.id
        WHERE s.title = $1
    `, [serviceTitle]);
    console.log('Linked Portals:', JSON.stringify(linkedRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
