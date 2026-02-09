-- Post-Migration Validation Checks
-- Run these queries in Supabase SQL Editor to validate the migration

-- 1. Check row counts (should show existing data preserved)
SELECT 'users' as table_name, count(*) as row_count FROM public.users
UNION ALL
SELECT 'horses', count(*) FROM public.horses
UNION ALL
SELECT 'medical_records', count(*) FROM public.medical_records
UNION ALL
SELECT 'treatments', count(*) FROM public.treatments
UNION ALL
SELECT 'action_taken', count(*) FROM public.action_taken
UNION ALL
SELECT 'daily_observations', count(*) FROM public.daily_observations
UNION ALL
SELECT 'audit_trail', count(*) FROM public.audit_trail;

-- 2. Check that user_role enum exists
SELECT enum_range(null::public.user_role) as valid_roles;

-- 3. Check RLS is enabled on all key tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('users', 'horses', 'medical_records', 'treatments', 'action_taken', 'daily_observations', 'audit_trail')
ORDER BY tablename;

-- 4. Count active policies per table
SELECT 
  schemaname,
  tablename,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 5. Check the trigger exists
SELECT trigger_schema, trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name = 'on_auth_user_created';

-- 6. Check key columns exist on users
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY column_name;

-- 7. Check key constraints
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_name LIKE 'users_%'
ORDER BY table_name, constraint_name;

-- 8. Sample user roles (if you have users)
SELECT id, email, role, active_user FROM public.users LIMIT 5;
