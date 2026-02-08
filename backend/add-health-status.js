const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    db: { schema: 'public' }
  }
);

async function migrate() {
  console.log('Adding health_status column to horses table...');
  
  // Use raw SQL to add the column
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.horses 
      ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'healthy'
      CHECK (health_status IN ('healthy', 'needs_attention', 'critical', 'palliative'));
    `
  });
  
  if (error) {
    console.error('Migration error:', error);
    console.log('\nManual SQL to run in Supabase SQL Editor:');
    console.log(`
ALTER TABLE public.horses 
ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'healthy'
CHECK (health_status IN ('healthy', 'needs_attention', 'critical', 'palliative'));
    `);
  } else {
    console.log('Success! health_status column added.');
  }
}

migrate();
