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
    const res = await pool.query('SELECT COUNT(*) FROM portal_service_forms');
    console.log('Forms count:', res.rows[0].count);
    
    if (res.rows[0].count > 0) {
      const forms = await pool.query('SELECT id, portal_id, service_id, form_name, form_slug FROM portal_service_forms');
      console.log('Forms:', JSON.stringify(forms.rows, null, 2));
    }

    const services = await pool.query('SELECT title, slug FROM services');
    console.log('Services:', JSON.stringify(services.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
