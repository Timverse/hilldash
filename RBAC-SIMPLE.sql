-- ============================================
-- RBAC SCHEMA - SIMPLE VERSION
-- Handles case where role is already an enum
-- ============================================

-- Step 1: Check current state
SELECT 'Current profiles table:' as info;
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Step 2: Check if user_role enum exists and what values it has
SELECT 'Current user_role enum values:' as info;
SELECT enumlabel as value
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Step 3: If enum doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'superadmin', 'warehouse_admin', 'customer');
    RAISE NOTICE 'Created user_role enum';
  END IF;
END $$;

-- Step 4: Add missing enum values if needed
DO $$
BEGIN
  -- Add 'owner' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'owner'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'owner';
    RAISE NOTICE 'Added owner to enum';
  END IF;

  -- Add 'superadmin' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'superadmin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'superadmin';
    RAISE NOTICE 'Added superadmin to enum';
  END IF;

  -- Add 'warehouse_admin' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'warehouse_admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'warehouse_admin';
    RAISE NOTICE 'Added warehouse_admin to enum';
  END IF;

  -- Add 'customer' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel = 'customer'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'customer';
    RAISE NOTICE 'Added customer to enum';
  END IF;
END $$;

-- Step 5: Handle role column
DO $$
DECLARE
  role_exists BOOLEAN;
  role_type TEXT;
BEGIN
  -- Check if role column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) INTO role_exists;

  IF NOT role_exists THEN
    -- Create role column as enum
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'customer';
    RAISE NOTICE 'Created role column';
  ELSE
    -- Get the type
    SELECT udt_name INTO role_type
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role';
    
    RAISE NOTICE 'Role column exists with type: %', role_type;
    
    -- If it's TEXT, convert to enum
    IF role_type IN ('text', 'varchar') THEN
      ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
      RAISE NOTICE 'Converted role from TEXT to enum';
    END IF;
  END IF;
END $$;

-- Step 6: Add other profile columns
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

-- Step 7: Create user_warehouse_assignments table
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

-- Step 8: Create audit_logs table
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

-- Step 9: Create helper functions
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

-- Step 10: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouse_assignments ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS Policies (simplified - just the essentials)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can read all profiles" ON profiles;
CREATE POLICY "Owners can read all profiles" ON profiles FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Owners can manage profiles" ON profiles;
CREATE POLICY "Owners can manage profiles" ON profiles FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Public can read active warehouses" ON warehouses;
CREATE POLICY "Public can read active warehouses" ON warehouses FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage warehouses" ON warehouses;
CREATE POLICY "Owners can manage warehouses" ON warehouses FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Public can read active products" ON products;
CREATE POLICY "Public can read active products" ON products FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage products" ON products;
CREATE POLICY "Owners can manage products" ON products FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Public can create orders" ON orders;
CREATE POLICY "Public can create orders" ON orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read orders" ON orders;
CREATE POLICY "Public can read orders" ON orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Owners can manage orders" ON orders;
CREATE POLICY "Owners can manage orders" ON orders FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Public can read order items" ON order_items;
CREATE POLICY "Public can read order items" ON order_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can create order items" ON order_items;
CREATE POLICY "Public can create order items" ON order_items FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can manage order items" ON order_items;
CREATE POLICY "Owners can manage order items" ON order_items FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Owners can manage assignments" ON user_warehouse_assignments;
CREATE POLICY "Owners can manage assignments" ON user_warehouse_assignments FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "Superadmins can read own assignments" ON user_warehouse_assignments;
CREATE POLICY "Superadmins can read own assignments" ON user_warehouse_assignments FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- Verification
SELECT '========== SETUP COMPLETE ==========' as status;

SELECT 'user_role enum values:' as info;
SELECT enumlabel as value
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'Tables created:' as info;
SELECT COUNT(*) as count FROM information_schema.tables 
WHERE table_name IN ('user_warehouse_assignments', 'audit_logs');

SELECT '========== MAKE YOURSELF OWNER ==========' as next_step;
SELECT 'Run this command (replace with your email):' as instruction;
SELECT 'UPDATE profiles SET role = ''owner'', full_name = ''Your Name'' WHERE email = ''your-email@example.com'';' as command;
