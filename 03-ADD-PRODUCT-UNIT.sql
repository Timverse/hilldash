-- ====================================================================
-- 03-ADD-PRODUCT-UNIT.sql
-- Add unit column to products table for BigBasket scale packing lists
-- ====================================================================

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'Units';
    RAISE NOTICE 'Added unit column to products';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'unit column already exists in products';
  END;
END $$;

-- Verify column
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'unit';
