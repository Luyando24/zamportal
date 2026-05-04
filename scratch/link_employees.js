import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function linkEmployeesToUsers() {
  try {
    // 1. Get HR Management module ID
    const modRes = await pool.query("SELECT id FROM system_modules WHERE slug = 'hr-management'");
    if (modRes.rows.length === 0) return console.log('HR Module not found');
    const hrModId = modRes.rows[0].id;

    // 2. Get all HR entries
    const entriesRes = await pool.query("SELECT id, data FROM module_entries WHERE module_id = $1", [hrModId]);
    console.log(`Found ${entriesRes.rows.length} HR entries`);

    for (const entry of entriesRes.rows) {
      const email = entry.data.email; // Assuming email is in the schema
      if (!email) continue;

      // 3. Find user by email
      const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        // 4. Update entry with user_id
        await pool.query("UPDATE module_entries SET user_id = $1 WHERE id = $2", [userId, entry.id]);
        console.log(`Linked entry ${entry.id} to user ${email}`);
      } else {
        console.log(`User ${email} not found for entry ${entry.id}`);
      }
    }

    console.log('Linking complete');
  } catch (err) {
    console.error('Error linking employees:', err);
  } finally {
    await pool.end();
  }
}

linkEmployeesToUsers();
