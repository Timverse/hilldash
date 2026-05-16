-- ====================================================================
-- HILLDASH RIDERS SYSTEM SETUP (ROBUST FIX)
-- Ensures riders table has all required columns, links to orders, and populates data
-- ====================================================================

-- Step 1: Create riders table if not exists
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- available, on_delivery, offline
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 1B: Ensure existing riders table has all necessary columns (fixes 42703 error)
ALTER TABLE riders ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 98765 43210';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE;

-- Step 2: Add rider_id column to orders table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'rider_id') THEN
    ALTER TABLE orders ADD COLUMN rider_id UUID REFERENCES riders(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added rider_id column to orders table';
  ELSE
    RAISE NOTICE 'rider_id column already exists in orders table';
  END IF;
END $$;

-- Step 3: Insert Dummy Riders for Jowai Central Hub
DO $$ 
DECLARE
  jowai_hub_id UUID;
BEGIN
  -- Get Jowai Hub ID
  SELECT id INTO jowai_hub_id FROM warehouses WHERE name ILIKE '%Jowai%' LIMIT 1;

  IF jowai_hub_id IS NULL THEN
    SELECT id INTO jowai_hub_id FROM warehouses LIMIT 1;
  END IF;

  IF jowai_hub_id IS NOT NULL THEN
    -- Insert riders if table is empty
    IF NOT EXISTS (SELECT 1 FROM riders) THEN
      INSERT INTO riders (name, phone, status, warehouse_id) VALUES
      ('Pynshngainlang Lyngdoh', '+91 98765 43210', 'available', jowai_hub_id),
      ('Banshan Khongwir', '+91 87654 32109', 'on_delivery', jowai_hub_id),
      ('Meban Kharbhih', '+91 76543 21098', 'available', jowai_hub_id);
      RAISE NOTICE 'Inserted 3 delivery riders for Jowai Hub';
    ELSE
      RAISE NOTICE 'Riders already exist in database';
    END IF;
  END IF;
END $$;

-- Verify
SELECT * FROM riders;
