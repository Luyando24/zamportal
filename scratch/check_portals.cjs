const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkPortals() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  try {
    const res = await client.query('SELECT id, name, slug, is_active FROM portals');
    console.table(res.rows);
  } finally {
    await client.close();
  }
}

checkPortals();
