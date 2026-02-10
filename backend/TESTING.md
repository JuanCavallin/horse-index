# Backend Testing Guide

## Running Tests

### Manual API Tests (JavaScript)
```bash
# Test local dev server
node backend/tests/manual-test.js http://localhost:8000 "YOUR_TOKEN"

# Test deployed Render backend
node backend/tests/manual-test.js https://your-backend.onrender.com "YOUR_TOKEN"
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

## What to Test Manually

When running the manual test suite, verify these features work:

### Authentication
- Request without token is rejected
- Request with valid token succeeds
- User role information is properly loaded

### Role-Based Access Control
- Admins can delete (horses, medical records, etc.)
- Editors can create/update (horses, medical records, etc.)
- Viewers are read-only
- Proper 403 Forbidden responses for unauthorized actions

### Core Endpoints
- **GET /ping** - Health check works
- **GET /api/horses** - Retrieves horse list with auth
- **POST /api/horses** - Creates new horse (editor+)
- **GET /api/horses/:id** - Retrieves single horse with medical records
- **POST /api/medical-records** - Creates medical record (editor+)
- **PUT /api/medical-records/:id** - Updates medical record (editor+)
- **DELETE /api/medical-records/:id** - Deletes record (admin only)
- **GET /api/audit_logs** - Audit trail accessible to all authenticated users
- **GET /api/users/me** - Current user profile
- **GET /api/users** - List all users (admin only)

### Medical Records
- CRUD operations work
- Photo URLs are stored and retrievable
- `updated_at` and `updated_by` are tracked

### Audit Trail
- Creation, updates, and deletions are logged
- User ID and timestamp are recorded
- Authenticated users can read logs

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

## Pre-Deployment Testing

Before deploying to Render, run:
```bash
node backend/tests/pre-deployment-test.js
```

This comprehensive test suite validates all endpoints and role-based access control with a live backend instance.

## CI/CD Integration

For future automated testing with GitHub Actions, add `.github/workflows/test.yml`:
```yaml
name: Backend Pre-Deployment Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm install
      - run: npm run build  # Compile TypeScript
      - run: node backend/tests/pre-deployment-test.js
```

This will run the pre-deployment test suite on every push/PR.

## Next Steps

1. **Local Testing**: Get a test token and run manual tests:
   ```bash
   node backend/tests/manual-test.js http://localhost:8000 "YOUR_TOKEN"
   ```

2. **Pre-Deployment**: Before pushing to GitHub:
   ```bash
   node backend/tests/pre-deployment-test.js
   ```

3. **Production Validation**: After deploying to Render:
   ```bash
   node backend/tests/manual-test.js https://your-backend.onrender.com "PROD_TOKEN"
   ```
