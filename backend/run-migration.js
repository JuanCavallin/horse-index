const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function migrate() {
  console.log('Running migration via query...');
  
  // Try with a simple query that will work via the REST API
  const sql = `ALTER TABLE public.horses ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'needs_attention', 'critical', 'palliative'));`;
  
  // Use Supabase's postgREST to execute raw SQL
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/sql_execute`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  );
  
  console.log('Response status:', response.status);
  const result = await response.json();
  console.log('Result:', JSON.stringify(result, null, 2));
}

migrate();
