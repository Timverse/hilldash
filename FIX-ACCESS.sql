-- ============================================
-- EMERGENCY FIX - Restore Access
-- ============================================

-- Step 1: Temporarily disable RLS to restore access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouse_assignments DISABLE ROW LEVEL SECURITY;

-- Step 2: Check if profile exists
SELECT 'Checking profiles:' as info;
SELECT id, email, role FROM profiles;

-- Step 3: Make yourself owner (use your actual ID)
UPDATE profiles 
SET role = 'owner', full_name = 'Eddie' 
WHERE id = '61c3fb2f-72a6-4d1f-bcc5-6f554e7759cb';

-- Step 4: Verify the update
SELECT 'After update:' as info;
SELECT id, email, role, full_name FROM profiles WHERE id = '61c3fb2f-72a6-4d1f-bcc5-6f554e7759cb';

-- Step 5: Re-enable RLS (optional - can leave disabled for development)
-- Uncomment these if you want RLS enabled:
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouse_assignments ENABLE ROW LEVEL SECURITY;
*/

SELECT '========== ACCESS RESTORED ==========' as status;
SELECT 'RLS is now DISABLED for development' as note;
SELECT 'You can now access the admin dashboard' as next_step;
