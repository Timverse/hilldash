-- ============================================
-- COMPLETE HILLDASH DATABASE SETUP
-- Fresh start with RBAC, all tables, and proper schema
-- ============================================

-- ============================================
-- PART 1: CREATE ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('owner', 'superadmin', 'warehouse_admin', 'customer');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled');

-- ============================================
-- PART 2: CREATE TABLES
-- ============================================

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'customer' NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  radius_km INTEGER NOT NULL DEFAULT 10,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10, 7),
  delivery_lng DECIMAL(10, 7),
  distance_km DECIMAL(10, 2),
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status order_status DEFAULT 'pending',
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Warehouse Assignments (for RBAC)
CREATE TABLE user_warehouse_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, warehouse_id)
);

-- Audit Logs
CREATE TABLE audit_logs (
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

-- ============================================
-- PART 3: CREATE INDEXES
-- ============================================

CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

CREATE INDEX idx_orders_warehouse ON orders(warehouse_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_user_warehouse_user ON user_warehouse_assignments(user_id);
CREATE INDEX idx_user_warehouse_warehouse ON user_warehouse_assignments(warehouse_id);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_warehouse ON audit_logs(warehouse_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- PART 4: CREATE STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- PART 5: CREATE HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION user_has_warehouse_access(
  p_user_id UUID,
  p_warehouse_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
  v_has_access BOOLEAN;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  IF v_role = 'owner' THEN RETURN TRUE; END IF;
  IF v_role = 'superadmin' THEN
    SELECT EXISTS (
      SELECT 1 FROM user_warehouse_assignments
      WHERE user_id = p_user_id AND warehouse_id = p_warehouse_id AND is_active = true
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
    RETURN QUERY SELECT uwa.warehouse_id FROM user_warehouse_assignments uwa
    WHERE uwa.user_id = p_user_id AND uwa.is_active = true;
  END IF;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: SEED DATA
-- ============================================

-- Create Jowai Central Hub
INSERT INTO warehouses (name, address, lat, lng, radius_km, phone, is_active)
VALUES (
  'Jowai Central Hub',
  'Jowai, West Jaintia Hills, Meghalaya',
  25.4508,
  92.1868,
  10,
  '+91 XXXXXXXXXX',
  true
);

-- Create Categories
INSERT INTO categories (name) VALUES
  ('Vegetables'),
  ('Fruits'),
  ('Dairy & Eggs'),
  ('Meat & Seafood'),
  ('Rice & Grains'),
  ('Spices & Condiments'),
  ('Snacks & Beverages'),
  ('Bakery'),
  ('Personal Care'),
  ('Household Items');

-- ============================================
-- PART 7: SYNC AUTH USERS TO PROFILES
-- ============================================

-- Create profiles for all existing auth users
INSERT INTO profiles (id, email, role, is_active, created_at)
SELECT 
  u.id,
  u.email,
  'customer' as role,
  true as is_active,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Make the first user an owner
UPDATE profiles 
SET role = 'owner', full_name = 'Eddie'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- ============================================
-- PART 8: DISABLE RLS FOR DEVELOPMENT
-- ============================================
-- For production, you would enable RLS and create policies
-- For development, we keep it simple

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouse_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '========== SETUP COMPLETE ==========' as status;

SELECT 'Tables Created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Enums Created:' as info;
SELECT typname, array_agg(enumlabel ORDER BY enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
GROUP BY typname;

SELECT 'Warehouses:' as info;
SELECT id, name, is_active FROM warehouses;

SELECT 'Categories:' as info;
SELECT COUNT(*) as count FROM categories;

SELECT 'Your Profile:' as info;
SELECT id, email, role, full_name FROM profiles WHERE role = 'owner';

SELECT 'Storage Bucket:' as info;
SELECT id, name, public FROM storage.buckets WHERE name = 'product-images';

SELECT '========== NEXT STEPS ==========' as next;
SELECT '1. Restart your dev server: npm run dev' as step_1;
SELECT '2. Login with your account' as step_2;
SELECT '3. Access /dashboard - you are now the owner!' as step_3;
SELECT '4. Start adding products' as step_4;
