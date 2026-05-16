-- ============================================
-- FIX ORDERS TABLE - Ensure all columns exist
-- ============================================

-- Step 1: Check current orders table structure
SELECT 'Current Orders Table Columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add customer_name
  BEGIN
    ALTER TABLE orders ADD COLUMN customer_name TEXT;
    RAISE NOTICE 'Added customer_name column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'customer_name already exists';
  END;

  -- Add customer_phone
  BEGIN
    ALTER TABLE orders ADD COLUMN customer_phone TEXT;
    RAISE NOTICE 'Added customer_phone column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'customer_phone already exists';
  END;

  -- Add customer_email
  BEGIN
    ALTER TABLE orders ADD COLUMN customer_email TEXT;
    RAISE NOTICE 'Added customer_email column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'customer_email already exists';
  END;

  -- Add delivery_address
  BEGIN
    ALTER TABLE orders ADD COLUMN delivery_address TEXT;
    RAISE NOTICE 'Added delivery_address column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'delivery_address already exists';
  END;

  -- Add delivery_lat
  BEGIN
    ALTER TABLE orders ADD COLUMN delivery_lat DECIMAL(10, 7);
    RAISE NOTICE 'Added delivery_lat column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'delivery_lat already exists';
  END;

  -- Add delivery_lng
  BEGIN
    ALTER TABLE orders ADD COLUMN delivery_lng DECIMAL(10, 7);
    RAISE NOTICE 'Added delivery_lng column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'delivery_lng already exists';
  END;

  -- Add distance_km
  BEGIN
    ALTER TABLE orders ADD COLUMN distance_km DECIMAL(10, 2);
    RAISE NOTICE 'Added distance_km column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'distance_km already exists';
  END;

  -- Add delivery_fee
  BEGIN
    ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Added delivery_fee column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'delivery_fee already exists';
  END;

  -- Add subtotal
  BEGIN
    ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2);
    RAISE NOTICE 'Added subtotal column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'subtotal already exists';
  END;

  -- Add total (if missing)
  BEGIN
    ALTER TABLE orders ADD COLUMN total DECIMAL(10, 2);
    RAISE NOTICE 'Added total column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'total already exists';
  END;

  -- Add status (if missing)
  BEGIN
    ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Added status column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'status already exists';
  END;

  -- Add warehouse_id (if missing)
  BEGIN
    ALTER TABLE orders ADD COLUMN warehouse_id UUID;
    RAISE NOTICE 'Added warehouse_id column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'warehouse_id already exists';
  END;

  -- Add created_at (if missing)
  BEGIN
    ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'created_at already exists';
  END;

  -- Add updated_at (if missing)
  BEGIN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'updated_at already exists';
  END;
END $$;

-- Step 3: Add foreign key constraint for warehouse_id (if not exists)
DO $$
BEGIN
  BEGIN
    ALTER TABLE orders ADD CONSTRAINT orders_warehouse_id_fkey 
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added warehouse foreign key';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Warehouse foreign key already exists';
  END;
END $$;

-- Step 4: Disable RLS on orders and order_items
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix
SELECT 'Updated Orders Table Columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Step 6: Check order_items table
SELECT 'Order Items Table Columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Step 7: Show current orders count
SELECT 'Total Orders:' as metric, COUNT(*) as count FROM orders;
SELECT 'Total Order Items:' as metric, COUNT(*) as count FROM order_items;
