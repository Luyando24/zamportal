import { RequestHandler } from "express";
import { query } from "../lib/db.js";

// Create a new category
export const handleAdminCreateCategory: RequestHandler = async (req, res) => {
  const { name, slug, description, icon } = req.body;
  try {
    const result = await query(
      "INSERT INTO service_categories (name, slug, description, icon) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, slug, description, icon || "Shield"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create category" });
  }
};

// Update a category
export const handleAdminUpdateCategory: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, icon } = req.body;
  try {
    const result = await query(`
      UPDATE service_categories 
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          description = COALESCE($3, description),
          icon = COALESCE($4, icon),
          updated_at = now()
      WHERE id = $5
      RETURNING *
    `, [name, slug, description, icon, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update category" });
  }
};

// Delete a category
export const handleAdminDeleteCategory: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    // Note: This will fail if services are still linked unless ON DELETE SET NULL is set in DB
    await query("DELETE FROM service_categories WHERE id = $1", [id]);
    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete category. Ensure no services are using this category." });
  }
};
