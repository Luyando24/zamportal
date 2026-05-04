import { RequestHandler } from "express";
import { query } from "../lib/db.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

// List users for a specific portal
export const handleListPortalUsers: RequestHandler = async (req, res) => {
  const { portalId } = req.params;
  try {
    const result = await query(
      "SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE portal_id = $1 ORDER BY created_at DESC",
      [portalId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch portal users" });
  }
};

// Update portal user role
export const handleUpdatePortalUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { role, is_active } = req.body;
  const user = (req as any).user;

  try {
    // 1. Update in local DB
    await query(
      "UPDATE users SET role = COALESCE($1, role), is_active = COALESCE($2, is_active), updated_at = now() WHERE id = $3",
      [role, is_active, id]
    );

    // 2. Sync to Supabase Auth
    if (role) {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        app_metadata: { role }
      });
    }

    res.json({ message: "User updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update user" });
  }
};

// Create a new user for a portal
export const handleCreatePortalUser: RequestHandler = async (req, res) => {
  const { portalId } = req.params;
  const { email, password, first_name, last_name, role } = req.body;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, full_name: `${first_name} ${last_name}` },
      app_metadata: { 
        role: role || 'employee',
        portal_id: portalId
      }
    });

    if (error) throw error;

    if (user) {
      await query(`
        INSERT INTO users (id, email, role, portal_id, is_active, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [user.id, email, role || 'employee', portalId, true, 'SUPABASE_AUTH', first_name, last_name]);
    }

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create portal user" });
  }
};
