const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('Connecting to:', supabaseUrl);
  const { data, error } = await supabase.from('users').select('id, email, role');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users in database:');
    if (data && data.length > 0) {
      console.table(data);
    } else {
      console.log('No users found in the database.');
    }
  }
}

checkUsers();
