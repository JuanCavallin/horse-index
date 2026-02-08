import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// load the .env file content
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// crash immediately if keys are missing
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in .env file');
}

// create and export the client
export const supabase = createClient(supabaseUrl, supabaseKey);