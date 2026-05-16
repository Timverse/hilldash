-- ============================================
-- FIX DUPLICATE FOREIGN KEY CONSTRAINTS
-- ============================================

-- Step 1: Check current foreign key constraints
SELECT 'Current Foreign Keys on products table:' as info;
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE conrelid = 'products'::regclass
  AND contype = 'f'
ORDER BY conname;

-- Step 2: Drop ALL foreign key constraints on products table
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN 
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'products'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE products DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
  END LOOP;
END $$;

-- Step 3: Recreate ONLY the necessary foreign key constraints
-- (with unique, clear names)

ALTER TABLE products 
  ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE SET NULL;

ALTER TABLE products 
  ADD CONSTRAINT products_warehouse_id_fkey 
  FOREIGN KEY (warehouse_id) 
  REFERENCES warehouses(id) 
  ON DELETE CASCADE;

-- Step 4: Verify the fix
SELECT 'Foreign Keys After Fix:' as info;
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE conrelid = 'products'::regclass
  AND contype = 'f'
ORDER BY conname;

-- Step 5: Test the query that was failing
SELECT 'Test Query - Products with Categories:' as info;
SELECT 
  p.id,
  p.name,
  p.price,
  p.stock,
  p.is_active,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC;

-- Step 6: Verify product count
SELECT 'Total Products:' as metric, COUNT(*) as count FROM products;
SELECT 'Active Products:' as metric, COUNT(*) as count FROM products WHERE is_active = true;
