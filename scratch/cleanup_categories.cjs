const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanupCategories() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/zamportal"
  });

  try {
    await client.connect();
    
    // List of slugs to keep (the ones from seed_services.js)
    const keepSlugs = ['identity', 'business', 'transport', 'health', 'education'];
    
    // Find all categories NOT in keepSlugs
    const res = await client.query('SELECT id, name, slug FROM service_categories WHERE slug NOT IN ($1, $2, $3, $4, $5)', keepSlugs);
    
    console.log("Found duplicate/extra categories:", res.rows);
    
    for (const row of res.rows) {
      console.log(`Deleting category: ${row.name} (${row.slug})`);
      // Update services to point to the correct category if needed?
      // For now, let's just delete. If services are linked, it might fail.
      // We should probably re-assign services first.
      
      let targetSlug = '';
      if (row.slug.startsWith('health')) targetSlug = 'health';
      else if (row.slug.startsWith('identity')) targetSlug = 'identity';
      else if (row.slug.startsWith('transport')) targetSlug = 'transport';
      else if (row.slug.startsWith('business')) targetSlug = 'business';
      
      if (targetSlug) {
        const targetRes = await client.query('SELECT id FROM service_categories WHERE slug = $1', [targetSlug]);
        if (targetRes.rows.length > 0) {
          const targetId = targetRes.rows[0].id;
          await client.query('UPDATE services SET category_id = $1 WHERE category_id = $2', [targetId, row.id]);
          console.log(`Re-assigned services from ${row.slug} to ${targetSlug}`);
        }
      }
      
      await client.query('DELETE FROM service_categories WHERE id = $1', [row.id]);
    }
    
    console.log("Cleanup completed.");
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    await client.end();
  }
}

cleanupCategories();
