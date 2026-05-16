-- Database Setup Verification Script
-- Run this in your Supabase SQL Editor to diagnose issues

-- 1. Check if warehouse exists
SELECT 'Warehouses:' as check_type, id, name, is_active 
FROM warehouses;

-- 2. Check if categories exist
SELECT 'Categories:' as check_type, id, name 
FROM categories;

-- 3. Check if products table exists and is accessible
SELECT 'Products:' as check_type, COUNT(*) as total_products 
FROM products;

-- 4. Check RLS policies on products table
SELECT 
  'RLS Policies:' as check_type,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'products';

-- 5. Check if storage bucket exists
SELECT 
  'Storage Buckets:' as check_type,
  id, 
  name, 
  public 
FROM storage.buckets 
WHERE name = 'product-images';

-- 6. Test if you can insert a product (this will fail if RLS blocks it)
-- Uncomment the lines below to test:
-- INSERT INTO products (name, category_id, price, stock, warehouse_id, is_active)
-- SELECT 
--   'Test Product',
--   (SELECT id FROM categories LIMIT 1),
--   99.99,
--   10,
--   (SELECT id FROM warehouses LIMIT 1),
--   true
-- RETURNING id, name;
