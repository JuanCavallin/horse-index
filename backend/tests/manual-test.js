#!/usr/bin/env node

/**
 * Manual API Test Script
 * Usage: node manual-test.js [baseUrl] [token]
 * Example: node manual-test.js http://localhost:8000 "eyJhbGc..."
 */

const baseUrl = process.argv[2] || 'http://localhost:8000';
const token = process.argv[3] || 'your_token_here';

console.log('🧪 Running Manual Backend Tests');
console.log(`Base URL: ${baseUrl}`);
console.log('==================================================');

const tests = [
  {
    name: 'Test 1: Ping (no auth)',
    method: 'GET',
    url: '/ping',
    requiresAuth: false
  },
  {
    name: 'Test 2: Get Horses (requires auth)',
    method: 'GET',
    url: '/api/horses',
    requiresAuth: true
  },
  {
    name: 'Test 3: Get Horse #1 with Medical Records',
    method: 'GET',
    url: '/api/horses/1',
    requiresAuth: true
  },
  {
    name: 'Test 4: Create Medical Record (editor+ only)',
    method: 'POST',
    url: '/api/medical-records',
    requiresAuth: true,
    body: {
      horse_id: 1,
      description: 'Test checkup',
      record_type: 'checkup',
      vet_name: 'Dr. Test',
      date: '2026-02-09',
      notes: 'All clear'
    }
  },
  {
    name: 'Test 5: Update Medical Record',
    method: 'PUT',
    url: '/api/medical-records/1',
    requiresAuth: true,
    body: {
      description: 'Updated checkup',
      notes: 'Follow-up needed'
    }
  },
  {
    name: 'Test 6: Delete Medical Record (admin only)',
    method: 'DELETE',
    url: '/api/medical-records/1',
    requiresAuth: true
  },
  {
    name: 'Test 7: Get Audit Logs',
    method: 'GET',
    url: '/api/audit_logs',
    requiresAuth: true
  },
  {
    name: 'Test 8: Get Current User Profile',
    method: 'GET',
    url: '/api/users/me',
    requiresAuth: true
  },
  {
    name: 'Test 9: List Users (admin only)',
    method: 'GET',
    url: '/api/users',
    requiresAuth: true
  },
  {
    name: 'Test 10: Create Horse with Treatment',
    method: 'POST',
    url: '/api/horses',
    requiresAuth: true,
    body: {
      name: 'Test Horse',
      breed: 'Thoroughbred',
      gender: 'Mare',
      color: 'Bay',
      health_status: 'healthy',
      new_treatments: [
        {
          type: 'Daily medication',
          frequency: 'Twice daily',
          notes: 'For test purposes'
        }
      ]
    }
  }
];

async function runTests() {
  for (const test of tests) {
    console.log(`\n✓ ${test.name}`);
    
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (test.requiresAuth) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (test.body) {
      options.body = JSON.stringify(test.body);
    }
    
    try {
      const response = await fetch(`${baseUrl}${test.url}`, options);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      const statusText = response.ok ? '✓' : '!';
      console.log(`${statusText} Status: ${response.status}`);
      
      if (typeof data === 'object') {
        console.log(JSON.stringify(data, null, 2).substring(0, 400));
      } else {
        console.log(String(data).substring(0, 400));
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '==================================================');
  console.log('✅ Manual tests complete!');
  console.log('');
  console.log('Notes:');
  console.log('- Admin-only endpoints should return 403 if token is non-admin');
  console.log('- Editor endpoints should return 201/200 on success');
  console.log('- Medical records should use medical_records table');
  console.log('- All changes should be logged in audit_trail');
  console.log('');
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
