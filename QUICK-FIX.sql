-- ============================================
-- HILLDASH QUICK FIX - Run this ONE script
-- ============================================
-- This will fix all product creation issues

-- 1. Disable RLS for development (quick fix)
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 2. Create warehouse if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'Jowai Central Hub') THEN
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
  END IF;
END $$;

-- 3. Make sure warehouse is active
UPDATE warehouses SET is_active = true WHERE name = 'Jowai Central Hub';

-- 4. Create categories (with conflict handling)
DO $$
BEGIN
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
END $$;

-- 5. Make product-images bucket public (if it exists)
UPDATE storage.buckets SET public = true WHERE name = 'product-images';

-- 6. Verify everything is set up
SELECT '✅ VERIFICATION RESULTS:' as status;
SELECT 'Active Warehouses:' as item, COUNT(*) as count FROM warehouses WHERE is_active = true;
SELECT 'Total Categories:' as item, COUNT(*) as count FROM categories;
SELECT 'Total Products:' as item, COUNT(*) as count FROM products;

-- Show warehouse details
SELECT 'Warehouse Details:' as info, id, name, is_active FROM warehouses;

-- Show categories
SELECT 'Categories:' as info, id, name FROM categories ORDER BY name;

-- Done! Now restart your dev server and try adding a product.
