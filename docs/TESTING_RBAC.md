# Testing Role-Based Access Control (RBAC)

## Prerequisites

Before testing, ensure:
- ✅ Backend server is running (`docker compose up` or `cd backend && npm run dev`)
- ✅ Frontend is running (Expo app)
- ✅ You have access to Supabase Dashboard (https://supabase.com/dashboard)

## Step 1: Apply Database Changes

### 1.1 Run the Migration Script

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `backend/db/migration_add_roles.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Verify you see "Success. No rows returned" (or similar success message)

### 1.2 Verify the Changes

Run this query to check the schema:

```sql
-- Check if user_role enum was created
SELECT enum_range(NULL::user_role);
-- Should return: {viewer,editor,administrator}

-- Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
-- Should include: auth_user_id, email, role

-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
-- Should return one row with tgenabled = 'O' (enabled)
```

## Step 2: Create Test Users

### 2.1 Sign Up Test Accounts

Create 3 test accounts in your app:

1. **viewer@test.com** (will stay as viewer)
2. **editor@test.com** (will be promoted to editor)
3. **admin@test.com** (will be promoted to admin)

Sign up each account through your app's login screen.

### 2.2 Verify Auto-Profile Creation

In Supabase SQL Editor:

```sql
-- Check all users were created with default 'viewer' role
SELECT id, email, name, role, auth_user_id
FROM public.users
ORDER BY created_at DESC;
```

You should see all 3 users with `role = 'viewer'`.

### 2.3 Assign Roles

```sql
-- Promote one user to administrator
UPDATE public.users 
SET role = 'administrator' 
WHERE email = 'admin@test.com';

-- Promote one user to editor
UPDATE public.users 
SET role = 'editor' 
WHERE email = 'editor@test.com';

-- Verify the changes
SELECT email, role FROM public.users ORDER BY role;
```

## Step 3: Test Backend API (Using curl or Postman)

### 3.1 Get Authentication Tokens

For each test user, get their JWT token:

**Method 1: From Browser DevTools (Web)**
1. Log in as the user
2. Open DevTools > Application > Local Storage
3. Find the Supabase session token

**Method 2: From SQL (Temporary Test Tokens)**
```sql
-- Note: This is just to see the user ID
SELECT auth_user_id, email FROM public.users;
```

**Method 3: Log it in your app**
Add this temporarily to your login screen:
```tsx
const { data: { session } } = await supabase.auth.getSession();
console.log('TOKEN:', session?.access_token);
```

### 3.2 Test API Endpoints

Replace `<TOKEN>` with the actual JWT token for each user.

#### Test as Viewer (viewer@test.com)

```bash
# GET horses - Should work ✅
curl http://localhost:8000/api/horses \
  -H "Authorization: Bearer <VIEWER_TOKEN>"

# POST horse - Should fail ❌ (403 Forbidden)
curl -X POST http://localhost:8000/api/horses \
  -H "Authorization: Bearer <VIEWER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Horse","breed":"Arabian","gender":"Mare","color":"Bay","birth_year":2020,"arrival_date":"2024-01-01","grooming_day":"Monday"}'

# Expected: {"error":"Insufficient permissions","required":["editor","administrator"],"current":"viewer"}
```

#### Test as Editor (editor@test.com)

```bash
# GET horses - Should work ✅
curl http://localhost:8000/api/horses \
  -H "Authorization: Bearer <EDITOR_TOKEN>"

# POST horse - Should work ✅
curl -X POST http://localhost:8000/api/horses \
  -H "Authorization: Bearer <EDITOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Editor Horse","breed":"Thoroughbred","gender":"Mare","color":"Black","birth_year":2019,"arrival_date":"2024-01-01","grooming_day":"Tuesday"}'

# PUT horse - Should work ✅
curl -X PUT http://localhost:8000/api/horses/1 \
  -H "Authorization: Bearer <EDITOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# DELETE horse - Should fail ❌ (403 Forbidden)
curl -X DELETE http://localhost:8000/api/horses/1 \
  -H "Authorization: Bearer <EDITOR_TOKEN>"

# Expected: {"error":"Insufficient permissions","required":["administrator"],"current":"editor"}
```

#### Test as Administrator (admin@test.com)

```bash
# All operations should work ✅

