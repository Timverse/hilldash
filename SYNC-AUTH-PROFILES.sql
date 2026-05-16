-- ============================================
-- SYNC AUTH USERS TO PROFILES
-- Creates profile entries for auth users and makes you owner
-- ============================================

-- Step 1: Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Show all auth users
SELECT 'Auth Users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Step 3: Create profiles for all auth users that don't have one
INSERT INTO profiles (id, email, role, is_active, created_at)
SELECT 
  u.id,
  u.email,
  'customer' as role,
  true as is_active,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Show all profiles
SELECT 'Profiles after sync:' as info;
SELECT id, email, role, full_name FROM profiles ORDER BY created_at;

-- Step 5: Make the first user (you) an owner
-- This updates the FIRST auth user to be owner
UPDATE profiles 
SET role = 'owner', full_name = 'Eddie'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- Step 6: Verify
SELECT '========== YOUR PROFILE ==========' as status;
SELECT id, email, role, full_name, is_active 
FROM profiles 
WHERE id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- Step 7: Keep RLS disabled for development
SELECT '========== SETUP COMPLETE ==========' as status;
SELECT 'RLS is DISABLED for easier development' as note;
SELECT 'You can now access the admin dashboard' as next_step;
SELECT 'Restart your dev server: npm run dev' as action;
