import { RequestHandler } from "express";
import { query, transaction } from "../lib/db.js";

// List all services for admin (with categories)
export const handleAdminListServices: RequestHandler = async (req, res) => {
  try {
    const { search, category_id, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT s.*, c.name as category_name 
      FROM services s
      LEFT JOIN service_categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (s.title ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
    }
    
    if (category_id) {
      params.push(category_id);
      sql += ` AND s.category_id = $${params.length}`;
    }
    
    sql += ` ORDER BY s.title ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Also get total count for pagination
    const countResult = await query("SELECT COUNT(*) FROM services");
    
    res.json({
      services: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch services" });
  }
};

// Create a new service
export const handleAdminCreateService: RequestHandler = async (req, res) => {
  const { title, slug, description, category_id, icon, is_popular } = req.body;
  try {
    const result = await query(
      "INSERT INTO services (title, slug, description, category_id, icon, is_popular) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, slug, description, category_id, icon || "FileText", is_popular || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create service" });
  }
};

// Update a service
export const handleAdminUpdateService: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { title, slug, description, category_id, icon, is_popular } = req.body;
  try {
    const result = await query(`
      UPDATE services 
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          description = COALESCE($3, description),
          category_id = COALESCE($4, category_id),
          icon = COALESCE($5, icon),
          is_popular = COALESCE($6, is_popular),
          updated_at = now()
      WHERE id = $7
      RETURNING *
    `, [title, slug, description, category_id, icon, is_popular, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update service" });
  }
};

// Delete a service
export const handleAdminDeleteService: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM services WHERE id = $1", [id]);
    res.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete service" });
  }
};

// Create a full service (metadata + forms) globally (National Catalog)
export const handleAdminCreateFullService: RequestHandler = async (req, res) => {
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
        "INSERT INTO services (title, slug, description, category_id, icon, is_popular) VALUES ($1, $2, $3, $4, 'file-text', false) RETURNING *",
        [title, slug, description, categoryId]
      );
      const service = serviceRes.rows[0];

      // 3. Insert all sub_services globally (portal_id = NULL)
      if (sub_services && sub_services.length > 0) {
        for (const sub of sub_services) {
          const form_slug = sub.form_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          await client.query(
            `INSERT INTO portal_service_forms (portal_id, service_id, form_name, form_slug, form_definition)
             VALUES (NULL, $1, $2, $3, $4)`,
            [service.id, sub.form_name, form_slug, JSON.stringify(sub.fields || [])]
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
