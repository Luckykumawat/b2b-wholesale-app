const supabase = require('./src/config/supabase');

async function testStatus(status) {
  const { error } = await supabase.from('quotations').insert({
    buyer_id: '00000000-0000-0000-0000-000000000000',
    total_amount: 0,
    status: status,
    created_by: '00000000-0000-0000-0000-000000000000'
  });
  if (error && error.code === '23503') return true;
  return false;
}

async function run() {
  const possible = ['completed', 'ordered', 'converted'];
  for (const s of possible) {
      const ok = await testStatus(s);
      if (ok) console.log(`Valid: ${s}`);
  }
}

run();
