const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  const email = 'lokesh@admin.com';
  const rawPassword = 'lokesh*123';
  const name = 'Lokesh Admin';
  const role = 'admin'; // Changed from superadmin because of check constraint error

  try {
    // 1. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 2. Check if user exists
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    
    if (existingUser) {
      console.log('User already exists, updating password and role...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword, role: role, name: name })
        .eq('email', email);
      
      if (updateError) throw updateError;
      console.log('Super Admin updated successfully!');
    } else {
      console.log('Creating new Super Admin...');
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          name,
          email,
          password: hashedPassword,
          role: role
        }]);
      
      if (insertError) throw insertError;
      console.log('Super Admin created successfully!');
    }
  } catch (error) {
    console.error('Operation failed:', error.message);
  }
}

createSuperAdmin();
