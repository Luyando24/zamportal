const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function ultimateSync() {
  await db.connect();
  
  console.log("Fetching all users from Supabase...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  console.log(`Found ${users.length} users. Syncing to local DB...`);

  for (const sUser of users) {
    const role = sUser.app_metadata.role || 'user';
    const portalId = sUser.app_metadata.portal_id || null;
    const fullName = sUser.user_metadata.full_name || sUser.user_metadata.first_name || 'Admin';
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "User";

    await db.query(`
      INSERT INTO users (id, email, role, portal_id, is_active, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        role = EXCLUDED.role,
        portal_id = EXCLUDED.portal_id,
        is_active = EXCLUDED.is_active,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = now()
    `, [sUser.id, sUser.email, role, portalId, true, 'SUPABASE_AUTH', firstName, lastName]);

    console.log(`Synced: ${sUser.email} [${role}]`);
  }

  console.log("Sync complete!");
  await db.end();
}

ultimateSync();
