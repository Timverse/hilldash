-- ============================================
-- FINAL COMPLETE FIX - Align Database with Code
-- ============================================
-- This script will fix ALL schema mismatches between database and code

-- ============================================
-- PART 1: CHECK CURRENT STATE
-- ============================================

SELECT '========== CURRENT ORDERS TABLE STRUCTURE ==========' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ============================================
-- PART 2: FIX ORDERS TABLE COLUMNS
-- ============================================

-- Drop old columns that don't match the code
ALTER TABLE orders DROP COLUMN IF EXISTS total_amount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_method CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS notes CASCADE;

-- Ensure all required columns exist with correct names
DO $$ 
BEGIN
  -- customer_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
    ALTER TABLE orders ADD COLUMN customer_name TEXT NOT NULL DEFAULT 'Unknown';
    ALTER TABLE orders ALTER COLUMN customer_name DROP DEFAULT;
  END IF;

  -- customer_phone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
    ALTER TABLE orders ADD COLUMN customer_phone TEXT NOT NULL DEFAULT '0000000000';
    ALTER TABLE orders ALTER COLUMN customer_phone DROP DEFAULT;
  END IF;

  -- customer_email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_email') THEN
    ALTER TABLE orders ADD COLUMN customer_email TEXT;
  END IF;

  -- delivery_address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_address') THEN
    ALTER TABLE orders ADD COLUMN delivery_address TEXT NOT NULL DEFAULT 'Unknown';
    ALTER TABLE orders ALTER COLUMN delivery_address DROP DEFAULT;
  END IF;

  -- delivery_lat
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_lat') THEN
    ALTER TABLE orders ADD COLUMN delivery_lat DECIMAL(10, 7);
  END IF;

  -- delivery_lng
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_lng') THEN
    ALTER TABLE orders ADD COLUMN delivery_lng DECIMAL(10, 7);
  END IF;

  -- distance_km
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'distance_km') THEN
    ALTER TABLE orders ADD COLUMN distance_km DECIMAL(10, 2);
  END IF;

  -- delivery_fee
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_fee') THEN
    ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0;
  END IF;

  -- subtotal
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0;
    ALTER TABLE orders ALTER COLUMN subtotal DROP DEFAULT;
  END IF;

  -- total (NOT total_amount)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total') THEN
    ALTER TABLE orders ADD COLUMN total DECIMAL(10, 2) NOT NULL DEFAULT 0;
    ALTER TABLE orders ALTER COLUMN total DROP DEFAULT;
  END IF;

  -- warehouse_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'warehouse_id') THEN
    ALTER TABLE orders ADD COLUMN warehouse_id UUID;
  END IF;

  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_at') THEN
    ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- PART 3: FIX STATUS COLUMN (ENUM or TEXT)
-- ============================================

-- Check if status is an enum
DO $$
DECLARE
  status_type TEXT;
  enum_exists BOOLEAN;
BEGIN
  -- Get the current data type of status column
  SELECT udt_name INTO status_type
  FROM information_schema.columns 
  WHERE table_name = 'orders' AND column_name = 'status';

  -- Check if order_status enum exists
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'order_status'
  ) INTO enum_exists;

  IF status_type = 'order_status' AND enum_exists THEN
    -- It's an enum, add missing values
    RAISE NOTICE 'Status is an enum, adding missing values...';
    
    -- Add each value if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'pending') THEN
      ALTER TYPE order_status ADD VALUE 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'confirmed') THEN
      ALTER TYPE order_status ADD VALUE 'confirmed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'packed') THEN
      ALTER TYPE order_status ADD VALUE 'packed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'out_for_delivery') THEN
      ALTER TYPE order_status ADD VALUE 'out_for_delivery';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'delivered') THEN
      ALTER TYPE order_status ADD VALUE 'delivered';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status') AND enumlabel = 'cancelled') THEN
      ALTER TYPE order_status ADD VALUE 'cancelled';
    END IF;
  ELSIF status_type IS NULL THEN
    -- Status column doesn't exist, create it as TEXT
    ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Created status column as TEXT';
  END IF;
END $$;

-- ============================================
-- PART 4: ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Drop existing constraints first
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_warehouse_id_fkey;

-- Add warehouse foreign key
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'warehouse_id') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_warehouse_id_fkey 
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Constraint already exists
END $$;

-- ============================================
-- PART 5: DISABLE RLS FOR DEVELOPMENT
-- ============================================

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 6: FIX ORDER_ITEMS TABLE
-- ============================================

SELECT '========== ORDER_ITEMS TABLE STRUCTURE ==========' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;

-- Ensure order_items has all required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_id') THEN
    ALTER TABLE order_items ADD COLUMN order_id UUID NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_id') THEN
    ALTER TABLE order_items ADD COLUMN product_id UUID NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
    ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
    ALTER TABLE order_items ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'created_at') THEN
    ALTER TABLE order_items ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add foreign keys for order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

DO $$
BEGIN
  ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- PART 7: VERIFICATION
-- ============================================

SELECT '========== FINAL ORDERS TABLE STRUCTURE ==========' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

SELECT '========== FINAL ORDER_ITEMS TABLE STRUCTURE ==========' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;

SELECT '========== STATUS ENUM VALUES (if enum) ==========' as info;
SELECT 
  e.enumlabel as value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;

SELECT '========== DATABASE COUNTS ==========' as info;
SELECT 'Warehouses' as table_name, COUNT(*) as count FROM warehouses
UNION ALL
SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'Order Items' as table_name, COUNT(*) as count FROM order_items;

-- ============================================
-- PART 8: TEST ORDER INSERTION
-- ============================================

-- Uncomment to test:
/*
DO $$
DECLARE
  test_order_id UUID;
  test_warehouse_id UUID;
  test_product_id UUID;
BEGIN
  -- Get warehouse and product
  SELECT id INTO test_warehouse_id FROM warehouses WHERE is_active = true LIMIT 1;
  SELECT id INTO test_product_id FROM products WHERE is_active = true LIMIT 1;
  
  IF test_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'No active warehouse found';
  END IF;
  
  IF test_product_id IS NULL THEN
    RAISE EXCEPTION 'No active product found';
  END IF;
  
  -- Insert test order
  INSERT INTO orders (
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    delivery_lat,
    delivery_lng,
    distance_km,
    delivery_fee,
    subtotal,
    total,
    status,
    warehouse_id
  ) VALUES (
    'Test Customer',
    '9876543210',
    'test@example.com',
    'Test Address, Jowai',
    25.4508,
    92.1868,
    2.5,
    0,
    100.00,
    100.00,
    'pending',
    test_warehouse_id
  ) RETURNING id INTO test_order_id;
  
  RAISE NOTICE 'Test order created: %', test_order_id;
  
  -- Insert test order item
  INSERT INTO order_items (
    order_id,
    product_id,
    quantity,
    price
  ) VALUES (
    test_order_id,
    test_product_id,
    2,
    50.00
  );
  
  RAISE NOTICE 'Test order item created';
  
  -- Show the test order
  RAISE NOTICE 'Test successful! Cleaning up...';
  
  -- Clean up
  DELETE FROM order_items WHERE order_id = test_order_id;
  DELETE FROM orders WHERE id = test_order_id;
  
  RAISE NOTICE 'Test order deleted. Schema is ready!';
END $$;
*/

SELECT '========== SCHEMA FIX COMPLETE ==========' as info;
SELECT 'Run the test block above (uncomment it) to verify everything works!' as next_step;
