
const { query } = require('./server/lib/db.js');

async function testQuery() {
  const portalSlug = 'finance'; // Example slug
  const portalResult = await query("SELECT id, name FROM portals WHERE slug = $1", [portalSlug]);
  
  if (portalResult.rows.length === 0) {
    console.log("Portal not found");
    return;
  }
  
  const portalId = portalResult.rows[0].id;
  console.log(`Checking services for portal: ${portalResult.rows[0].name} (${portalId})`);
  
  const servicesResult = await query(`
    SELECT DISTINCT ON (s.id) s.id, s.title, s.portal_id as service_owner_portal_id,
      (SELECT f.portal_id FROM portal_service_forms f WHERE f.portal_id = $1 AND f.service_id = s.id LIMIT 1) as form_portal_id,
      (SELECT ps.portal_id FROM portal_services ps WHERE ps.portal_id = $1 AND ps.service_id = s.id LIMIT 1) as link_portal_id
    FROM services s
    LEFT JOIN portal_services ps ON s.id = ps.service_id
    LEFT JOIN service_categories c ON s.category_id = c.id
    WHERE (ps.portal_id = $1 OR EXISTS (SELECT 1 FROM portal_service_forms f WHERE f.portal_id = $1 AND f.service_id = s.id))
  `, [portalId]);
  
  console.log(`Found ${servicesResult.rows.length} services.`);
  servicesResult.rows.forEach(s => {
    console.log(`- ${s.title} (Owner: ${s.service_owner_portal_id}, Form: ${s.form_portal_id}, Link: ${s.link_portal_id})`);
  });
}

testQuery().catch(console.error);
