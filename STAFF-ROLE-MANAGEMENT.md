# Sawaïom Staff & Role Management SQL Script

This SQL script is designed for the **Sawaïom Owner** to quickly assign staff roles (`rider`, `superadmin`, `warehouse_admin`, `admin`, `owner`) to any registered user directly via the Supabase SQL Editor.

### 📋 Instructions:
1. Have the staff member sign up on the website (`/login?tab=signup`) using their email address.
2. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
3. Copy and paste the SQL script below.
4. Change the `target_email` and `target_role` values at the top of the script.
5. Click **Run**.

---

```sql
-- ====================================================================
-- SAWAÏOM STAFF ROLE & ACCESS ASSIGNMENT SCRIPT
-- Easily assign riders, superadmins, warehouse admins, or owners
-- ====================================================================

DO $$ 
DECLARE
  -- ✏️ 1. CHANGE THE EMAIL TO THE STAFF MEMBER'S REGISTERED EMAIL:
  target_email TEXT := 'staff@example.com';

  -- ✏️ 2. CHANGE THE DESIRED ROLE:
  -- Available Roles: 'rider', 'superadmin', 'warehouse_admin', 'admin', 'owner', 'customer'
  target_role TEXT := 'rider';

  -- Internal variables (Do not change)
  usr_id UUID;
  default_warehouse_id UUID;
BEGIN
  ---------------------------------------------------------------------
  -- Step 1: Find the User by Email
  ---------------------------------------------------------------------
  SELECT id INTO usr_id FROM public.profiles WHERE email = target_email;

  IF usr_id IS NULL THEN
    RAISE EXCEPTION '❌ User with email % not found in public.profiles. Please ensure they have signed up first.', target_email;
  END IF;

  ---------------------------------------------------------------------
  -- Step 2: Get Default Active Warehouse (Jowai Central Hub)
  ---------------------------------------------------------------------
  SELECT id INTO default_warehouse_id FROM public.warehouses WHERE is_active = true ORDER BY name LIMIT 1;

  IF default_warehouse_id IS NULL THEN
    RAISE NOTICE '⚠️ No active warehouse found. Skipping warehouse linking.';
  END IF;

  ---------------------------------------------------------------------
  -- Step 3: Update Profile Role
  ---------------------------------------------------------------------
  UPDATE public.profiles 
  SET 
    role = target_role,
    is_active = true,
    updated_at = NOW()
  WHERE id = usr_id;

  RAISE NOTICE '✅ Successfully updated profile role for % to "%"', target_email, target_role;

  ---------------------------------------------------------------------
  -- Step 4: Role-Specific Setup (Riders & Warehouse Admins)
  ---------------------------------------------------------------------
  -- A. IF RIDER: Ensure they are in the public.riders table
  IF target_role = 'rider' AND default_warehouse_id IS NOT NULL THEN
    INSERT INTO public.riders (id, name, phone, status, warehouse_id)
    SELECT 
      id, 
      COALESCE(full_name, 'Delivery Rider'), 
      COALESCE(phone, '+91 8974319494'), 
      'available', 
      default_warehouse_id
    FROM public.profiles 
    WHERE id = usr_id
    ON CONFLICT (id) DO UPDATE 
    SET 
      status = 'available',
      warehouse_id = default_warehouse_id;

    RAISE NOTICE '🏍️ Successfully added/updated % in public.riders table for Jowai Central Hub.', target_email;
  END IF;

  -- B. IF WAREHOUSE ADMIN / SUPERADMIN: Ensure they are assigned to the warehouse
  IF target_role IN ('warehouse_admin', 'superadmin', 'owner') AND default_warehouse_id IS NOT NULL THEN
    INSERT INTO public.user_warehouse_assignments (user_id, warehouse_id, is_active)
    VALUES (usr_id, default_warehouse_id, true)
    ON CONFLICT (user_id, warehouse_id) DO UPDATE 
    SET is_active = true;

    RAISE NOTICE '🏢 Successfully assigned % to Jowai Central Hub warehouse.', target_email;
  END IF;

  RAISE NOTICE '🎉 All role assignments and setup completed successfully!';
END $$;
```

---

### 🔍 Verification Queries

To verify that the roles and assignments were applied correctly, you can run these check queries in Supabase:

```sql
-- Check Profile Role
SELECT id, email, full_name, role, is_active 
FROM public.profiles 
WHERE email = 'staff@example.com';

-- Check Rider Fleet Entry (if assigned as rider)
SELECT r.id, r.name, r.phone, r.status, w.name AS hub_name
FROM public.riders r
LEFT JOIN public.warehouses w ON r.warehouse_id = w.id
WHERE r.id = (SELECT id FROM public.profiles WHERE email = 'staff@example.com');

-- Check Warehouse Assignment (if assigned as warehouse_admin or superadmin)
SELECT uwa.user_id, w.name AS hub_name, uwa.is_active
FROM public.user_warehouse_assignments uwa
JOIN public.warehouses w ON uwa.warehouse_id = w.id
WHERE uwa.user_id = (SELECT id FROM public.profiles WHERE email = 'staff@example.com');
```
