# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This application now has a complete role-based access control system with three permission levels:

- **Viewer**: Read-only access to all data
- **Editor**: Can view and modify data (create, update)
- **Administrator**: Full access including delete operations and user management

## What Was Implemented

### 1. Database Layer

#### Schema Changes ([backend/db/schema.sql](backend/db/schema.sql))
- Added `user_role` enum type with values: 'viewer', 'editor', 'administrator'
- Modified `users` table structure:
  - Added `auth_user_id` column linking to Supabase auth.users
  - Added `email` column
  - Added `role` column (user_role enum, defaults to 'viewer')
  - Removed old boolean flags (administrator, edit_capabilities, view_capabilities)

#### Row Level Security (RLS) Policies
Implemented granular access control for all tables:

**Viewers**: Can SELECT (read) all data
**Editors**: Can SELECT, INSERT, UPDATE
**Administrators**: Full access (SELECT, INSERT, UPDATE, DELETE)

Each table (horses, medical_records, treatments, action_taken, daily_observations) has policies enforcing these rules.

#### Helper Function
Created `get_user_role()` function that returns the current authenticated user's role from the database.

#### Auto-Profile Creation
Added a trigger that automatically creates a user profile in `public.users` when someone signs up via Supabase Auth. New users default to 'viewer' role.

#### Migration Script ([backend/db/migration_add_roles.sql](backend/db/migration_add_roles.sql))
For existing databases, run this script to:
- Create the enum type
- Add new columns
- Migrate existing data from boolean flags to roles
- Drop old policies and create new ones
- Set up the auto-profile trigger

### 2. Backend Layer

#### Authentication Middleware ([backend/src/middleware/auth.ts](backend/src/middleware/auth.ts))
Created comprehensive auth middleware:

- `authenticateToken`: Verifies JWT token and attaches user info to request
- `requireRole(...roles)`: Checks if user has one of the specified roles
- `requireEditor`: Shorthand for editor or administrator
- `requireAdmin`: Requires administrator role only
- `optionalAuth`: Attaches user info if token present, doesn't fail if missing

#### Protected Routes
Updated all route files to use authentication:

**[backend/src/routes/horses.ts](backend/src/routes/horses.ts)**:
- GET: Requires authentication (all roles)
- POST/PUT: Requires editor or administrator
- DELETE: Requires administrator only

**[backend/src/routes/medical-records.ts](backend/src/routes/medical-records.ts)**:
- Same pattern as horses

**[backend/src/routes/users.ts](backend/src/routes/users.ts)**:
- GET /api/users/me: Any authenticated user can view their own profile
- GET /api/users: List all users (admin only)
- PUT /api/users/:id: Update user role (admin only)

### 3. Frontend Layer

#### Type Definitions ([frontend/lib/types.ts](frontend/lib/types.ts))
Added:
- `UserRole` enum
- `User` interface
- `UserUpdate` interface

#### API Client ([frontend/lib/api.ts](frontend/lib/api.ts))
- Modified `request()` function to automatically include JWT token in Authorization header
- Added `usersApi` with endpoints:
  - `me()`: Get current user profile
  - `list()`: List all users (admin only)
  - `update(id, data)`: Update user role/info (admin only)

#### User Context ([frontend/lib/UserContext.tsx](frontend/lib/UserContext.tsx))
Created a React context provider that:
- Fetches and stores current user info
- Provides helper flags: `isViewer`, `isEditor`, `isAdmin`, `canEdit`, `canDelete`
- Listens for auth state changes
- Provides `refreshUser()` function to reload user data

#### App Layout ([frontend/app/_layout.tsx](frontend/app/_layout.tsx))
Wrapped the app with `UserProvider` to make user role available throughout the app.

## Setup Instructions

### 1. Database Setup

#### For New Databases
Run the updated schema file in Supabase SQL Editor:
```sql
-- Copy and paste contents of backend/db/schema.sql
```

#### For Existing Databases
Run the migration script in Supabase SQL Editor:
```sql
-- Copy and paste contents of backend/db/migration_add_roles.sql
```

### 2. Backend Setup

No additional packages needed - everything uses existing dependencies.

The backend is already configured. Just restart your server:
```bash
cd backend
npm run dev
```

### 3. Frontend Setup

No additional packages needed. The frontend code is ready to use.

## Usage Guide

### In Frontend Components

Import the `useUser` hook to access user role information:

```tsx
import { useUser } from '@/lib/UserContext';

function MyComponent() {
  const { user, isAdmin, isEditor, canEdit, canDelete, loading } = useUser();

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Text>Role: {user?.role}</Text>
      
      {canEdit && (
        <Button title="Edit" onPress={handleEdit} />
      )}
      
      {canDelete && (
        <Button title="Delete" onPress={handleDelete} />
      )}
      
      {isAdmin && (
        <Button title="Manage Users" onPress={goToUserManagement} />
      )}
    </View>
  );
}
```

### Conditional Rendering Examples

```tsx
// Show edit button only for editors and admins
{canEdit && <EditButton />}

// Show delete button only for admins
{canDelete && <DeleteButton />}

// Show admin panel only for admins
{isAdmin && <AdminPanel />}

// Show different UI based on role
{isViewer && <ViewOnlyBanner />}
```

### Making API Calls

API calls automatically include the auth token. The backend will enforce permissions:

