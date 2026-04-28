const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/zamportal"
  });

  try {
    await client.connect();
    
    const email = 'admin@zamportal.gov.zm';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 12);
    
    console.log("Seeding admin in Supabase...");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { first_name: 'System', last_name: 'Admin' }
    });

    if (error && (error.message.includes('already registered') || error.code === 'email_exists')) {
      console.log("Admin already in Supabase, updating metadata...");
      // Get user ID
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);
      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          app_metadata: { role: 'admin' },
          password: password // Reset password to ensure we can login
        });
      }
    } else if (error) {
      throw error;
    }

    const userId = data.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email).id;

    // Sync to local DB
    await client.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET role = 'admin', id = EXCLUDED.id`,
      [userId, email, 'SUPABASE_AUTH', 'admin', 'System', 'Admin', true]
    );
    
    console.log("Admin account seeded/updated successfully in both Supabase and Local DB.");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await client.end();
  }
}

seedAdmin();
