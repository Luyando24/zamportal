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
    console.log('--- Investigating "company-registration" ---');
    const serviceRes = await pool.query("SELECT * FROM services WHERE slug = 'company-registration'");
    console.log('Service Data:', JSON.stringify(serviceRes.rows, null, 2));

    if (serviceRes.rows.length > 0) {
      const service = serviceRes.rows[0];
      
      console.log('\n--- Portal Services (links) ---');
      const linksRes = await pool.query("SELECT ps.*, p.name as portal_name, p.slug as portal_slug FROM portal_services ps JOIN portals p ON ps.portal_id = p.id WHERE ps.service_id = $1", [service.id]);
      console.log('Links:', JSON.stringify(linksRes.rows, null, 2));

      console.log('\n--- Portal Service Forms ---');
      const formsRes = await pool.query("SELECT f.*, p.name as portal_name, p.slug as portal_slug FROM portal_service_forms f LEFT JOIN portals p ON f.portal_id = p.id WHERE f.service_id = $1", [service.id]);
      console.log('Forms:', JSON.stringify(formsRes.rows, null, 2));
    } else {
        console.log('Service "company-registration" not found by exact slug.');
        // Try ILIKE
        const searchRes = await pool.query("SELECT title, slug FROM services WHERE slug ILIKE '%registration%' OR title ILIKE '%registration%'");
        console.log('Similar services:', JSON.stringify(searchRes.rows, null, 2));
    }

    console.log('\n--- Portals with "lands" in slug ---');
    const portalsRes = await pool.query("SELECT id, name, slug FROM portals WHERE slug ILIKE '%lands%'");
    console.log('Lands Portals:', JSON.stringify(portalsRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
