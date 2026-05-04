const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixApplications() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Checking for applications with missing form_id...");
    
    // 1. Get apps with missing form_id
    const result = await pool.query(`
      SELECT id, service_id, portal_id 
      FROM service_applications 
      WHERE form_id IS NULL
    `);
    
    console.log(`Found ${result.rows.length} applications with missing form_id.`);
    
    if (result.rows.length === 0) {
      console.log("Nothing to fix.");
      return;
    }

    for (const app of result.rows) {
      // Find the first form for this service/portal
      const formResult = await pool.query(`
        SELECT id FROM portal_service_forms 
        WHERE service_id = $1 AND portal_id = $2 
        ORDER BY created_at ASC LIMIT 1
      `, [app.service_id, app.portal_id]);
      
      if (formResult.rows.length > 0) {
        const formId = formResult.rows[0].id;
        await pool.query(`
          UPDATE service_applications SET form_id = $1 WHERE id = $2
        `, [formId, app.id]);
        console.log(`Fixed application ${app.id} -> Form ${formId}`);
      } else {
        console.log(`Warning: No form found for application ${app.id} (Service: ${app.service_id}, Portal: ${app.portal_id})`);
      }
    }
    
    console.log("Cleanup complete.");
  } catch (err) {
    console.error("Fix failed:", err);
  } finally {
    await pool.end();
  }
}

fixApplications();
