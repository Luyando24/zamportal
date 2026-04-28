import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  const email = 'admin@zamportal.gov.zm';
  const password = 'SuperSecurePassword2026!'; // User should change this
  const fullName = 'System Administrator';

  console.log(`Creating Super Admin: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role: 'super_admin' }
  });

  if (error) {
    console.error('Error creating super admin:', error.message);
  } else {
    console.log('Super Admin created successfully!');
    console.log('ID:', data.user.id);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nIMPORTANT: Please login and change your password immediately.');
  }
}

createSuperAdmin();
