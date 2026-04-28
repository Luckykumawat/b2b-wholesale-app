// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// const { createClient } = require('@supabase/supabase-js');

// const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
// const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

// const hasSupabaseEnv = Boolean(supabaseUrl && supabaseServiceKey);

// if (hasSupabaseEnv) {
//   console.log('[supabase] Client initialized:', {
//     url: supabaseUrl,
//     keyPrefix: `${String(supabaseServiceKey).slice(0, 12)}…`,
//   });
// } else {
//   console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY missing — Supabase calls will use stub until env is set.');
// }

// const supabase = hasSupabaseEnv
//   ? createClient(supabaseUrl, supabaseServiceKey, {
//       auth: { persistSession: false },
//     })
//   : {
//       from() {
//         throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
//       },
//     };

// console.log("SUPABASE URL:", process.env.SUPABASE_URL);
// console.log("SUPABASE KEY:", process.env.SUPABASE_SERVICE_KEY ? "EXISTS" : "MISSING");

// module.exports = supabase;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();
const jwtSecret = (process.env.JWT_SECRET || '').trim();

// Debug logs (safe)
console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY EXISTS:", !!supabaseServiceKey);
console.log("JWT SECRET EXISTS:", !!jwtSecret);

// Validate env
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase environment variables are missing. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY"
  );
}

// Create client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

module.exports = supabase;