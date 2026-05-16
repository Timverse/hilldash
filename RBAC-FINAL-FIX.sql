-- ============================================
-- RBAC SCHEMA - HANDLES EXISTING DATA
-- ============================================

-- Step 1: Check current state
SELECT 'Current profiles table structure:' as info;
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Check existing role values
SELECT 'Current role values in profiles:' as info;
SELECT DISTINCT role, COUNT(*) as count 
FROM profiles 
GROUP BY role;

-- Step 3: Create user_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'superadmin', 'warehouse_admin', 'customer');
    RAISE NOTICE 'Created user_role enum';
  ELSE
    RAISE NOTICE 'user_role enum already exists';
  END IF;
END $$;

-- Step 4: Clean up existing role data
DO $$
DECLARE
  role_column_type TEXT;
BEGIN
  -- Get current role column type
  SELECT data_type INTO role_column_type
  FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'role';

  IF role_column_type IS NOT NULL THEN
    -- Update any invalid role values to 'customer'
    UPDATE profiles 
    SET role = 'customer' 
    WHERE role IS NULL 
       OR role NOT IN ('owner', 'superadmin', 'warehouse_admin', 'customer');
    
    RAISE NOTICE 'Cleaned up invalid role values';
    
    -- If role is TEXT, convert to enum
    IF role_column_type IN ('text', 'character varying') THEN
      -- Drop any constraints on the role column
      ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
      
      -- Convert to enum
      ALTER TABLE profiles 
        ALTER COLUMN role TYPE user_role 
        USING role::user_role;
      
      -- Set default
      ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'customer';
      
      RAISE NOTICE 'Converted role column to user_role enum';
    END IF;
  ELSE
    -- Role column doesn't exist, create it
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'customer';
    RAISE NOTICE 'Created role column as user_role enum';
  END IF;
END $$;

-- Step 5: Add other profile columns if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Step 6: Create user_warehouse_assignments table
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

-- Step 7: Create audit_logs table
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

-- Step 8: Create helper functions
CREATE OR REPLACE FUNCTION user_has_warehouse_access(
  p_user_id UUID,
  p_warehouse_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
  v_has_access BOOLEAN;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  
  IF v_role = 'owner' THEN
    RETURN TRUE;
  END IF;
  
  IF v_role = 'superadmin' THEN
    SELECT EXISTS (
      SELECT 1 FROM user_warehouse_assignments
      WHERE user_id = p_user_id 
        AND warehouse_id = p_warehouse_id
        AND is_active = true
    ) INTO v_has_access;
    RETURN v_has_access;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_warehouse_ids(p_user_id UUID)
RETURNS TABLE(warehouse_id UUID) AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  
  IF v_role = 'owner' THEN
    RETURN QUERY SELECT id FROM warehouses WHERE is_active = true;
  ELSIF v_role = 'superadmin' THEN
    RETURN QUERY 
      SELECT uwa.warehouse_id 
      FROM user_warehouse_assignments uwa
      WHERE uwa.user_id = p_user_id AND uwa.is_active = true;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouse_assignments ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can read all profiles" ON profiles;
CREATE POLICY "Owners can read all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Owners can manage profiles" ON profiles;
CREATE POLICY "Owners can manage profiles"
  ON profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- Warehouses
DROP POLICY IF EXISTS "Public can read active warehouses" ON warehouses;
CREATE POLICY "Public can read active warehouses"
  ON warehouses FOR SELECT TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage warehouses" ON warehouses;
CREATE POLICY "Owners can manage warehouses"
  ON warehouses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Superadmins can read assigned warehouses" ON warehouses;
CREATE POLICY "Superadmins can read assigned warehouses"
  ON warehouses FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    AND id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = auth.uid() AND is_active = true)
  );

-- Products
DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products"
  ON products FOR SELECT TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage products" ON products;
CREATE POLICY "Owners can manage products"
  ON products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Superadmins can read assigned products" ON products;
CREATE POLICY "Superadmins can read assigned products"
  ON products FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    AND warehouse_id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Superadmins can insert products" ON products;
CREATE POLICY "Superadmins can insert products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    AND warehouse_id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Superadmins can update products" ON products;
CREATE POLICY "Superadmins can update products"
  ON products FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    AND warehouse_id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Superadmins can delete products" ON products;
CREATE POLICY "Superadmins can delete products"
  ON products FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    AND warehouse_id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = auth.uid() AND is_active = true)
  );

-- Orders
DROP POLICY IF EXISTS "Public can create orders" ON orders;
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read orders" ON orders;
CREATE POLICY "Public can read orders"
  ON orders FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Owners can manage orders" ON orders;
CREATE POLICY "Owners can manage orders"
  ON orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Superadmins can read assigned orders" ON orders;
CREATE POLICY "Superadmins can read assigned orders"
  ON orders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    AND warehouse_id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Superadmins can update assigned orders" ON orders;
CREATE POLICY "Superadmins can update assigned orders"
  ON orders FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    AND warehouse_id IN (SELECT warehouse_id FROM user_warehouse_assignments WHERE user_id = auth.uid() AND is_active = true)
  );

-- Order Items
DROP POLICY IF EXISTS "Public can read order items" ON order_items;
CREATE POLICY "Public can read order items"
  ON order_items FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Public can create order items" ON order_items;
CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can manage order items" ON order_items;
CREATE POLICY "Owners can manage order items"
  ON order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- User Warehouse Assignments
DROP POLICY IF EXISTS "Owners can manage assignments" ON user_warehouse_assignments;
CREATE POLICY "Owners can manage assignments"
  ON user_warehouse_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Superadmins can read own assignments" ON user_warehouse_assignments;
CREATE POLICY "Superadmins can read own assignments"
  ON user_warehouse_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Verification
SELECT '========== SETUP COMPLETE ==========' as status;

SELECT 'Final profiles structure:' as info;
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT 'Role values after cleanup:' as info;
SELECT role::text, COUNT(*) as count 
FROM profiles 
GROUP BY role;

SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'user_warehouse_assignments', 'audit_logs')
ORDER BY table_name;

SELECT 'Functions created:' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('user_has_warehouse_access', 'get_user_warehouse_ids');

SELECT '========== NEXT STEP ==========' as info;
SELECT 'Make yourself owner by running:' as instruction;
SELECT 'UPDATE profiles SET role = ''owner'', full_name = ''Your Name'' WHERE email = ''your-email@example.com'';' as command;
