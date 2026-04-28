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

async function forceSyncAdmins() {
  await db.connect();
  
  const admins = [
    { email: 'admin@zp.gov.zm', role: 'institutional_admin', portal_id: 'bee7d56b-b5aa-45e3-a70d-fc0ad2b4e67a' },
    { email: 'admin@zpp.gov.zm', role: 'institutional_admin', portal_id: 'bee7d56b-b5aa-45e3-a70d-fc0ad2b4e67a' },
    { email: 'admin@moh.gov.zm', role: 'institutional_admin', portal_id: 'db08ee2e-320d-4936-a62d-d05a6f073be1' },
    { email: 'admin@zamportal.gov.zm', role: 'super_admin', portal_id: null }
  ];

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  for (const admin of admins) {
    const sUser = users.find(u => u.email === admin.email);
    if (!sUser) {
      console.warn(`Admin ${admin.email} NOT FOUND in Supabase.`);
      continue;
    }

    console.log(`Force syncing ${admin.email}...`);

    // 1. Update Supabase
    await supabase.auth.admin.updateUserById(sUser.id, {
      app_metadata: { 
        role: admin.role,
        portal_id: admin.portal_id 
      }
    });

    // 2. Insert/Update Local DB
    await db.query(`
      INSERT INTO users (id, email, role, portal_id, is_active, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        role = EXCLUDED.role,
        portal_id = EXCLUDED.portal_id,
        is_active = EXCLUDED.is_active,
        updated_at = now()
    `, [sUser.id, admin.email, admin.role, admin.portal_id, true, 'SUPABASE_AUTH']);

    console.log(`Success: ${admin.email} is now ${admin.role} linked to ${admin.portal_id || 'Global'}`);
  }

  await db.end();
}

forceSyncAdmins();
