const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function test() {
  console.log('Testing horses endpoint with default health_status...');
  
  const { data, error } = await supabase
    .from('horses')
    .select('*')
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✓ Success! Found horses:', data.length);
    // Simulate what the backend does
    const horsesWithStatus = data.map((horse) => ({
      ...horse,
      health_status: horse.health_status || 'healthy'
    }));
    console.log('\nHorses with health_status:');
    horsesWithStatus.forEach(h => {
      console.log(`  - ${h.name}: ${h.health_status}`);
    });
  }
}

test();
