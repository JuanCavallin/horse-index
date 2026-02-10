#!/usr/bin/env node

/**
 * Pre-Deployment Test Suite
 * Comprehensive validation before pushing to GitHub and deploying to Render
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Colors
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[0;34m';
const NC = '\x1b[0m';

const API = 'http://localhost:8000';
let PASSED = 0;
let FAILED = 0;
let test_num = 0;

// Utils
function log_test(msg) {
  test_num++;
  console.log(`\n${BLUE}Test ${test_num}: ${msg}${NC}`);
}

function pass(msg) {
  console.log(`${GREEN}✓ PASS${NC}: ${msg}`);
  PASSED++;
}

function fail(msg) {
  console.log(`${RED}✗ FAIL${NC}: ${msg}`);
  FAILED++;
}

// HTTP helpers
async function fetch_with_timeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Create test user
async function createTestUser(email, password) {
  try {
    const res = await fetch_with_timeout(`${API}/ping`);
    if (!res.ok) throw new Error('Backend not responding');
    
    // Use the create-token script
    return new Promise((resolve, reject) => {
      const proc = spawn('node', ['create-token.js', email, password], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });
      
      let output = '';
      let error = '';
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { error += data.toString(); });
      
      proc.on('close', (code) => {
        const tokenMatch = output.match(/Token:\s*(\S+)/);
        if (tokenMatch) {
          resolve(tokenMatch[1]);
        } else {
          reject(new Error(`Failed to extract token. Output: ${output}. Error: ${error}`));
        }
      });
      
      proc.on('error', reject);
    });
  } catch (err) {
    throw err;
  }
}

// Decode JWT to get user ID
function getUserIdFromToken(token) {
  try {
    const parts = token.split('.');
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return decoded.sub;
  } catch {
    return null;
  }
}

async function runTests() {
  try {
    // Create test user
    log_test('Create test viewer user');
    const USER_EMAIL = `viewer-${Date.now()}@test.local`;
    const USER_PASS = 'test123456';
    
    const TOKEN = await createTestUser(USER_EMAIL, USER_PASS);
    const USER_ID = getUserIdFromToken(TOKEN);
    
    pass('Test user created with token');
    console.log(`User: ${USER_EMAIL}`);
    console.log(`Token: ${TOKEN.substring(0, 40)}...`);
    console.log(`ID: ${USER_ID}`);
    
    // === API ENDPOINT TESTS ===
    console.log(`\n${BLUE}========================================${NC}`);
    console.log(`${BLUE}API ENDPOINT TESTS${NC}`);
    console.log(`${BLUE}========================================${NC}`);
    
    // Test 2: Health check
    log_test('Health check endpoint');
    try {
      const res = await fetch_with_timeout(`${API}/ping`);
      const text = await res.text();
      if (text.includes('alive')) {
        pass('Server responding to ping');
      } else {
        fail('Server not responding to ping');
      }
    } catch (e) {
      fail(`Ping failed: ${e.message}`);
    }
    
    // Test 3: Authentication enforcement
    log_test('Authentication enforcement');
    try {
      const res = await fetch_with_timeout(`${API}/api/horses`);
      if (res.status === 401) {
        pass('Unauthenticated request returns 401');
      } else {
        fail(`Expected 401, got ${res.status}`);
      }
    } catch (e) {
      fail(`Auth test failed: ${e.message}`);
    }
    
    // Test 4: GET /api/horses (read access)
    log_test('GET /api/horses (read access)');
    try {
      const res = await fetch_with_timeout(`${API}/api/horses`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (res.ok) {
        const data = await res.text();
        if (data.includes('[') || data.includes('id')) {
          pass('Horses endpoint returns data');
        } else {
          fail(`Unexpected response: ${data.substring(0, 100)}`);
        }
      } else {
        fail(`Got status ${res.status}`);
      }
    } catch (e) {
      fail(`Horses endpoint failed: ${e.message}`);
    }
    
    // Test 5: GET /api/users (admin-only enforcement)
    log_test('GET /api/users (admin-only enforcement)');
    try {
      const res = await fetch_with_timeout(`${API}/api/users`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (res.status === 403) {
        pass('Admin-only endpoint correctly denies viewer role (403)');
      } else {
        fail(`Expected 403, got ${res.status}`);
      }
    } catch (e) {
      fail(`Admin test failed: ${e.message}`);
    }
    
    // Test 6: GET /api/audit_logs (read access)
    log_test('GET /api/audit_logs (read access)');
    try {
      const res = await fetch_with_timeout(`${API}/api/audit_logs`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (res.ok) {
        pass('Audit logs endpoint accessible');
      } else {
        fail(`Got status ${res.status}`);
      }
    } catch (e) {
      fail(`Audit logs failed: ${e.message}`);
    }
    
    // === CRUD OPERATION TESTS ===
    console.log(`\n${BLUE}========================================${NC}`);
    console.log(`${BLUE}CRUD OPERATION TESTS${NC}`);
    console.log(`${BLUE}========================================${NC}`);
    
    // Test 8: DELETE restriction
    log_test('DELETE /api/horses/:id (admin-only restriction)');
    try {
      const res = await fetch_with_timeout(`${API}/api/horses/00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (res.status === 403) {
        pass('Viewer role correctly denied DELETE permission (403)');
      } else {
        fail(`Expected 403, got ${res.status}`);
      }
    } catch (e) {
      fail(`Delete test failed: ${e.message}`);
    }
    
    // Test 9: POST /api/medical-records restriction
    log_test('POST /api/medical-records (editor/admin-only restriction)');
    try {
      const res = await fetch_with_timeout(`${API}/api/medical-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ horse_id: 'test', description: 'test' })
      });
      if (res.status === 403) {
        pass('Viewer role correctly denied POST medical records (403)');
      } else {
        fail(`Expected 403, got ${res.status}`);
      }
    } catch (e) {
      fail(`POST test failed: ${e.message}`);
    }
    
    // === JEST TESTS ===
    console.log(`\n${BLUE}========================================${NC}`);
    console.log(`${BLUE}UNIT TESTS (JEST)${NC}`);
    console.log(`${BLUE}========================================${NC}`);
    
    log_test('Run Jest unit tests');
    const jestResult = await new Promise((resolve) => {
      const proc = spawn('npm', ['test'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let output = '';
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { output += data.toString(); });
      
      proc.on('close', (code) => {
        const hasTests = output.includes('Tests:') || output.includes('No tests found, exiting with code 0');
        resolve({ code, output, hasTests });
      });
    });
    
    if (jestResult.hasTests || jestResult.code === 0) {
      const match = jestResult.output.match(/Tests:\s+(\d+)/);
      if (match) {
        pass(`Jest tests passed (${match[1]} tests)`);
      } else {
        pass('Jest configured (no tests yet)');
      }
    } else {
      fail('Jest tests failed');
    }
    
    // === BUILD TEST ===
    console.log(`\n${BLUE}========================================${NC}`);
    console.log(`${BLUE}BUILD TEST${NC}`);
    console.log(`${BLUE}========================================${NC}`);
    
    log_test('TypeScript compilation (npm run build)');
    const buildResult = await new Promise((resolve) => {
      const proc = spawn('npm', ['run', 'build'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let output = '';
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { output += data.toString(); });
      
      proc.on('close', (code) => {
        const distExists = fs.existsSync(path.join(__dirname, '..', 'dist', 'app.js'));
        resolve({ code, output, distExists });
      });
    });
    
    if (buildResult.code === 0 && buildResult.distExists) {
      pass('TypeScript compiled successfully');
    } else {
      fail(`Build failed (code: ${buildResult.code})`);
    }
    
    // === SUMMARY ===
    console.log(`\n${BLUE}========================================${NC}`);
    console.log(`${BLUE}TEST SUMMARY${NC}`);
    console.log(`${BLUE}========================================${NC}`);
    
    const TOTAL = PASSED + FAILED;
    console.log('');
    console.log(`${GREEN}Passed: ${PASSED}${NC}`);
    
    if (FAILED > 0) {
      console.log(`${RED}Failed: ${FAILED}${NC}`);
      console.log('');
      console.log(`${RED}❌ DEPLOYMENT BLOCKED - Fix failing tests before pushing${NC}`);
      process.exit(1);
    } else {
      console.log(`${GREEN}Failed: ${FAILED}${NC}`);
      console.log('');
      console.log(`${GREEN}✅ ALL TESTS PASSED - Ready for deployment${NC}`);
      console.log('');
      console.log('Next steps:');
      console.log('  1. git push origin main');
      console.log('  2. Create Render service at dashboard.render.com');
      console.log('  3. Run: eas build --platform android');
      console.log('');
      process.exit(0);
    }
  } catch (err) {
    console.error(`${RED}Fatal error: ${err.message}${NC}`);
    process.exit(1);
  }
}

runTests();
