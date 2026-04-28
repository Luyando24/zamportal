import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { query } from "../lib/db";

// List all users
export const handleListUsers: RequestHandler = async (req, res) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
};

// Create a new user (Admin only)
export const handleCreateUser: RequestHandler = async (req, res) => {
  const { email, password, full_name, role, portal_id, portal_slug } = req.body;
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
      app_metadata: { 
        role: role || 'user',
        portal_id: portal_id || null,
        portal_slug: portal_slug || null
      }
    });
    
    if (error) throw error;

    // Sync to local DB for joins/routing
    if (user) {
      const nameParts = (full_name || "").split(" ");
      const firstName = nameParts[0] || "Admin";
      const lastName = nameParts.slice(1).join(" ") || "User";

      await query(`
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
      `, [user.id, email, role || 'user', portal_id || null, true, 'SUPABASE_AUTH', firstName, lastName]);
    }

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create user" });
  }
};

// Delete a user
export const handleDeleteUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
};
