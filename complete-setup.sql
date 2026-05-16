-- Complete HillDash Database Setup
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Verify/Create Warehouse
-- ============================================

-- Check if warehouse exists
SELECT 'Existing Warehouses:' as info, id, name, is_active FROM warehouses;

-- If no warehouse exists, create the Jowai Central Hub
-- (This will fail if it already exists, which is fine)
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
ON CONFLICT (id) DO NOTHING;

-- Verify warehouse was created/exists
SELECT 'After Insert:' as info, id, name, is_active FROM warehouses;

-- ============================================
-- STEP 2: Create Categories
-- ============================================

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
  ('Household Items')
ON CONFLICT (name) DO NOTHING;

-- Verify categories
SELECT 'Categories Created:' as info, id, name FROM categories ORDER BY name;

-- ============================================
-- STEP 3: Check Storage Bucket
-- ============================================

-- Verify product-images bucket exists
SELECT 'Storage Buckets:' as info, id, name, public FROM storage.buckets WHERE name = 'product-images';

-- If bucket doesn't exist, create it (run this separately if needed):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 4: Check RLS Policies
-- ============================================

-- Check if RLS is enabled on products table
SELECT 
  'RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'products';

-- View existing policies
SELECT 
  'Existing Policies:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'products';

-- ============================================
-- STEP 5: Test Product Insert (Optional)
-- ============================================

-- Uncomment to test if you can insert a product:
/*
INSERT INTO products (name, category_id, price, stock, warehouse_id, is_active)
SELECT 
  'Test Product - Delete Me',
  (SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1),
  49.99,
  10,
  (SELECT id FROM warehouses WHERE is_active = true LIMIT 1),
  true
RETURNING id, name, price, warehouse_id;
*/

-- ============================================
-- FINAL VERIFICATION
-- ============================================

SELECT 'SUMMARY:' as info;
SELECT 'Total Warehouses:' as metric, COUNT(*) as count FROM warehouses;
SELECT 'Active Warehouses:' as metric, COUNT(*) as count FROM warehouses WHERE is_active = true;
SELECT 'Total Categories:' as metric, COUNT(*) as count FROM categories;
SELECT 'Total Products:' as metric, COUNT(*) as count FROM products;
