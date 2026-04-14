const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_quotation_status_enum_or_constraint');
  // Since we don't have rpc for this, let's just query postgres via a REST extension if it existed.
  // Actually, wait, let me just try testing different statuses.
  const statusesToTest = ['confirmed', 'confirmed_by_buyer', 'accepted'];
  for (const status of statusesToTest) {
    const { error: err } = await supabase.from('quotations').insert({
      buyer_id: '00000000-0000-0000-0000-000000000000',
      total_amount: 0,
      status: status,
      created_by: '00000000-0000-0000-0000-000000000000'
    });
    if (err && err.code === '23514') {
      console.log(`Status ${status} is REJECTED by constraint`);
    } else {
      console.log(`Status ${status} is ACCEPTED (or failed for another reason: ${err?.message})`);
    }
  }
}

run();
