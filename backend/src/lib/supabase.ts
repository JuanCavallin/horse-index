import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// load the .env file content
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// crash immediately if keys are missing
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in .env file');
}

// anon client (used for auth verification)
export const supabaseAnon = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// service role client for backend operations (bypasses RLS)
// Falls back to anon client if service role key is not configured
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      }
    })
  : supabaseAnon;

// Default export: use service role for all backend DB/storage operations
export const supabase = supabaseAdmin;