```tsx
try {
  // This will work for editors and admins only
  await horsesApi.create(newHorseData);
} catch (error) {
  // Will get 403 error if user is only a viewer
  console.error("Permission denied:", error);
}
```

## Assigning Roles

### Option 1: Direct Database Update (Quickest)

In Supabase SQL Editor:

```sql
-- Find the user you want to promote
SELECT id, name, email, role FROM public.users;

-- Update their role
UPDATE public.users 
SET role = 'administrator' 
WHERE email = 'admin@example.com';

-- Create 4 editors
UPDATE public.users 
SET role = 'editor' 
WHERE email IN (
  'editor1@example.com',
  'editor2@example.com',
  'editor3@example.com',
  'editor4@example.com'
);
```

### Option 2: Via Admin API (Recommended for Production)

Create an admin interface that calls:

```tsx
import { usersApi } from '@/lib/api';

// Admin component to manage users
async function promoteToEditor(userId: number) {
  await usersApi.update(userId, { role: UserRole.editor });
}

async function promoteToAdmin(userId: number) {
  await usersApi.update(userId, { role: UserRole.administrator });
}
```

## Security Model

### Defense in Depth

This implementation provides multiple layers of security:

1. **Database RLS**: Supabase enforces permissions at the database level
2. **Backend Middleware**: Express routes verify JWT tokens and check roles
3. **Frontend UI**: Components hide/show features based on user role

Even if someone bypasses the frontend, they cannot bypass database or backend security.

### Token Flow

1. User logs in → Supabase Auth creates session with JWT token
2. Frontend stores token in AsyncStorage (mobile) or localStorage (web)
3. Every API request includes: `Authorization: Bearer <token>`
4. Backend verifies token with Supabase
5. Backend fetches user role from database
6. Backend checks if role has permission for requested operation
7. Database RLS provides final enforcement

## Testing the System

### 1. Test as Viewer

Sign up a new account (defaults to viewer):
- ✅ Should see all horses and data
- ❌ Create/edit buttons should be hidden (or show error if clicked)
- ❌ DELETE operations should fail

### 2. Test as Editor

Promote a user to editor role, then:
- ✅ Should see all data
- ✅ Should be able to create new horses
- ✅ Should be able to edit existing horses
- ❌ Should NOT be able to delete
- ❌ Should NOT be able to access user management

### 3. Test as Administrator

Promote a user to administrator, then:
- ✅ Full access to all operations
- ✅ Can delete horses and records
- ✅ Can view and edit other users' roles
- ✅ Can promote/demote users

## Quick Setup Checklist

- [ ] Run migration script in Supabase SQL Editor
- [ ] Verify trigger is working (sign up a test user, check public.users table)
- [ ] Restart backend server
- [ ] Test frontend loads without errors
- [ ] Promote yourself to administrator
- [ ] Promote 4 users to editor
- [ ] Test creating/editing as editor
- [ ] Test deleting as admin
- [ ] Test that viewer cannot edit/delete

## Troubleshooting

### "User profile not found" error
- The user signed up but no profile was created in public.users
- Check if trigger is installed: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Manually create profile: `INSERT INTO public.users (auth_user_id, email, name, role) VALUES ('<uuid>', 'user@example.com', 'Username', 'viewer');`

### "Invalid or expired token" error
- User needs to log out and log back in
- Check if Supabase URL and keys are correctly set in .env files

### RLS policy denying access
- Check user role: `SELECT role FROM public.users WHERE email = 'user@example.com';`
- Verify RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'horses';`

### Frontend can't fetch user role
- Check browser console/React Native debugger for API errors
- Verify backend is running and accessible
- Check that Authorization header is being sent

## Next Steps

Consider implementing:

1. **Admin Dashboard**: Create a UI for administrators to manage user roles
2. **Audit Logging**: Log all role changes and administrative actions
3. **Email Notifications**: Notify users when their role changes
4. **Granular Permissions**: Add more specific permissions beyond the 3 roles
5. **Temporary Access**: Allow admins to grant temporary editor access that expires
6. **2FA for Admins**: Require two-factor authentication for administrator accounts

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React Native)               │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ UserContext  │  │   API Client    │  │   Components   │ │
│  │ (Role Info)  │◄─┤  (Auth Token)   │◄─┤ (Conditional   │ │
│  └──────────────┘  └─────────────────┘  │    Rendering)  │ │
│                             │            └────────────────┘ │
└─────────────────────────────┼────────────────────────────────┘
                              │ JWT Token in Header
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Express)                        │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ Auth Middleware│  │  Role Middleware │  │   Routes    │ │
│  │ (Verify JWT)   ├─►│  (Check Perms)   ├─►│  (CRUD)     │ │
│  └────────────────┘  └──────────────────┘  └─────────────┘ │
│                             │                       │        │
└─────────────────────────────┼───────────────────────┼────────┘
                              │                       │
                              ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  auth.users  │  │  public.users   │  │  RLS Policies  │ │
│  │  (Sessions)  │  │  (Roles)        │  │  (Final Check) │ │
│  └──────────────┘  └─────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all files are updated correctly
3. Check backend logs for authentication errors
4. Inspect network requests to see if tokens are being sent
5. Verify database policies are active

Remember: Security is multi-layered. Even if one layer fails, the others provide protection.