# GET users list (admin only)
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# DELETE horse (admin only)
curl -X DELETE http://localhost:8000/api/horses/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Update user role (admin only)
curl -X PUT http://localhost:8000/api/users/2 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"editor"}'
```

#### Test Without Token

```bash
# Should fail with 401 Unauthorized
curl http://localhost:8000/api/horses

# Expected: {"error":"Missing authentication token"}
```

## Step 4: Test Frontend UI

### 4.1 Test as Viewer

1. Log in as `viewer@test.com`
2. Check the UI:
   - ✅ Can see horse list
   - ✅ Can view horse details
   - ❌ Edit/Create buttons should be hidden or disabled
   - ❌ Delete buttons should be hidden
   - ❌ Cannot access user management

3. Try to edit via API call:
```tsx
// Add this temporarily to test
import { horsesApi } from '@/lib/api';

try {
  await horsesApi.update(1, { name: 'Hacked' });
  console.log('ERROR: Viewer should not be able to edit!');
} catch (error) {
  console.log('Good: API blocked viewer from editing:', error);
}
```

### 4.2 Test as Editor

1. Log out and log in as `editor@test.com`
2. Check the UI:
   - ✅ Can see all data
   - ✅ Edit/Create buttons are visible and work
   - ✅ Can successfully create new horses
   - ✅ Can successfully edit existing horses
   - ❌ Delete buttons should be hidden or disabled
   - ❌ Cannot access user management

3. Verify edit functionality:
   - Create a new horse - should succeed
   - Edit an existing horse - should succeed
   - Try to delete - should fail (403 if backend called)

### 4.3 Test as Administrator

1. Log out and log in as `admin@test.com`
2. Check the UI:
   - ✅ Full access to all features
   - ✅ Can create, edit, AND delete horses
   - ✅ Can access user management (if implemented)
   - ✅ All admin-only features are visible

3. Test admin features:
   - Delete a horse - should succeed
   - Access `/api/users` endpoint - should succeed

### 4.4 Test UserContext Hook

Create a test component to verify the context:

```tsx
// Add to any screen to test
import { useUser } from '@/lib/UserContext';

function RoleDebug() {
  const { user, isViewer, isEditor, isAdmin, canEdit, canDelete } = useUser();
  
  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>🔍 Role Debug Info:</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Role: {user?.role}</Text>
      <Text>Is Viewer: {isViewer ? '✅' : '❌'}</Text>
      <Text>Is Editor: {isEditor ? '✅' : '❌'}</Text>
      <Text>Is Admin: {isAdmin ? '✅' : '❌'}</Text>
      <Text>Can Edit: {canEdit ? '✅' : '❌'}</Text>
      <Text>Can Delete: {canDelete ? '✅' : '❌'}</Text>
    </View>
  );
}
```

## Step 5: Test Database RLS Policies

Even if someone bypasses frontend/backend, the database should protect itself.

### 5.1 Test Direct Database Access

In Supabase SQL Editor, simulate what each role can do:

```sql
-- Simulate viewer access
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"<viewer-auth-user-id>"}';

-- Try to insert (should fail)
INSERT INTO horses (name, breed, gender, color, birth_year, arrival_date, grooming_day)
VALUES ('Test', 'Test', 'Mare', 'Bay', 2020, '2024-01-01', 'Monday');
-- Expected: permission denied due to RLS policy

-- Try to select (should work)
SELECT * FROM horses LIMIT 5;
-- Expected: Returns data

RESET role;
RESET request.jwt.claims;
```

### 5.2 Verify Policy Enforcement

```sql
-- Check active policies on horses table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'horses'
ORDER BY policyname;

