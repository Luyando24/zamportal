import { RequestHandler } from "express";
import { query } from "../lib/db.js";

// List all dynamic modules
export const handleListModules: RequestHandler = async (req, res) => {
  try {
    const result = await query("SELECT * FROM system_modules WHERE is_active = true ORDER BY name ASC");
    res.json(result.rows);
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
  try {
    const moduleResult = await query("SELECT id FROM system_modules WHERE slug = $1", [slug]);
    if (moduleResult.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    
    const moduleId = moduleResult.rows[0].id;
    const result = await query(
      "SELECT * FROM module_entries WHERE module_id = $1 ORDER BY created_at DESC",
      [moduleId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list module data" });
  }
};

// Create entry in a module
export const handleCreateModuleData: RequestHandler = async (req, res) => {
  const { slug } = req.params;
  const { data } = req.body;
  try {
    const moduleResult = await query("SELECT id FROM system_modules WHERE slug = $1", [slug]);
    if (moduleResult.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    
    const moduleId = moduleResult.rows[0].id;
    const result = await query(
      "INSERT INTO module_entries (module_id, data) VALUES ($1, $2) RETURNING *",
      [moduleId, JSON.stringify(data)]
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
