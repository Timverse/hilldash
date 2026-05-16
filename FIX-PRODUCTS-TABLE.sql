-- ============================================
-- FIX PRODUCTS TABLE - Add Missing Columns
-- ============================================

-- First, let's see what columns exist
SELECT 'Current Products Table Columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Add missing columns one by one
-- (These will fail if columns already exist, which is fine)

-- Add category_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE products ADD CONSTRAINT fk_products_category 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add warehouse_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse_id UUID;
ALTER TABLE products ADD CONSTRAINT fk_products_warehouse 
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;

-- Add description
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

-- Add image_url
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add is_active
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add stock
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Add timestamps
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Disable RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 'Updated Products Table Columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Show counts
SELECT 'Active Warehouses:' as metric, COUNT(*) FROM warehouses WHERE is_active = true;
SELECT 'Total Categories:' as metric, COUNT(*) FROM categories;
SELECT 'Total Products:' as metric, COUNT(*) FROM products;
