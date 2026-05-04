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

async function verify() {
  const client = await pool.connect();
  try {
    console.log('--- Verification Start ---');
    
    // 1. Create a test portal
    const portalRes = await client.query(
      "INSERT INTO portals (name, slug, description) VALUES ($1, $2, $3) RETURNING id",
      ['Test Portal', 'test-portal-' + Date.now(), 'Description']
    );
    const portalId = portalRes.rows[0].id;
    console.log(`Created test portal: ${portalId}`);

    // 2. Create a test service "belonging" to this portal
    const catRes = await client.query("SELECT id FROM service_categories LIMIT 1");
    const categoryId = catRes.rows[0].id;
    
    const serviceRes = await client.query(
      "INSERT INTO services (title, slug, category_id, portal_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ['Test Owned Service', 'test-service-' + Date.now(), categoryId, portalId]
    );
    const serviceId = serviceRes.rows[0].id;
    console.log(`Created owned service: ${serviceId}`);

    // 3. Verify service exists
    const check1 = await client.query("SELECT count(*) FROM services WHERE id = $1", [serviceId]);
    console.log(`Service count before portal delete: ${check1.rows[0].count}`);

    // 4. Delete the portal
    console.log('Deleting portal...');
    await client.query("DELETE FROM portals WHERE id = $1", [portalId]);

    // 5. Verify service is gone
    const check2 = await client.query("SELECT count(*) FROM services WHERE id = $1", [serviceId]);
    console.log(`Service count after portal delete: ${check2.rows[0].count}`);

    if (check2.rows[0].count === '0') {
      console.log('SUCCESS: Service was purged automatically!');
    } else {
      console.error('FAILURE: Service still exists!');
    }

    console.log('--- Verification End ---');
  } catch (err) {
    console.error('Verification Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