-- Should show:
-- 1. "Anyone authenticated can view horses" (SELECT)
-- 2. "Editors and admins can insert horses" (INSERT)
-- 3. "Editors and admins can update horses" (UPDATE)
-- 4. "Only administrators can delete horses" (DELETE)
```

## Step 6: Test Edge Cases

### 6.1 Test Token Expiration

1. Log in as a user
2. In Supabase Dashboard > Authentication > Policies
3. Find the JWT settings (typically 1 hour expiration)
4. Manually expire the token or wait for expiration
5. Try to make API calls
6. ✅ Should get 401 Unauthorized
7. ✅ Frontend should redirect to login

### 6.2 Test Role Changes

1. Log in as `editor@test.com`
2. Verify you can edit horses
3. In Supabase, demote to viewer:
   ```sql
   UPDATE users SET role = 'viewer' WHERE email = 'editor@test.com';
   ```
4. In the app, call `refreshUser()` or log out and back in
5. ✅ Edit buttons should disappear
6. ✅ Edit API calls should now fail

### 6.3 Test Deleted User

1. Create a test user
2. Delete from auth.users in Supabase
3. ✅ Should also delete from public.users (cascade)
4. ✅ App should handle gracefully

### 6.4 Test Missing Profile

1. Create user in auth.users without trigger
2. Try to use app
3. ✅ Should get "User profile not found" error
4. Fix by manually inserting into public.users

## Expected Test Results Matrix

| Action | Viewer | Editor | Admin |
|--------|--------|--------|-------|
| View horses | ✅ | ✅ | ✅ |
| Create horse | ❌ 403 | ✅ | ✅ |
| Edit horse | ❌ 403 | ✅ | ✅ |
| Delete horse | ❌ 403 | ❌ 403 | ✅ |
| View users | ❌ 403 | ❌ 403 | ✅ |
| Edit user roles | ❌ 403 | ❌ 403 | ✅ |
| View own profile | ✅ | ✅ | ✅ |

## Troubleshooting Test Issues

### "User profile not found"
```sql
-- Check if user exists in auth but not in public
SELECT email FROM auth.users WHERE email = 'test@test.com';
SELECT email FROM public.users WHERE email = 'test@test.com';

-- If missing, manually create:
INSERT INTO public.users (auth_user_id, email, name, role)
VALUES ('<uuid-from-auth-users>', 'test@test.com', 'Test User', 'viewer');
```

### "Permission denied" when it shouldn't be
```sql
-- Check user's actual role
SELECT email, role FROM public.users WHERE email = 'youruser@test.com';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies are active
SELECT * FROM pg_policies WHERE tablename = 'horses';
```

### Backend says "Invalid token"
- Token may be expired (default 1 hour)
- Log out and log back in
- Check Supabase URL and keys in .env files match

### Frontend not showing role-based UI
- Check if UserProvider is wrapping the app in _layout.tsx
- Check console for API errors
- Verify useUser() hook is being called correctly
- Add the RoleDebug component to see actual values

## Automated Test Script

Create this test script for quick verification:

```bash
#!/bin/bash
# Save as test_rbac.sh

API_URL="http://localhost:8000/api"

echo "🧪 Testing RBAC System..."
echo ""

# Test 1: No token (should fail)
echo "Test 1: No authentication token"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/horses)
if [ "$RESPONSE" = "401" ]; then
  echo "✅ Correctly rejected unauthenticated request"
else
  echo "❌ Failed: Expected 401, got $RESPONSE"
fi

echo ""
echo "To continue testing, get your tokens and run:"
echo "  curl $API_URL/horses -H 'Authorization: Bearer <TOKEN>'"
```

## Test Checklist

- [ ] Migration script ran successfully
- [ ] Trigger creates user profiles automatically
- [ ] Can create 3 different users (viewer, editor, admin)
- [ ] Viewer can read but not write
- [ ] Editor can read and write but not delete
- [ ] Administrator has full access
- [ ] API returns 401 without token
- [ ] API returns 403 for insufficient permissions
- [ ] Frontend shows/hides UI based on role
- [ ] UserContext hook provides correct flags
- [ ] RLS policies enforce permissions at database level
- [ ] Role changes take effect after refresh
- [ ] Token expiration handled gracefully

## Next Steps After Testing

Once all tests pass:
1. Remove debug/test code from components
2. Add proper error handling UI for 403 errors
3. Consider implementing an admin dashboard for user management
4. Add audit logging for role changes
5. Document any custom permissions you add

---

**Need Help?** Check the [RBAC Setup Guide](./RBAC_SETUP_GUIDE.md) for detailed implementation info.
