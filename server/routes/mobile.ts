import { RequestHandler } from "express";
import { query } from "../lib/db";
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
    res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleListPopularServices: RequestHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM services WHERE is_popular = TRUE ORDER BY title');
    const services: Service[] = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      icon: row.icon,
      categoryId: row.category_id,
      description: row.description,
      slug: row.slug,
      isPopular: row.is_popular,
    }));
    res.json(services);
  } catch (error) {
    console.error('List popular services error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSearchServices: RequestHandler = async (req, res) => {
  try {
    const { query: searchTerm } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term required" });
    }
    
    const result = await query(
      'SELECT * FROM services WHERE title ILIKE $1 OR description ILIKE $1 ORDER BY title',
      [`%${searchTerm}%`]
    );
    
    const services: Service[] = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      icon: row.icon,
      categoryId: row.category_id,
      description: row.description,
      slug: row.slug,
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
    const userId = req.session?.userId; // Assuming session middleware
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const result = await query(
      'SELECT * FROM service_applications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const applications: Application[] = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      serviceId: row.service_id,
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
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const result = await query(
      'SELECT id, email, first_name, last_name, phone, nrc, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      nrc: user.nrc,
      role: user.role,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
