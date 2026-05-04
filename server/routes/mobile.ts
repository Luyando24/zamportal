import { RequestHandler } from "express";
import { query } from "../lib/db.js";
import { Category, Service, Application } from "@shared/api";
import { v4 as uuidv4 } from "uuid";

export const handleListCategories: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM service_categories ORDER BY name');
    const categories: Category[] = result.rows.map((row: any) => ({
      id: row.id,
      title: row.name,
      icon: row.icon,
      description: row.description,
      slug: row.slug,
    }));
    
    // Cache disabled for development/real-time updates
    res.setHeader('Cache-Control', 'no-store');
    res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleListPopularServices: RequestHandler = async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, c.name as category_name,
        COALESCE(
          (SELECT slug FROM portals WHERE id = s.portal_id),
          (SELECT p.slug FROM portals p 
           LEFT JOIN portal_services ps ON p.id = ps.portal_id 
           WHERE ps.service_id = s.id 
           LIMIT 1)
        ) as portal_slug
      FROM services s
      LEFT JOIN service_categories c ON s.category_id = c.id
      WHERE s.is_popular = TRUE 
      ORDER BY s.title
    `);
    const services = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      icon: row.icon,
      categoryId: row.category_id,
      category_name: row.category_name,
      description: row.description,
      slug: row.slug,
      portal_slug: row.portal_slug,
      isPopular: row.is_popular,
    }));
    
    // Cache disabled for development/real-time updates
    res.setHeader('Cache-Control', 'no-store');
    res.json(services);
  } catch (error) {
    console.error('List popular services error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSearchServices: RequestHandler = async (req, res) => {
  try {
    const { query: searchTerm } = req.query;
    
    let sql = `
      SELECT s.*, c.name as category_name,
        COALESCE(
          (SELECT slug FROM portals WHERE id = s.portal_id),
          (SELECT p.slug FROM portals p 
           LEFT JOIN portal_services ps ON p.id = ps.portal_id 
           WHERE ps.service_id = s.id 
           LIMIT 1)
        ) as portal_slug
      FROM services s
      LEFT JOIN service_categories c ON s.category_id = c.id
    `;
    const params = [];
    
    if (searchTerm) {
      sql += ' WHERE s.title ILIKE $1 OR s.description ILIKE $1';
      params.push(`%${searchTerm}%`);
    }
    
    sql += ' ORDER BY s.title';
    const result = await query(sql, params);
    
    const services = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      icon: row.icon,
      categoryId: row.category_id,
      category_name: row.category_name,
      description: row.description,
      slug: row.slug,
      portal_slug: row.portal_slug,
      isPopular: row.is_popular,
    }));
    res.json(services);
  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleListApplications: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required (MOBILE_ROUTE)" });
    }
    
    const result = await query(`
      SELECT sa.*, f.form_name
      FROM service_applications sa
      LEFT JOIN portal_service_forms f ON sa.form_id = f.id
      WHERE sa.user_id = $1 
      ORDER BY sa.created_at DESC
    `, [userId]);
    
    const applications: Application[] = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      serviceId: row.service_id,
      formId: row.form_id,
      formName: row.form_name,
      status: row.status,
      formData: row.form_data,
      trackingNumber: row.tracking_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    res.json(applications);
  } catch (error) {
    console.error('List applications error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetUserProfile: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required (MOBILE_ROUTE)" });
    }
    
    const result = await query(
      'SELECT id, email, first_name, last_name, phone, nrc, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const dbUser = result.rows[0];
    
    const profile = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      nrc: dbUser.nrc,
      role: dbUser.role,
    };
    res.json(profile);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
