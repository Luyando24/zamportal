const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkForms() {
  try {
    console.log('--- Portals ---');
    const portals = await pool.query('SELECT id, name, slug FROM portals');
    console.table(portals.rows);

    console.log('\n--- Services ---');
    const services = await pool.query('SELECT id, title, slug FROM services');
    console.table(services.rows);

    console.log('\n--- Portal Service Forms ---');
    const forms = await pool.query('SELECT id, portal_id, service_id, form_name, form_slug FROM portal_service_forms');
    console.table(forms.rows);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkForms();
