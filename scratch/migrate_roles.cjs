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

async function migrateRoles() {
  await db.connect();
  
  const admins = [
    { email: 'admin@zp.gov.zm', role: 'institutional_admin', portal_id: 'bee7d56b-b5aa-45e3-a70d-fc0ad2b4e67a' },
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
      console.error(`Admin ${admin.email} NOT FOUND in Supabase.`);
      continue;
    }

    console.log(`Migrating ${admin.email} to ${admin.role}...`);

    // 1. Update Supabase
    await supabase.auth.admin.updateUserById(sUser.id, {
      app_metadata: { 
        role: admin.role,
        portal_id: admin.portal_id 
      }
    });

    // 2. Update Local DB
    await db.query(`
      UPDATE users 
      SET role = $1, portal_id = $2 
      WHERE email = $3
    `, [admin.role, admin.portal_id, admin.email]);

    console.log(`Success for ${admin.email}`);
  }

  await db.end();
}

migrateRoles();
