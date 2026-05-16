-- ====================================================================
-- FIX ORDERS TABLE FOR ADMIN DASHBOARD
-- Adds missing payment_method and notes columns to prevent loading errors
-- ====================================================================

-- Step 1: Add payment_method and notes columns if not exist
DO $$ 
BEGIN
  -- Add payment_method
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'COD';
    RAISE NOTICE 'Added payment_method column to orders table';
  ELSE
    RAISE NOTICE 'payment_method column already exists in orders table';
  END IF;

  -- Add notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') THEN
    ALTER TABLE orders ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column to orders table';
  ELSE
    RAISE NOTICE 'notes column already exists in orders table';
  END IF;
END $$;

-- Step 2: Verify the updated table columns
SELECT 'Updated Orders Table Columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
