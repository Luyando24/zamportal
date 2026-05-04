import { RequestHandler } from "express";
import { query, transaction } from "../lib/db.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

// List all portals
export const handleListPortals: RequestHandler = async (req, res) => {
  try {
    const result = await query("SELECT * FROM portals WHERE is_active = TRUE ORDER BY name ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portals" });
  }
};

// Get specific portal configuration by slug
export const handleGetPortalConfig: RequestHandler = async (req, res) => {
  const { slug } = req.params;
  try {
    const portalResult = await query("SELECT * FROM portals WHERE LOWER(slug) = LOWER($1) AND is_active = TRUE", [slug]);
    
    if (portalResult.rows.length === 0) {
      return res.status(404).json({ error: "Portal not found" });
    }

    const portal = portalResult.rows[0];

    // Fetch services linked to this portal with their associated forms
    // IMPORTANT: Only list services that either belong to this portal (s.portal_id = $1)
    // or are global services (s.portal_id IS NULL) that have been explicitly added to this portal.
    const servicesResult = await query(`
      SELECT DISTINCT ON (s.id) s.*, c.name as category_name, c.slug as category_slug,
        (SELECT json_agg(json_build_object(
          'id', f.id,
          'form_name', f.form_name,
          'form_slug', f.form_slug,
          'updated_at', f.updated_at
        )) FROM portal_service_forms f WHERE f.portal_id = $1 AND f.service_id = s.id) as forms
      FROM services s
      LEFT JOIN portal_services ps ON s.id = ps.service_id
      LEFT JOIN service_categories c ON s.category_id = c.id
      WHERE (s.portal_id = $1 OR ps.portal_id = $1 OR EXISTS (SELECT 1 FROM portal_service_forms f WHERE f.portal_id = $1 AND f.service_id = s.id))
      AND (s.portal_id IS NULL OR s.portal_id = $1)
    `, [portal.id]);

    res.json({
      ...portal,
      services: servicesResult.rows.map(s => ({
        ...s,
        forms: s.forms || []
      }))
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portal configuration" });
  }
};

// Create a new portal
export const handleCreatePortal: RequestHandler = async (req, res) => {
  const { name, slug, description, summary, logo_url, theme_config, service_ids, is_website_enabled } = req.body;
  
  try {
    const result = await transaction(async (client) => {
      const portalResult = await client.query(
        "INSERT INTO portals (name, slug, description, summary, logo_url, theme_config, is_website_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [name, slug, description, summary, logo_url, theme_config || {}, is_website_enabled !== undefined ? is_website_enabled : true]
      );
      
      const portal = portalResult.rows[0];

      if (service_ids && service_ids.length > 0) {
        for (const service_id of service_ids) {
          await client.query(
            "INSERT INTO portal_services (portal_id, service_id) VALUES ($1, $2)",
            [portal.id, service_id]
          );
        }
      }

      return portal;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create portal" });
  }
};

// Update portal configuration
export const handleUpdatePortal: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, summary, logo_url, theme_config, service_ids, is_active, is_website_enabled } = req.body;

  try {
    const result = await transaction(async (client) => {
      const portalResult = await client.query(`
        UPDATE portals 
        SET name = COALESCE($1, name),
            slug = COALESCE($2, slug),
            description = COALESCE($3, description),
            summary = COALESCE($4, summary),
            logo_url = COALESCE($5, logo_url),
            theme_config = COALESCE($6, theme_config),
            is_active = COALESCE($7, is_active),
            is_website_enabled = COALESCE($8, is_website_enabled),
            updated_at = now()
        WHERE id = $9
        RETURNING *
      `, [name, slug, description, summary, logo_url, theme_config, is_active, is_website_enabled, id]);

      if (portalResult.rows.length === 0) {
        throw new Error("Portal not found");
      }

      const portal = portalResult.rows[0];

      if (service_ids !== undefined) {
        // Clear existing services and re-add
        await client.query("DELETE FROM portal_services WHERE portal_id = $1", [id]);
        if (service_ids.length > 0) {
          for (const service_id of service_ids) {
            await client.query(
              "INSERT INTO portal_services (portal_id, service_id) VALUES ($1, $2)",
              [portal.id, service_id]
            );
          }
        }
      }

      return portal;
    });

    res.json(result);
  } catch (error: any) {
    res.status(error.message === "Portal not found" ? 404 : 500).json({ error: error.message });
  }
};

// Delete a portal and all its data (including Supabase users)
export const handleDeletePortal: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await transaction(async (client) => {
      // 1. Find all users assigned to this portal to delete them from Supabase
      const usersRes = await client.query("SELECT id FROM users WHERE portal_id = $1", [id]);
      const userIds = usersRes.rows.map(u => u.id);

      console.log(`Deleting portal ${id} and its ${userIds.length} associated users from Supabase...`);

      // 2. Delete from Supabase Auth
      for (const userId of userIds) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
          console.warn(`Failed to delete user ${userId} from Supabase:`, error.message);
          // We continue anyway to ensure the portal is deleted locally
        }
      }

      // 3. Delete the portal (cascades to portal_services, portal_service_forms, service_applications, and local users)
      await client.query("DELETE FROM portals WHERE id = $1", [id]);
    });

    res.json({ message: "Portal and all associated data deleted successfully" });
  } catch (error: any) {
    console.error("Portal deletion failed:", error);
    res.status(500).json({ error: error.message || "Failed to delete portal" });
  }
};

