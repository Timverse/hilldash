-- ====================================================================
-- 04-ADD-PRICE-AT-TIME.sql
-- Add price_at_time column to order_items table for historical pricing
-- ====================================================================

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE order_items ADD COLUMN price_at_time DECIMAL(10, 2);
    RAISE NOTICE 'Added price_at_time column to order_items';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'price_at_time column already exists in order_items';
  END;
END $$;

-- Populate existing rows with price data
UPDATE order_items 
SET price_at_time = price 
WHERE price_at_time IS NULL;

-- Verify column
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name IN ('price', 'price_at_time');
