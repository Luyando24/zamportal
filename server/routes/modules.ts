import { RequestHandler } from "express";
import { query } from "../lib/db.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

// List all dynamic modules
export const handleListModules: RequestHandler = async (req, res) => {
  const { portalId } = req.query;
  try {
    const modules = await query("SELECT * FROM system_modules WHERE is_active = true ORDER BY name ASC");
    
    if (portalId) {
      const portalSettings = await query("SELECT module_slug, is_enabled FROM portal_modules WHERE portal_id = $1", [portalId]);
      const settingsMap = portalSettings.rows.reduce((acc: any, row: any) => {
        acc[row.module_slug] = row.is_enabled;
        return acc;
      }, {});

      const result = modules.rows.map((m: any) => ({
        ...m,
        is_enabled: settingsMap[m.slug] !== undefined ? settingsMap[m.slug] : true
      }));
      return res.json(result);
    }
    
    res.json(modules.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list modules" });
  }
};

// Create a new dynamic module
export const handleCreateModule: RequestHandler = async (req, res) => {
  const { name, singular_entity, slug, description, icon, schema_definition } = req.body;
  try {
    const result = await query(
      `INSERT INTO system_modules (name, singular_entity, slug, description, icon, schema_definition)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, singular_entity || 'Record', slug, description, icon || 'package', JSON.stringify(schema_definition)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create module" });
  }
};

// Get data for a specific module
export const handleListModuleData: RequestHandler = async (req, res) => {
  const { slug } = req.params;
  const { portalId, userId } = req.query;
  try {
    const moduleResult = await query("SELECT id FROM system_modules WHERE slug = $1", [slug]);
    if (moduleResult.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    
    const moduleId = moduleResult.rows[0].id;
    let sql = "SELECT * FROM module_entries WHERE module_id = $1";
    const params: any[] = [moduleId];

    if (portalId) {
      sql += " AND portal_id = $" + (params.length + 1);
      params.push(portalId);
    }

    if (userId) {
      sql += " AND user_id = $" + (params.length + 1);
      params.push(userId);
    }

    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list module data" });
  }
};

// Get current user's data for a module
export const handleListMyModuleData: RequestHandler = async (req: any, res) => {
  const { slug } = req.params;
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const moduleResult = await query("SELECT id FROM system_modules WHERE slug = $1", [slug]);
    if (moduleResult.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    
    const moduleId = moduleResult.rows[0].id;
    const result = await query(
      "SELECT * FROM module_entries WHERE module_id = $1 AND user_id = $2 ORDER BY created_at DESC",
      [moduleId, userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list my module data" });
  }
};

// Create entry in a module
export const handleCreateModuleData: RequestHandler = async (req: any, res) => {
  const { slug } = req.params;
  const { data, portalId, userId } = req.body;
  // Use provided userId or fallback to authenticated user if available
  const finalUserId = userId || req.user?.id || null;
  
  try {
    const moduleResult = await query("SELECT id FROM system_modules WHERE slug = $1", [slug]);
    if (moduleResult.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    
    const moduleId = moduleResult.rows[0].id;

    // Special handling for HR Management: Create a real user account
    let createdUserId = finalUserId;
    if (slug === 'hr-management' && data.email && data.password) {
      console.log(`HR Module: Creating system account for ${data.email}`);
      try {
        // 1. Create in Supabase Auth
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: { 
            first_name: data.name?.split(' ')[0] || 'Employee', 
            last_name: data.name?.split(' ').slice(1).join(' ') || '',
            nrc: data.nrc || null,
            passport_number: data.passport_number || null
          },
          app_metadata: { 
            role: 'employee', 
            portal_id: portalId,
            nrc: data.nrc || null,
            passport_number: data.passport_number || null
          }
        });

        if (authError) {
          console.error("Supabase Auth Creation Error:", authError);
          // If user already exists, we might want to link them? 
          // For now, let's just proceed or throw
          if (authError.message.includes('already registered')) {
            // Try to find existing user
            const existingRes = await query("SELECT id FROM users WHERE email = $1", [data.email]);
            if (existingRes.rows.length > 0) {
              createdUserId = existingRes.rows[0].id;
            }
          } else {
            throw authError;
          }
        } else {
          createdUserId = userData.user.id;
          
          // 2. Sync to local users table
          await query(
            `INSERT INTO users (id, email, nrc, passport_number, password_hash, role, first_name, last_name, is_active, portal_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (email) DO UPDATE SET 
               id = EXCLUDED.id,
               nrc = EXCLUDED.nrc,
               passport_number = EXCLUDED.passport_number,
               role = EXCLUDED.role,
               portal_id = EXCLUDED.portal_id,
               updated_at = now()`,
            [
              createdUserId, 
              data.email, 
              data.nrc || null, 
              data.passport_number || null,
              'SUPABASE_AUTH', 
              'employee', 
              data.name?.split(' ')[0] || 'Employee', 
              data.name?.split(' ').slice(1).join(' ') || '', 
              true, 
              portalId
            ]
          );
        }
      } catch (err) {
        console.error("Failed to create employee account:", err);
        // We continue with entry creation but log the error
      }
    }

    const result = await query(
      "INSERT INTO module_entries (module_id, portal_id, user_id, data) VALUES ($1, $2, $3, $4) RETURNING *",
      [moduleId, portalId || null, createdUserId, JSON.stringify(data)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create module entry" });
  }
};

// Update entry in a module
export const handleUpdateModuleData: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;
  try {
    const result = await query(
      "UPDATE module_entries SET data = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [JSON.stringify(data), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Entry not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update module entry" });
  }
};

// Delete entry in a module
export const handleDeleteModuleData: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM module_entries WHERE id = $1", [id]);
    res.json({ message: "Entry deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete module entry" });
  }
};

// Toggle a module for a portal
export const handleTogglePortalModule: RequestHandler = async (req, res) => {
  const { portalId, moduleSlug, isEnabled } = req.body;
  try {
    await query(
      `INSERT INTO portal_modules (portal_id, module_slug, is_enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (portal_id, module_slug) DO UPDATE SET is_enabled = EXCLUDED.is_enabled`,
      [portalId, moduleSlug, isEnabled]
    );
    res.json({ success: true, is_enabled: isEnabled });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to toggle module" });
  }
};
