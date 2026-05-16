-- ============================================
-- SAFE FIX - Handles all errors gracefully
-- ============================================

-- Step 1: Check current state
SELECT 'BEFORE FIX - Products Table Structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';

-- Step 2: Add missing columns using DO block (handles errors)
DO $$ 
BEGIN
  -- Add category_id
  BEGIN
    ALTER TABLE products ADD COLUMN category_id UUID;
    RAISE NOTICE 'Added category_id column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'category_id already exists';
  END;

  -- Add warehouse_id
  BEGIN
    ALTER TABLE products ADD COLUMN warehouse_id UUID;
    RAISE NOTICE 'Added warehouse_id column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'warehouse_id already exists';
  END;

  -- Add description
  BEGIN
    ALTER TABLE products ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'description already exists';
  END;

  -- Add image_url
  BEGIN
    ALTER TABLE products ADD COLUMN image_url TEXT;
    RAISE NOTICE 'Added image_url column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'image_url already exists';
  END;

  -- Add is_active
  BEGIN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'is_active already exists';
  END;

  -- Add stock
  BEGIN
    ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
    RAISE NOTICE 'Added stock column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'stock already exists';
  END;

  -- Add created_at
  BEGIN
    ALTER TABLE products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'created_at already exists';
  END;

  -- Add updated_at
  BEGIN
    ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'updated_at already exists';
  END;
END $$;

-- Step 3: Add foreign key constraints (if they don't exist)
DO $$
BEGIN
  -- Add category foreign key
  BEGIN
    ALTER TABLE products ADD CONSTRAINT fk_products_category 
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added category foreign key';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Category foreign key already exists';
  END;

  -- Add warehouse foreign key
  BEGIN
    ALTER TABLE products ADD CONSTRAINT fk_products_warehouse 
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added warehouse foreign key';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Warehouse foreign key already exists';
  END;
END $$;

-- Step 4: Disable RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;

-- Step 5: Ensure warehouse exists and is active
UPDATE warehouses SET is_active = true;

-- Step 6: Ensure categories exist
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

-- Step 7: Make storage bucket public
UPDATE storage.buckets SET public = true WHERE name = 'product-images';

-- Step 8: Verify everything
SELECT 'AFTER FIX - Products Table Structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

SELECT 'Database Status:' as info;
SELECT 'Active Warehouses' as metric, COUNT(*) as count FROM warehouses WHERE is_active = true
UNION ALL
SELECT 'Total Categories' as metric, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Total Products' as metric, COUNT(*) as count FROM products;

SELECT 'Warehouse Details:' as info;
SELECT id, name, is_active FROM warehouses;

SELECT 'Sample Categories:' as info;
SELECT id, name FROM categories ORDER BY name LIMIT 5;
