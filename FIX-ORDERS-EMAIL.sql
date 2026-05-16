-- ====================================================================
-- FIX EXISTING ORDERS EMAIL BACKFILL
-- Links existing orders to your auth account so they appear in Recent Orders
-- ====================================================================

DO $$ 
DECLARE
  first_user_email TEXT;
  updated_count INTEGER;
BEGIN
  -- Get the email of the first registered user (usually the owner/admin testing the app)
  SELECT email INTO first_user_email FROM auth.users ORDER BY created_at LIMIT 1;

  IF first_user_email IS NOT NULL THEN
    -- Update orders where customer_email is null
    UPDATE orders 
    SET customer_email = first_user_email 
    WHERE customer_email IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % existing orders to set customer_email = %', updated_count, first_user_email;
  ELSE
    RAISE NOTICE 'No auth users found to link orders to.';
  END IF;
END $$;

-- Verify the update
SELECT id, customer_name, customer_email, status, total 
FROM orders 
ORDER BY created_at DESC;
