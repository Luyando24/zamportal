const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkPortals() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    const res = await client.query('SELECT name, slug FROM portals');
    console.log('Portals:', res.rows);
    
    const servicesRes = await client.query('SELECT title FROM services');
    console.log('Services:', servicesRes.rows.map(r => r.title));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkPortals();
