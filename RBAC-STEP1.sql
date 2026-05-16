-- ============================================
-- RBAC SETUP - STEP 1: Create Enum and Add Values
-- Run this first, then run RBAC-STEP2.sql
-- ============================================

-- Create user_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'superadmin', 'warehouse_admin', 'customer');
    RAISE NOTICE 'Created user_role enum with all values';
  ELSE
    RAISE NOTICE 'user_role enum already exists';
  END IF;
END $$;

-- Add missing enum values (must be done outside transaction)
-- Run each ALTER TYPE separately if needed

-- Check what values exist
SELECT 'Current user_role enum values:' as info;
SELECT enumlabel as value
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Add 'owner' if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'owner'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'owner';
    RAISE NOTICE 'Added owner to enum';
  END IF;
END $$;

-- Add 'superadmin' if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'superadmin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'superadmin';
    RAISE NOTICE 'Added superadmin to enum';
  END IF;
END $$;

-- Add 'warehouse_admin' if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'warehouse_admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'warehouse_admin';
    RAISE NOTICE 'Added warehouse_admin to enum';
  END IF;
END $$;

-- Add 'customer' if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'customer'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'customer';
    RAISE NOTICE 'Added customer to enum';
  END IF;
END $$;

-- Verify
SELECT '========== STEP 1 COMPLETE ==========' as status;
SELECT 'Final user_role enum values:' as info;
SELECT enumlabel as value
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

SELECT '========== NEXT STEP ==========' as instruction;
SELECT 'Now run RBAC-STEP2.sql to complete the setup' as next_action;
