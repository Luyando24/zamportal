const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteAdmins() {
  const emailsToPromote = ['admin@zp.gov.zm', 'admin@moh.gov.zm'];
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Failed to list users:", error);
    return;
  }

  for (const email of emailsToPromote) {
    const user = users.find(u => u.email === email);
    if (user) {
      console.log(`Promoting ${email} to admin...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { role: 'admin' }
      });
      
      if (updateError) {
        console.error(`Failed to promote ${email}:`, updateError.message);
      } else {
        console.log(`Successfully promoted ${email}`);
      }
    } else {
      console.log(`User ${email} not found in Supabase Auth.`);
    }
  }
}

promoteAdmins();
