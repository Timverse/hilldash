-- ============================================
-- COMPLETE DATABASE SCHEMA FOR HILLDASH
-- ============================================
-- Run this to create/fix all tables

-- 1. PROFILES TABLE (for user authentication)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'warehouse_admin', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WAREHOUSES TABLE
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  radius_km INTEGER NOT NULL DEFAULT 10,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS TABLE (with all required columns)
CREATE TABLE IF NOT EXISTS products (
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

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled')),
  warehouse_id UUID REFERENCES warehouses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add missing columns to existing tables (if they exist)
-- This will fail silently if columns already exist

DO $$ 
BEGIN
  -- Add category_id to products if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  -- Add warehouse_id to products if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE products ADD COLUMN warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE;
  END IF;

  -- Add description to products if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE products ADD COLUMN description TEXT;
  END IF;

  -- Add image_url to products if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
  END IF;

  -- Add is_active to products if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add stock to products if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock'
  ) THEN
    ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
  END IF;
END $$;

-- 8. Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 9. Disable RLS for development
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 10. Insert initial data
-- Warehouse
INSERT INTO warehouses (name, address, lat, lng, radius_km, phone, is_active)
VALUES (
  'Jowai Central Hub',
  'Jowai, West Jaintia Hills, Meghalaya',
  25.4508,
  92.1868,
  10,
  '+91 XXXXXXXXXX',
  true
)
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (name) VALUES ('Vegetables') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Fruits') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Dairy & Eggs') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Meat & Seafood') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Rice & Grains') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Spices & Condiments') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Snacks & Beverages') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Bakery') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Personal Care') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Household Items') ON CONFLICT (name) DO NOTHING;

-- 11. Verify schema
SELECT 'Tables Created:' as status;

SELECT 'Warehouses:' as table_name, COUNT(*) as count FROM warehouses;
SELECT 'Categories:' as table_name, COUNT(*) as count FROM categories;
SELECT 'Products:' as table_name, COUNT(*) as count FROM products;

SELECT 'Product Columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

SELECT 'Warehouse Details:' as info;
SELECT id, name, is_active FROM warehouses;

SELECT 'Categories:' as info;
SELECT id, name FROM categories ORDER BY name;
