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
    console.log('--- Global Services (portal_id IS NULL) linked to Portals ---');
    const res = await pool.query(`
        SELECT s.title, p.name as portal_name, p.slug as portal_slug
        FROM portal_services ps
        JOIN services s ON ps.service_id = s.id
        JOIN portals p ON ps.portal_id = p.id
        WHERE s.portal_id IS NULL
    `);
    console.log('Linked Global Services:', JSON.stringify(res.rows, null, 2));

    console.log('\n--- Local Services (portal_id NOT NULL) linked to OTHER Portals ---');
    const res2 = await pool.query(`
        SELECT s.title, p1.name as creator_portal, p2.name as linked_portal
        FROM portal_services ps
        JOIN services s ON ps.service_id = s.id
        JOIN portals p1 ON s.portal_id = p1.id
        JOIN portals p2 ON ps.portal_id = p2.id
        WHERE s.portal_id != ps.portal_id
    `);
    console.log('Cross-Linked Local Services:', JSON.stringify(res2.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
