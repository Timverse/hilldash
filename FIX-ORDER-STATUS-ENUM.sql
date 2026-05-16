-- ============================================
-- FIX ORDER STATUS ENUM
-- ============================================

-- Step 1: Check if status column is an enum
SELECT 'Current status column type:' as info;
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status';

-- Step 2: Check existing enum values (if it's an enum)
SELECT 'Existing enum values for order_status:' as info;
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;

-- Step 3: Option A - Add 'pending' to the enum (if enum exists)
DO $$
BEGIN
  -- Check if the enum type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    -- Add 'pending' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
      AND enumlabel = 'pending'
    ) THEN
      ALTER TYPE order_status ADD VALUE 'pending';
      RAISE NOTICE 'Added pending to order_status enum';
    ELSE
      RAISE NOTICE 'pending already exists in order_status enum';
    END IF;
  ELSE
    RAISE NOTICE 'order_status enum does not exist';
  END IF;
END $$;

-- Step 4: Option B - Convert status column from enum to text (if needed)
-- Uncomment this section if you want to use text instead of enum

/*
DO $$
BEGIN
  -- Drop the enum constraint and convert to text
  ALTER TABLE orders ALTER COLUMN status TYPE TEXT;
  RAISE NOTICE 'Converted status column to TEXT';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not convert status to TEXT: %', SQLERRM;
END $$;

-- Add a check constraint for valid statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'));
*/

-- Step 5: Show final enum values
SELECT 'Final enum values for order_status:' as info;
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;

-- Step 6: Test inserting an order with 'pending' status
-- Uncomment to test:
/*
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
  (SELECT id FROM warehouses LIMIT 1)
RETURNING id, customer_name, status;
*/
