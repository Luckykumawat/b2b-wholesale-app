const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const EMAIL = 'lokesh@admin.com';
const PASSWORD = 'lokesh*123';
const NAME = 'Lokesh Admin';
const ROLE = 'superadmin';

async function createSuperAdmin() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(PASSWORD, salt);

  const baseRow = {
    name: NAME,
    email: EMAIL,
    password: hashedPassword,
    role: ROLE,
    custom_pricing_tier: 1,
  };

  const { data: existing, error: findErr } = await supabase.from('users').select('id').eq('email', EMAIL).maybeSingle();
  if (findErr) {
    console.error('Lookup failed:', findErr);
    process.exit(1);
  }

  if (existing) {
    console.log('User exists; updating password and role to superadmin...');
    const { data, error } = await supabase
      .from('users')
      .update({
        name: NAME,
        password: hashedPassword,
        role: ROLE,
        custom_pricing_tier: 1,
      })
      .eq('email', EMAIL)
      .select('id,email,role')
      .maybeSingle();

    if (error) {
      console.error('Update failed:', JSON.stringify(error, null, 2));
      console.error(
        'If role check rejects superadmin, run SQL to allow it, e.g.:\n',
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;\n",
        "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('superadmin','admin','buyer'));"
      );
      process.exit(1);
    }
    console.log('Updated:', data);
    return;
  }

  console.log('Creating superadmin user...');
  const { data, error } = await supabase.from('users').insert([baseRow]).select('id,email,role').single();

  if (error) {
    console.error('Insert failed:', JSON.stringify(error, null, 2));
    console.error(
      'If role or columns are wrong, fix your users table (see schema we discussed) or relax constraints.'
    );
    process.exit(1);
  }

  console.log('Created:', data);
}

createSuperAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
