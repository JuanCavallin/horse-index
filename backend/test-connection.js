const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function test() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const { data, error } = await supabase
    .from('horses')
    .select('id, name, health_status')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Found horses:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

test();
