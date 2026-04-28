import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const { Client } = pg;

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

async function seedServices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/zamportal"
  });

  try {
    await client.connect();
    console.log("Connected to database...");

    // 1. Categories
    const categories = [
      { name: 'Identity & Registration', slug: 'identity', icon: 'Shield', description: 'National identity and civil registration services.' },
      { name: 'Business & Trade', slug: 'business', icon: 'Briefcase', description: 'Commercial registration and licensing services.' },
      { name: 'Transport & Driving', slug: 'transport', icon: 'Car', description: 'Road safety, licensing, and vehicle services.' },
      { name: 'Health & Wellness', slug: 'health', icon: 'HeartPulse', description: 'Medical certification and health permits.' },
      { name: 'Education & Training', slug: 'education', icon: 'GraduationCap', description: 'Academic certification and student services.' }
    ];

    console.log("Seeding categories...");
    const categoryMap = new Map();
    for (const cat of categories) {
      const res = await client.query(
        "INSERT INTO service_categories (name, slug, icon, description) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id",
        [cat.name, cat.slug, cat.icon, cat.description]
      );
      categoryMap.set(cat.slug, res.rows[0].id);
    }

    // 2. Services
    const services = [
      { title: 'NRC Renewal', slug: 'nrc-renewal', category: 'identity', description: 'Apply for a replacement or renewal of your National Registration Card.' },
      { title: 'Passport Application', slug: 'passport-app', category: 'identity', description: 'Digital application for Zambian e-Passport.' },
      { title: 'Business Name Registration', slug: 'business-name', category: 'business', description: 'Register a new business name with PACRA.' },
      { title: 'PACRA Annual Returns', slug: 'pacra-returns', category: 'business', description: 'File annual returns for registered companies.' },
      { title: 'Driving License Renewal', slug: 'dl-renewal', category: 'transport', description: 'Renew your road traffic driving permit.' },
      { title: 'Vehicle Fitness', slug: 'vehicle-fitness', category: 'transport', description: 'Book and pay for vehicle inspection.' },
      { title: 'Medical Certificate', slug: 'medical-cert', category: 'health', description: 'Official government medical fitness certification.' },
      { title: 'Professional Certification', slug: 'prof-cert', category: 'education', description: 'Verify and certify academic qualifications.' }
    ];

    console.log("Seeding services...");
    for (const s of services) {
      await client.query(
        "INSERT INTO services (title, slug, description, category_id, is_popular) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING",
        [s.title, s.slug, s.description, categoryMap.get(s.category), true]
      );
    }

    console.log("Seed completed successfully!");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await client.end();
  }
}

seedServices();
