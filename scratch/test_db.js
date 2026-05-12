import { query } from './server/lib/db.js';

async function test() {
  try {
    const res = await query('SELECT id, title FROM services LIMIT 10');
    console.log('Services:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
