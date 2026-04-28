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

async function hardSyncAdmins() {
  await db.connect();
  
  const admins = [
    { email: 'admin@zp.gov.zm', portal_id: 'bee7d56b-b5aa-45e3-a70d-fc0ad2b4e67a' },
    { email: 'admin@moh.gov.zm', portal_id: 'db08ee2e-320d-4936-a62d-d05a6f073be1' },
    { email: 'admin@zamportal.gov.zm', portal_id: null }
  ];

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  for (const admin of admins) {
    const sUser = users.find(u => u.email === admin.email);
    if (!sUser) {
      console.error(`Admin ${admin.email} NOT FOUND in Supabase. Please register them first.`);
      continue;
    }

    console.log(`Syncing ${admin.email}...`);

    // 1. Force update Supabase metadata
    const { error: sError } = await supabase.auth.admin.updateUserById(sUser.id, {
      app_metadata: { 
        role: 'admin',
        portal_id: admin.portal_id 
      }
    });

    if (sError) console.error(`Supabase update failed for ${admin.email}:`, sError.message);
    else console.log(`Supabase Auth updated for ${admin.email}`);

    // 2. Force update/insert local DB
    await db.query(`
      INSERT INTO users (id, email, role, portal_id, is_active, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        role = EXCLUDED.role,
        portal_id = EXCLUDED.portal_id,
        is_active = EXCLUDED.is_active,
        updated_at = now()
    `, [sUser.id, admin.email, 'admin', admin.portal_id, true, 'SUPABASE_AUTH']);

    console.log(`Local DB updated for ${admin.email}`);
  }

  await db.end();
}

hardSyncAdmins();