// Add a single service to a portal
export const handleAddPortalService: RequestHandler = async (req, res) => {
  const { portalId } = req.params;
  const { serviceId } = req.body;

  try {
    await query(
      "INSERT INTO portal_services (portal_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [portalId, serviceId]
    );
    res.status(201).json({ message: "Service added to portal" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add service to portal" });
  }
};

// List global services NOT yet in this portal
export const handleListAvailableServices: RequestHandler = async (req, res) => {
  const { portalId } = req.params;
  try {
    const result = await query(`
      SELECT s.*, c.name as category_name
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
      WHERE s.id NOT IN (SELECT service_id FROM portal_services WHERE portal_id = $1)
      AND (s.portal_id IS NULL OR s.portal_id = $1)
      ORDER BY s.title ASC
    `, [portalId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available services" });
  }
};

// Remove a service from a portal
export const handleRemovePortalService: RequestHandler = async (req, res) => {
  const { portalId, serviceId } = req.params;
  try {
    await query("DELETE FROM portal_services WHERE portal_id = $1 AND service_id = $2", [portalId, serviceId]);
    await query("DELETE FROM portal_service_forms WHERE portal_id = $1 AND service_id = $2", [portalId, serviceId]);
    res.json({ message: "Service removed from portal" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove service from portal" });
  }
};

// Create a full service (metadata + forms) and link it to the portal
export const handleCreateFullService: RequestHandler = async (req, res) => {
  const { portalId } = req.params;
  const { title, description, category_slug, sub_services } = req.body;

  try {
    const result = await transaction(async (client) => {
      // 1. Get the category ID
      const catRes = await client.query("SELECT id FROM service_categories WHERE slug = $1", [category_slug]);
      let categoryId = catRes.rows[0]?.id;
      if (!categoryId) {
        // Fallback to first category if not found
        const fallback = await client.query("SELECT id FROM service_categories LIMIT 1");
        categoryId = fallback.rows[0]?.id;
      }

      // 2. Insert into services table
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const serviceRes = await client.query(
        "INSERT INTO services (title, slug, description, category_id, icon, is_popular, portal_id) VALUES ($1, $2, $3, $4, 'file-text', false, $5) RETURNING *",
        [title, slug, description, categoryId, portalId]
      );
      const service = serviceRes.rows[0];

      // 3. Link to portal
      await client.query(
        "INSERT INTO portal_services (portal_id, service_id) VALUES ($1, $2)",
        [portalId, service.id]
      );

      // 4. Insert all sub_services
      if (sub_services && sub_services.length > 0) {
        for (const sub of sub_services) {
          const form_slug = sub.form_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          await client.query(
            `INSERT INTO portal_service_forms (portal_id, service_id, form_name, form_slug, form_definition)
             VALUES ($1, $2, $3, $4, $5)`,
            [portalId, service.id, sub.form_name, form_slug, JSON.stringify(sub.fields || [])]
          );
        }
      }

      return service;
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Failed to create full service:", error);
    res.status(500).json({ error: error.message || "Failed to create service package" });
  }
};
