-- ====================================================================
-- 02-BIGBASKET-SCALE.sql
-- Add Rider Tracking & Perishable Expiry Management Columns
-- ====================================================================

DO $$ 
BEGIN
  -- 1. Add rider tracking columns to orders table
  BEGIN
    ALTER TABLE orders ADD COLUMN rider_lat DECIMAL(10, 7);
    RAISE NOTICE 'Added rider_lat column to orders';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'rider_lat already exists';
  END;

  BEGIN
    ALTER TABLE orders ADD COLUMN rider_lng DECIMAL(10, 7);
    RAISE NOTICE 'Added rider_lng column to orders';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'rider_lng already exists';
  END;

  BEGIN
    ALTER TABLE orders ADD COLUMN rider_name TEXT;
    RAISE NOTICE 'Added rider_name column to orders';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'rider_name already exists';
  END;

  BEGIN
    ALTER TABLE orders ADD COLUMN rider_phone TEXT;
    RAISE NOTICE 'Added rider_phone column to orders';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'rider_phone already exists';
  END;

  -- 2. Add perishable batch and expiry tracking columns to products table
  BEGIN
    ALTER TABLE products ADD COLUMN batch_number TEXT;
    RAISE NOTICE 'Added batch_number column to products';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'batch_number already exists';
  END;

  BEGIN
    ALTER TABLE products ADD COLUMN expiry_date DATE;
    RAISE NOTICE 'Added expiry_date column to products';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'expiry_date already exists';
  END;
END $$;

-- Verify columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'products') 
  AND column_name IN ('rider_lat', 'rider_lng', 'rider_name', 'rider_phone', 'batch_number', 'expiry_date')
ORDER BY table_name, column_name;
