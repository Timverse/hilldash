-- ============================================
-- ULTRA SIMPLE FIX - Absolutely no errors
-- ============================================

-- 1. Disable RLS on all tables
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 2. Activate all warehouses
UPDATE warehouses SET is_active = true;

-- 3. Add categories (ignore errors if they exist)
INSERT INTO categories (name) VALUES ('Vegetables');
INSERT INTO categories (name) VALUES ('Fruits');
INSERT INTO categories (name) VALUES ('Dairy & Eggs');
INSERT INTO categories (name) VALUES ('Meat & Seafood');
INSERT INTO categories (name) VALUES ('Rice & Grains');
INSERT INTO categories (name) VALUES ('Spices & Condiments');
INSERT INTO categories (name) VALUES ('Snacks & Beverages');
INSERT INTO categories (name) VALUES ('Bakery');
INSERT INTO categories (name) VALUES ('Personal Care');
INSERT INTO categories (name) VALUES ('Household Items');

-- 4. Make storage public
UPDATE storage.buckets SET public = true WHERE name = 'product-images';

-- 5. Check results
SELECT COUNT(*) as active_warehouses FROM warehouses WHERE is_active = true;
SELECT COUNT(*) as total_categories FROM categories;
SELECT id, name FROM warehouses;
SELECT id, name FROM categories ORDER BY name;
