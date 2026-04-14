const supabase = require('./src/config/supabase');

async function test() {
  const { data, error } = await supabase.from('activity_logs').select('id').limit(1);
  if (error) {
    console.error('Error fetching activity_logs:', error);
  } else {
    console.log('activity_logs exists!', data);
  }
}
test();
