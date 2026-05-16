-- ============================================
-- CLEAN SLATE - Delete Everything
-- WARNING: This will delete ALL data!
-- ============================================

-- Step 1: Drop all policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Step 2: Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_warehouse_assignments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Drop all functions
DROP FUNCTION IF EXISTS user_has_warehouse_access(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_warehouse_ids(UUID) CASCADE;

-- Step 4: Drop all enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Step 5: Note about storage bucket
-- Storage bucket cannot be deleted via SQL
-- If you need to delete it:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Delete 'product-images' bucket manually
-- Or leave it - the setup script will reuse it

-- Verification
SELECT '========== CLEAN SLATE COMPLETE ==========' as status;

SELECT 'Remaining tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Remaining enums:' as info;
SELECT typname FROM pg_type 
WHERE typtype = 'e' 
  AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT '========== READY FOR FRESH START ==========' as next_step;
SELECT 'Now run: 01-COMPLETE-SETUP.sql' as instruction;
