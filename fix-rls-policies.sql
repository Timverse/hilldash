-- Fix RLS Policies for HillDash
-- Run this if you're having permission issues

-- ============================================
-- OPTION 1: Disable RLS (Quick Fix for Development)
-- ============================================
-- WARNING: Only use this in development! 
-- In production, you need proper RLS policies

ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 2: Enable RLS with Proper Policies (Production)
-- ============================================
-- Uncomment this section if you want proper security

/*
-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow public read access to warehouses" ON warehouses;
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow admin full access to warehouses" ON warehouses;
DROP POLICY IF EXISTS "Allow admin full access to categories" ON categories;
DROP POLICY IF EXISTS "Allow admin full access to products" ON products;

-- Warehouses: Public can read, admins can do everything
CREATE POLICY "Allow public read access to warehouses"
  ON warehouses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to warehouses"
  ON warehouses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'warehouse_admin')
    )
  );

-- Categories: Public can read, admins can modify
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'warehouse_admin')
    )
  );

-- Products: Public can read active products, admins can do everything
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow admin full access to products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'warehouse_admin')
    )
  );

-- Orders: Users can read their own orders, admins can see all
CREATE POLICY "Users can read their own orders"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'warehouse_admin')
    )
  );

-- Order Items: Similar to orders
CREATE POLICY "Public can read order items"
  ON order_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'warehouse_admin')
    )
  );
*/

-- ============================================
-- Storage Bucket Policies
-- ============================================

-- Make product-images bucket public for reading
UPDATE storage.buckets 
SET public = true 
WHERE name = 'product-images';

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow public to read images
CREATE POLICY "Allow public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Verify policies were created
SELECT 'Storage Policies:' as info, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%product%';
