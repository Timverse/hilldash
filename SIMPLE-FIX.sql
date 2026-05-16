-- ============================================
-- SIMPLE FIX - No fancy syntax, just works
-- ============================================

-- Step 1: Disable RLS
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Step 2: Check what exists
SELECT 'Current State:' as info;
SELECT 'Warehouses:' as table_name, COUNT(*) FROM warehouses;
SELECT 'Categories:' as table_name, COUNT(*) FROM categories;
SELECT 'Products:' as table_name, COUNT(*) FROM products;

-- Step 3: Make warehouse active (if it exists)
UPDATE warehouses SET is_active = true;

-- Step 4: Create categories one by one
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

-- Step 5: Make storage bucket public
UPDATE storage.buckets SET public = true WHERE name = 'product-images';

-- Step 6: Show final state
SELECT 'Final State:' as info;
SELECT 'Active Warehouses:' as metric, COUNT(*) FROM warehouses WHERE is_active = true;
SELECT 'Total Categories:' as metric, COUNT(*) FROM categories;

-- Step 7: Show details
SELECT 'Warehouse:' as type, id, name, is_active FROM warehouses;
SELECT 'Categories:' as type, id, name FROM categories ORDER BY name LIMIT 5;
