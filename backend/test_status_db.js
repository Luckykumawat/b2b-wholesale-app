const supabase = require('./src/config/supabase');

async function testStatus(status) {
  const { error } = await supabase.from('quotations').insert({
    buyer_id: '00000000-0000-0000-0000-000000000000',
    total_amount: 0,
    status: status,
    created_by: '00000000-0000-0000-0000-000000000000'
  });
  if (error && error.code === '23514') {
    console.log(`Status ${status} is REJECTED`);
  } else {
    // 23503 is foreign key violation which means status passed!
    if (error && error.code === '23503') {
       console.log(`Status ${status} is ACCEPTED by constraint (failed on FK)`);
    } else {
       console.log(`Status ${status} result:`, error);
    }
  }
}

async function run() {
  await testStatus('confirmed');
  await testStatus('accepted');
  await testStatus('approved');
  await testStatus('approved_by_admin');
  await testStatus('confirmed_by_buyer');
  await testStatus('rejected');
}

run();
