-- ============================================
-- COMPLETE RBAC DATABASE SCHEMA (FIXED)
-- Role-Based Access Control for Multi-Warehouse System
-- ============================================

-- ============================================
-- PART 1: CREATE ROLES ENUM
-- ============================================

-- Create role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'superadmin', 'warehouse_admin', 'customer');
    RAISE NOTICE 'Created user_role enum';
  ELSE
    RAISE NOTICE 'user_role enum already exists';
  END IF;
END $$;

-- ============================================
-- PART 2: UPDATE PROFILES TABLE
-- ============================================

-- First, check if profiles table exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if missing
DO $$
DECLARE
  role_column_type TEXT;
BEGIN
  -- Check if role column exists and its type
  SELECT data_type INTO role_column_type
  FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'role';

  -- If role column doesn't exist, add it as user_role enum
  IF role_column_type IS NULL THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'customer';
    RAISE NOTICE 'Added role column as user_role enum';
  -- If role exists but is TEXT, convert it to enum
  ELSIF role_column_type = 'text' OR role_column_type = 'character varying' THEN
    -- First, update any invalid values to 'customer'
    UPDATE profiles SET role = 'customer' 
    WHERE role NOT IN ('owner', 'superadmin', 'warehouse_admin', 'customer');
    
    -- Convert column to enum
    ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'customer';
    RAISE NOTICE 'Converted role column from TEXT to user_role enum';
  ELSE
    RAISE NOTICE 'Role column already has correct type';
  END IF;

  -- Add full_name if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
    RAISE NOTICE 'Added full_name column';
  END IF;

  -- Add phone if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column';
  END IF;

  -- Add is_active if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column';
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- ============================================
-- PART 3: USER-WAREHOUSE ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_warehouse_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_user_warehouse_user ON user_warehouse_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warehouse_warehouse ON user_warehouse_assignments(warehouse_id);

-- ============================================
-- PART 4: AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_warehouse ON audit_logs(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- PART 5: HELPER FUNCTIONS
-- ============================================

-- Function to check if user has access to a warehouse
CREATE OR REPLACE FUNCTION user_has_warehouse_access(
  p_user_id UUID,
  p_warehouse_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
  v_has_access BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  
  -- Owner has access to all warehouses
  IF v_role = 'owner' THEN
    RETURN TRUE;
  END IF;
  
  -- Superadmin: check if assigned to this warehouse
  IF v_role = 'superadmin' THEN
    SELECT EXISTS (
      SELECT 1 FROM user_warehouse_assignments
      WHERE user_id = p_user_id 
        AND warehouse_id = p_warehouse_id
        AND is_active = true
    ) INTO v_has_access;
    RETURN v_has_access;
  END IF;
  
  -- Other roles don't have warehouse access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible warehouse IDs
CREATE OR REPLACE FUNCTION get_user_warehouse_ids(p_user_id UUID)
RETURNS TABLE(warehouse_id UUID) AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  
  -- Owner gets all warehouses
  IF v_role = 'owner' THEN
    RETURN QUERY SELECT id FROM warehouses WHERE is_active = true;
  -- Superadmin gets assigned warehouses
  ELSIF v_role = 'superadmin' THEN
    RETURN QUERY 
      SELECT uwa.warehouse_id 
      FROM user_warehouse_assignments uwa
      WHERE uwa.user_id = p_user_id AND uwa.is_active = true;
  END IF;
  
  -- Other roles get nothing
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouse_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can read all profiles" ON profiles;
CREATE POLICY "Owners can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can manage profiles" ON profiles;
CREATE POLICY "Owners can manage profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- WAREHOUSES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public can read active warehouses" ON warehouses;
CREATE POLICY "Public can read active warehouses"
  ON warehouses FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage warehouses" ON warehouses;
CREATE POLICY "Owners can manage warehouses"
  ON warehouses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Superadmins can read assigned warehouses" ON warehouses;
CREATE POLICY "Superadmins can read assigned warehouses"
  ON warehouses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
    AND id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage products" ON products;
CREATE POLICY "Owners can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Superadmins can read assigned products" ON products;
CREATE POLICY "Superadmins can read assigned products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
    AND warehouse_id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Superadmins can insert products" ON products;
CREATE POLICY "Superadmins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
    AND warehouse_id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Superadmins can update products" ON products;
CREATE POLICY "Superadmins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
    AND warehouse_id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Superadmins can delete products" ON products;
CREATE POLICY "Superadmins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
    AND warehouse_id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- ORDERS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public can create orders" ON orders;
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read orders" ON orders;
CREATE POLICY "Public can read orders"
  ON orders FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Owners can manage orders" ON orders;
CREATE POLICY "Owners can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Superadmins can read assigned orders" ON orders;
CREATE POLICY "Superadmins can read assigned orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
    AND warehouse_id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Superadmins can update assigned orders" ON orders;
CREATE POLICY "Superadmins can update assigned orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'superadmin'
    )
    AND warehouse_id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- ORDER_ITEMS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public can read order items" ON order_items;
CREATE POLICY "Public can read order items"
  ON order_items FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Public can create order items" ON order_items;
CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can manage order items" ON order_items;
CREATE POLICY "Owners can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- USER_WAREHOUSE_ASSIGNMENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Owners can manage assignments" ON user_warehouse_assignments;
CREATE POLICY "Owners can manage assignments"
  ON user_warehouse_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Superadmins can read own assignments" ON user_warehouse_assignments;
CREATE POLICY "Superadmins can read own assignments"
  ON user_warehouse_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

SELECT '========== RBAC SCHEMA SETUP COMPLETE ==========' as status;

SELECT 'Profiles Table Structure:' as info;
SELECT column_name, data_type, udt_name FROM information_schema.columns 
WHERE table_name = 'profiles' ORDER BY ordinal_position;

SELECT 'User-Warehouse Assignments Table:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_warehouse_assignments' ORDER BY ordinal_position;

SELECT 'Audit Logs Table:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'audit_logs' ORDER BY ordinal_position;

SELECT 'RLS Policies on Products:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products' ORDER BY policyname;

SELECT 'RLS Policies on Orders:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'orders' ORDER BY policyname;

SELECT 'Helper Functions:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('user_has_warehouse_access', 'get_user_warehouse_ids');

SELECT '========== NEXT STEPS ==========' as info;
SELECT 'Run this to make yourself owner:' as step;
SELECT 'UPDATE profiles SET role = ''owner'', full_name = ''Your Name'' WHERE email = ''your-email@example.com'';' as sql_command;
