# Backend Testing Guide

## Setup

```bash
cd backend

# Install test dependencies
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest

# Update package.json scripts
```

Add to `backend/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running Tests

### Unit/Integration Tests (Jest)
```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- integration.test.ts

# Generate coverage report
npm test -- --coverage
```

### Manual API Tests (Bash/cURL)
```bash
# Test local dev server
bash tests/manual_test.sh http://localhost:8000 "Bearer YOUR_TOKEN"

# Test deployed Render backend
bash tests/manual_test.sh https://your-backend.onrender.com "Bearer YOUR_TOKEN"
```

## Getting a Test Token

### Option 1: Use Supabase Test User
1. Go to Supabase dashboard → Authentication → Users
2. Create a test user (e.g., `test@example.com`)
3. Go to SQL Editor and run:
```sql
UPDATE public.users SET role = 'editor' WHERE email = 'test@example.com';
```
4. Sign in locally or use Supabase CLI to get a test token

### Option 2: Extract from Frontend
1. Sign in to the app in frontend development
2. Open browser DevTools → Application → Local Storage → find `supabase.auth.token`
3. Use that token in tests

### Option 3: Programmatic (JavaScript)
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123',
});
const token = data.session.access_token;
```

## What Tests Cover

### Auth Middleware (`integration.test.ts`)
- ✓ Reject missing/invalid tokens
- ✓ Attach user role info from database
- ✓ Handle auth errors gracefully

### Role-Based Access Control
- ✓ Admins can delete (horses, medical records, etc.)
- ✓ Editors can create/update (horses, medical records, etc.)
- ✓ Viewers are read-only
- ✓ Proper 403 Forbidden responses

### Medical Records
- ✓ CRUD operations
- ✓ Uses `medical_records` table (not `documents`)
- ✓ Stores `photo_url`, `updated_at`, `updated_by`

### Audit Trail
- ✓ Logs creation, updates, deletions
- ✓ Tracks user_id and timestamp
- ✓ All authenticated users can read

### Error Handling
- ✓ 404 on missing records
- ✓ 500 on database errors (graceful)
- ✓ 400 on invalid input
- ✓ 401/403 on auth failures

## Expected Results

### Manual Test Expectations

| Endpoint | Method | Auth | Role | Expected Status |
|----------|--------|------|------|-----------------|
| `/ping` | GET | No | - | 200 |
| `/api/horses` | GET | Yes | any | 200 |
| `/api/horses` | POST | Yes | editor+ | 201 |
| `/api/horses/:id` | PUT | Yes | editor+ | 200 |
| `/api/horses/:id` | DELETE | Yes | admin | 204 |
| `/api/medical-records` | POST | Yes | editor+ | 201 |
| `/api/medical-records/:id` | DELETE | Yes | admin | 204 |
| `/api/users` | GET | Yes | admin | 200 (admin only) |
| `/api/audit_logs` | GET | Yes | any | 200 |

## Debugging Failures

If a test fails:

1. **Auth errors**: Verify token is valid and user has a profile in `public.users` table
2. **404 errors**: Check that IDs exist in database
3. **Type mismatches**: Ensure data matches expected types (e.g., `horse_id` is bigint, not string)
4. **Permission denied**: Confirm user role is correct (`administrator`, `editor`, or `viewer`)
5. **Timestamp issues**: Use `now()` for `created_at`, `updated_at` defaults

## CI/CD Integration

For GitHub Actions, add `.github/workflows/test.yml`:
```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:latest
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm install && npm test
```

## Next Steps

After tests pass:
1. Deploy backend to Render
2. Update frontend `.env` with production API URL
3. Run manual tests against Render URL
4. Deploy to EAS for mobile builds
