const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

const hasSupabaseEnv = Boolean(supabaseUrl && supabaseServiceKey);

if (hasSupabaseEnv) {
  console.log('[supabase] Client initialized:', {
    url: supabaseUrl,
    keyPrefix: `${String(supabaseServiceKey).slice(0, 12)}…`,
  });
} else {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY missing — Supabase calls will use stub until env is set.');
}

const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : {
      from() {
        throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
      },
    };

module.exports = supabase;
