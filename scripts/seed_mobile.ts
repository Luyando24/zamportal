import 'dotenv/config';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    // Clear existing data (optional, but good for fresh seed)
    // await client.query('TRUNCATE service_applications, services, service_categories, users CASCADE');

    // 1. Seed Categories
    const categories = [
      { name: 'Citizens', icon: 'people', description: 'Services for individual citizens of Zambia', slug: 'citizens' },
      { name: 'Businesses', icon: 'business', description: 'Services for business entities and enterprises', slug: 'businesses' },
      { name: 'Organizations', icon: 'briefcase', description: 'Services for NGOs and other organizations', slug: 'organizations' },
      { name: 'Health & Wellness', icon: 'heart', description: 'Access to healthcare and wellness services', slug: 'health-wellness' },
      { name: 'Education', icon: 'school', description: 'Services related to education and learning', slug: 'education' },
      { name: 'Transport & Driving', icon: 'car', description: 'Services for drivers and vehicle owners', slug: 'transport-driving' },
      { name: 'Identity & Verification', icon: 'fingerprint', description: 'Services for identity and verification', slug: 'identity-verification' },
      { name: 'Lands & Housing', icon: 'home', description: 'Services for property and housing', slug: 'lands-housing' },
    ];

    const categoryMap = new Map();

    for (const cat of categories) {
      const id = uuidv4();
      await client.query(
        'INSERT INTO service_categories (id, name, icon, description, slug) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [id, cat.name, cat.icon, cat.description, cat.slug]
      );
      categoryMap.set(cat.slug, id);
    }

    // 2. Seed Services
    const services = [
      { title: 'National Registration Card (NRC)', icon: 'fingerprint', categorySlug: 'identity-verification', description: 'Apply for a new NRC, replace a lost one, or make amendments.', slug: 'nrc', is_popular: true },
      { title: 'Business Registration', icon: 'business', categorySlug: 'businesses', description: 'Register your new company, file annual returns, and manage details.', slug: 'business-reg', is_popular: true },
      { title: 'Driver\'s License', icon: 'car', categorySlug: 'transport-driving', description: 'Apply for a provisional license, book a test, or renew.', slug: 'drivers-license', is_popular: true },
      { title: 'Workers', icon: 'construct', categorySlug: 'citizens', description: 'Employment and labor services', slug: 'workers', is_popular: true },
      { title: 'Immigrants', icon: 'globe', categorySlug: 'citizens', description: 'Immigration and visa services', slug: 'immigrants', is_popular: true },
      { title: 'Families', icon: 'home', categorySlug: 'citizens', description: 'Family and social welfare services', slug: 'families', is_popular: true },
      { title: 'Retirees', icon: 'medical', categorySlug: 'citizens', description: 'Pension and retirement services', slug: 'retirees', is_popular: true },
      { title: 'Travelers', icon: 'airplane', categorySlug: 'citizens', description: 'Travel and tourism services', slug: 'travelers', is_popular: true },
      { title: 'Tax payers', icon: 'cash', categorySlug: 'businesses', description: 'Tax payment and compliance services', slug: 'tax-payers', is_popular: true },
      { title: 'Students', icon: 'school', categorySlug: 'education', description: 'Education and student services', slug: 'students', is_popular: true },
    ];

    for (const svc of services) {
      const categoryId = categoryMap.get(svc.categorySlug);
      await client.query(
        'INSERT INTO services (id, category_id, title, icon, description, slug, is_popular) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
        [uuidv4(), categoryId, svc.title, svc.icon, svc.description, svc.slug, svc.is_popular]
      );
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
