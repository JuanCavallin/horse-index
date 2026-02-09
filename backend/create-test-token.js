#!/usr/bin/env node

/**
 * Create and sign-in a test user in Supabase, then return access token
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = process.argv[2] || 'test-admin@example.com';
const password = process.argv[3] || 'testpassword123';

async function getToken() {
  try {
    // Try to sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError && !signUpError.message.includes('already')) {
      console.error('Sign up error:', signUpError.message);
      // Try to sign in instead if user exists
    }

    // Sign in to get token
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error.message);
      process.exit(1);
    }

    console.log('\n✓ Test Token Acquired\n');
    console.log(`Email: ${email}`);
    console.log(`Token: ${data.session.access_token}`);
    console.log('\nUse with curl:');
    console.log(`curl -H "Authorization: Bearer ${data.session.access_token}" http://localhost:8000/api/horses`);
    console.log('\n');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

getToken();
