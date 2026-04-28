import { RequestHandler } from "express";
import { query, transaction } from "../lib/db.js";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

// List all forms/sub-services for a service in a portal
export const handleListServiceForms: RequestHandler = async (req, res) => {
  const { portalId, serviceId } = req.params;
  try {
    const result = await query(
      "SELECT id, portal_id, service_id, form_name, form_slug, form_definition, is_active, created_at, updated_at FROM portal_service_forms WHERE portal_id = $1 AND service_id = $2 ORDER BY created_at ASC",
      [portalId, serviceId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch forms" });
  }
};

// Get a specific form definition by ID
export const handleGetFormById: RequestHandler = async (req, res) => {
  const { formId } = req.params;
  try {
    const result = await query(
      "SELECT * FROM portal_service_forms WHERE id = $1",
      [formId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Form not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch form definition" });
  }
};

// Create or update form definition
export const handleSaveFormDefinition: RequestHandler = async (req, res) => {
  const { id, portal_id, service_id, form_name, form_definition } = req.body;
  const form_slug = form_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  try {
    let result;
    if (id) {
      // Update existing form
      result = await query(
        `UPDATE portal_service_forms 
         SET form_name = $1, form_slug = $2, form_definition = $3, updated_at = now()
         WHERE id = $4
         RETURNING *`,
        [form_name, form_slug, JSON.stringify(form_definition), id]
      );
    } else {
      // Create new form
      result = await query(
        `INSERT INTO portal_service_forms (portal_id, service_id, form_name, form_slug, form_definition)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [portal_id, service_id, form_name, form_slug, JSON.stringify(form_definition)]
      );
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: `A sub-service named "${form_name}" already exists for this service. Please use a unique name.` });
    }
    res.status(500).json({ error: error.message || "Failed to save form definition" });
  }
};

// Submit an application
export const handleSubmitApplication: RequestHandler = async (req, res) => {
  const { user_id, service_id, portal_id, form_data, attachments } = req.body;
  const tracking_number = `ZP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  try {
    // 0. Ensure user exists in local DB (JIT sync)
    const userCheck = await query("SELECT id FROM users WHERE id = $1", [user_id]);
    if (userCheck.rows.length === 0) {
      console.log(`Forms.Submit: User ${user_id} not found in local DB. Syncing from Supabase...`);
      const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id);
      if (user && !authError) {
        const { first_name, last_name, nrc } = user.user_metadata || {};
        const { role, portal_id: user_portal_id } = user.app_metadata || {};
        await query(
          `INSERT INTO users (id, email, nrc, password_hash, role, first_name, last_name, is_active, portal_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (email) DO UPDATE SET 
             id = EXCLUDED.id,
             nrc = EXCLUDED.nrc,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             role = EXCLUDED.role,
             portal_id = EXCLUDED.portal_id,
             updated_at = now()`,
          [user.id, user.email, nrc || '', 'SUPABASE_AUTH', role || 'user', first_name || 'User', last_name || 'New', true, user_portal_id || null]
        );
      }
    }

    const application = await transaction(async (client) => {
      // 1. Create the application
      const appResult = await client.query(
        `INSERT INTO service_applications (user_id, service_id, portal_id, form_data, tracking_number)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_id, service_id, portal_id, JSON.stringify(form_data), tracking_number]
      );
      
      const app = appResult.rows[0];
      
      // 2. Add attachments if any
      if (attachments && Array.isArray(attachments)) {
        for (const attachment of attachments) {
          await client.query(
            `INSERT INTO application_attachments (application_id, file_name, file_url, file_type, file_size)
             VALUES ($1, $2, $3, $4, $5)`,
            [app.id, attachment.file_name, attachment.file_url, attachment.file_type, attachment.file_size]
          );
        }
      }
      
      return app;
    });
    
    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to submit application" });
  }
};

// List applications for a citizen
export const handleGetApplications: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized (FORMS_ROUTE)" });

  try {
    const result = await query(
      `SELECT sa.*, s.title as service_title, f.form_name
       FROM service_applications sa
       JOIN services s ON sa.service_id = s.id
       LEFT JOIN portal_service_forms f ON sa.service_id = f.service_id AND sa.portal_id = f.portal_id
       WHERE sa.user_id = $1
       ORDER BY sa.created_at DESC`,
      [user.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch applications" });
  }
};

// List applications for a portal (Institutional Admin)
export const handleListPortalApplications: RequestHandler = async (req, res) => {
  const { portalId } = req.params;
  try {
    const result = await query(
      `SELECT a.*, u.first_name, u.last_name, u.email, s.title as service_title, f.form_name
       FROM service_applications a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       LEFT JOIN portal_service_forms f ON a.service_id = f.service_id AND a.portal_id = f.portal_id
       WHERE a.portal_id = $1
       ORDER BY a.created_at DESC`,
      [portalId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch applications" });
  }
};

// Get single application details
export const handleGetApplicationById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT a.*, u.first_name, u.last_name, u.email, s.title as service_title, f.form_name
       FROM service_applications a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       LEFT JOIN portal_service_forms f ON a.service_id = f.service_id AND a.portal_id = f.portal_id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const application = result.rows[0];
    const user = (req as any).user;
    
    // Extract metadata from Supabase user object
    const userRole = user.app_metadata?.role || 'user';
    const userPortalId = user.app_metadata?.portal_id;

    // Security check:
    // 1. Super Admin (role === 'admin')
    // 2. Institutional Admin (has portal_id and it matches the application's portal)
    // 3. Owner (user.id matches application's user_id)
    const isSuperAdmin = userRole === 'admin' && !userPortalId;
    const isInstitutionalAdmin = userPortalId && userPortalId === application.portal_id;
    const isOwner = user.id === application.user_id;

    if (!isSuperAdmin && !isInstitutionalAdmin && !isOwner) {
      return res.status(403).json({ error: "Unauthorized access to application data" });
    }

    res.json(application);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch application" });
  }
};

// Update application status
export const handleUpdateApplicationStatus: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const user = (req as any).user;

  try {
    const applicationRes = await query("SELECT portal_id, user_id FROM service_applications WHERE id = $1", [id]);
    if (applicationRes.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }
    const application = applicationRes.rows[0];

    // Extract metadata from Supabase user object
    const userRole = user.app_metadata?.role || 'user';
    const userPortalId = user.app_metadata?.portal_id;

    // Security check: Only Admins can update status
    const isSuperAdmin = userRole === 'admin' && !userPortalId;
    const isInstitutionalAdmin = userPortalId && userPortalId === application.portal_id;

    if (!isSuperAdmin && !isInstitutionalAdmin) {
      return res.status(403).json({ error: "Access denied: Only department officers can update status" });
    }

    const updatedApp = await transaction(async (client) => {
      // 1. Update the application status
      const result = await client.query(
        `UPDATE service_applications 
         SET status = $1, notes = COALESCE($2, notes), updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [status, notes, id]
      );
      
      if (result.rows.length === 0) {
        throw new Error("Application not found");
      }

      const app = result.rows[0];

      // 2. Record history
      await client.query(
        `INSERT INTO application_status_history (application_id, status, notes, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [id, status, notes, user?.id || null]
      );

      return app;
    });
    
    res.json(updatedApp);
  } catch (error: any) {
    if (error.message === "Application not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || "Failed to update status" });
  }
};

// Get application status history
export const handleGetApplicationHistory: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    // Security check: must have access to the application to see history
    const applicationRes = await query("SELECT portal_id, user_id FROM service_applications WHERE id = $1", [id]);
    if (applicationRes.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }
    const application = applicationRes.rows[0];

    const userRole = user.app_metadata?.role || 'user';
    const userPortalId = user.app_metadata?.portal_id;

    const isSuperAdmin = userRole === 'admin' && !userPortalId;
    const isInstitutionalAdmin = userPortalId && userPortalId === application.portal_id;
    const isOwner = user.id === application.user_id;

    if (!isSuperAdmin && !isInstitutionalAdmin && !isOwner) {
      return res.status(403).json({ error: "Unauthorized access to status history" });
    }

    const result = await query(
      `SELECT h.*, u.first_name as changed_by_first_name, u.last_name as changed_by_last_name
       FROM application_status_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.application_id = $1
       ORDER BY h.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch status history" });
  }
};

// Get specific form by slug for citizen portal
export const handleGetFormBySlug: RequestHandler = async (req, res) => {
  try {
    const { portalId, formSlug } = req.params;
    const result = await query(
      `SELECT f.*, s.title as service_title, s.description as service_description, s.id as service_id, s.slug as service_slug
       FROM portal_service_forms f
       JOIN services s ON f.service_id = s.id
       WHERE f.portal_id = $1 AND LOWER(f.form_slug) = LOWER($2)`,
      [portalId, formSlug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch form" });
  }
};
// Delete a form definition
export const handleDeleteFormDefinition: RequestHandler = async (req, res) => {
  const { formId } = req.params;
  try {
    await query("DELETE FROM portal_service_forms WHERE id = $1", [formId]);
    res.json({ message: "Form deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete form" });
  }
};
