const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function test() {
  console.log('Checking horses table...');
  
  // Try to get any columns that exist
  const { data, error } = await supabase
    .from('horses')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Horses found:', data.length);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample:', JSON.stringify(data[0], null, 2));
    }
  }
}

test();
