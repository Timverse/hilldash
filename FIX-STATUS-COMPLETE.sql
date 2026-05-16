-- ============================================
-- COMPLETE FIX FOR ORDER STATUS
-- ============================================

-- Step 1: Check current status column configuration
SELECT 'Current status column:' as info;
SELECT 
  table_name,
  column_name, 
  data_type, 
  udt_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status';

-- Step 2: Check if order_status enum exists and its values
SELECT 'Existing order_status enum values:' as info;
SELECT 
  e.enumlabel as value,
  e.enumsortorder as order_num
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;

-- Step 3: Add missing enum values
DO $$
DECLARE
  enum_exists BOOLEAN;
  value_to_add TEXT;
BEGIN
  -- Check if enum exists
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'order_status'
  ) INTO enum_exists;

  IF enum_exists THEN
    RAISE NOTICE 'order_status enum exists, adding missing values...';
    
    -- Add each value if it doesn't exist
    FOR value_to_add IN 
      SELECT * FROM unnest(ARRAY['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'])
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
        AND enumlabel = value_to_add
      ) THEN
        EXECUTE format('ALTER TYPE order_status ADD VALUE %L', value_to_add);
        RAISE NOTICE 'Added % to order_status enum', value_to_add;
      ELSE
        RAISE NOTICE '% already exists in order_status enum', value_to_add;
      END IF;
    END LOOP;
  ELSE
    RAISE NOTICE 'order_status enum does not exist, will use TEXT type';
  END IF;
END $$;

-- Step 4: Show final enum values
SELECT 'Final order_status enum values:' as info;
SELECT 
  e.enumlabel as value,
  e.enumsortorder as order_num
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;

-- Step 5: Test query - show what status values are currently in use
SELECT 'Current status values in orders table:' as info;
SELECT DISTINCT status, COUNT(*) as count
FROM orders
GROUP BY status;

-- Step 6: Verification - try to insert a test order with 'pending' status
-- Uncomment to test:
/*
DO $$
DECLARE
  test_order_id UUID;
BEGIN
  INSERT INTO orders (
    customer_name, 
    customer_phone, 
    delivery_address, 
    subtotal, 
    total, 
    status,
    warehouse_id
  )
  SELECT 
    'Test Customer',
    '9876543210',
    'Test Address',
    100.00,
    100.00,
    'pending',
    (SELECT id FROM warehouses WHERE is_active = true LIMIT 1)
  RETURNING id INTO test_order_id;
  
  RAISE NOTICE 'Test order created successfully with ID: %', test_order_id;
  
  -- Clean up test order
  DELETE FROM orders WHERE id = test_order_id;
  RAISE NOTICE 'Test order deleted';
END $$;
*/
