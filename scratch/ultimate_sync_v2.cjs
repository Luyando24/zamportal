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
  
  // 1. Get valid portals
  const portalsRes = await db.query('SELECT id, slug FROM portals');
  const validPortals = portalsRes.rows;
  const validIds = validPortals.map(p => p.id);

  console.log("Fetching all users from Supabase...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  console.log(`Found ${users.length} users. Syncing to local DB...`);

  for (const sUser of users) {
    let portalId = sUser.app_metadata.portal_id || null;
    let role = sUser.app_metadata.role || 'user';
    const portalSlug = sUser.app_metadata.portal_slug || null;

    // Validate portalId
    if (portalId && !validIds.includes(portalId)) {
      console.warn(`Invalid portal_id ${portalId} for ${sUser.email}. Attempting slug recovery...`);
      const matchedPortal = validPortals.find(p => p.slug === portalSlug);
      if (matchedPortal) {
        portalId = matchedPortal.id;
        console.log(`Recovered portal_id ${portalId} for ${sUser.email} via slug ${portalSlug}`);
        
        // Update Supabase with the correct ID
        await supabase.auth.admin.updateUserById(sUser.id, {
          app_metadata: { ...sUser.app_metadata, portal_id: portalId }
        });
      } else {
        console.warn(`Could not recover portal for ${sUser.email}. Setting to null.`);
        portalId = null;
      }
    }

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

    console.log(`Synced: ${sUser.email} [${role}] -> Portal: ${portalId || 'Global'}`);
  }

  console.log("Sync complete!");
  await db.end();
}

ultimateSync();
