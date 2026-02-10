#!/usr/bin/env node

/**
 * Get a test JWT token from Supabase for local testing
 * Usage: node get-test-token.js [email] [password]
 * 
 * Default test users:
 * - admin@test.com / password → administrator role
 * - editor@test.com / password → editor role
 * - viewer@test.com / password → viewer role
 */

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const email = process.argv[2] || 'admin@test.com';
const password = process.argv[3] || 'password';

const payload = JSON.stringify({
  email,
  password,
});

const url = new URL(SUPABASE_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: '/auth/v1/token?grant_type=password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length,
    'apikey': SUPABASE_KEY,
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('\n✓ Test Token Acquired\n');
      console.log(`Email: ${email}`);
      console.log(`Token: ${response.access_token}`);
      console.log('\nUse with curl like this:');
      console.log(`curl -H "Authorization: Bearer ${response.access_token}" http://localhost:8000/api/horses`);
      console.log('\n');
    } else {
      console.error('Error:', res.statusCode, data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(payload);
req.end();
