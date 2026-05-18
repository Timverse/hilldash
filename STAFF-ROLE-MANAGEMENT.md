# Sawaïom Quick Staff Access SQL Snippets

Copy and paste the specific SQL snippet you need into your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), replace `'worker@example.com'` with your worker's registered email address, and click **Run**.

---

### 👑 1. Grant Superadmin Access
Gives the worker full administrative access across the entire dashboard.

```sql
UPDATE public.profiles 
SET role = 'superadmin', is_active = true, updated_at = NOW() 
WHERE email = 'worker@example.com';
```

---

### 🏢 2. Grant Warehouse Admin Access
Gives the worker access to manage inventory and orders for the Jowai Central Hub.

```sql
-- A. Set profile role to warehouse_admin
UPDATE public.profiles 
SET role = 'warehouse_admin', is_active = true, updated_at = NOW() 
WHERE email = 'worker@example.com';

-- B. Link worker to the active Jowai Central Hub
INSERT INTO public.user_warehouse_assignments (user_id, warehouse_id, is_active)
SELECT id, (SELECT id FROM public.warehouses WHERE is_active = true LIMIT 1), true
FROM public.profiles WHERE email = 'worker@example.com'
ON CONFLICT (user_id, warehouse_id) DO UPDATE SET is_active = true;
```

---

### 🏍️ 3. Grant Delivery Rider Access
Sets the worker as a delivery rider and adds them to the live dispatch fleet for the Jowai Central Hub.

```sql
-- A. Set profile role to rider
UPDATE public.profiles 
SET role = 'rider', is_active = true, updated_at = NOW() 
WHERE email = 'worker@example.com';

-- B. Add worker to the active riders fleet table
INSERT INTO public.riders (id, name, phone, status, warehouse_id)
SELECT 
  id, 
  COALESCE(full_name, 'Delivery Rider'), 
  COALESCE(phone, '+91 8974319494'), 
  'available', 
  (SELECT id FROM public.warehouses WHERE is_active = true LIMIT 1)
FROM public.profiles WHERE email = 'worker@example.com'
ON CONFLICT (id) DO UPDATE 
SET status = 'available', warehouse_id = EXCLUDED.warehouse_id;
```

---

### 🔐 4. Enable Rider Daily Audit & Earnings Verification Schema
Run this snippet once in your Supabase SQL Editor to add the daily payout audit columns to your existing `riders` table. This allows riders to generate receipts with Token IDs and superadmins to verify/insert their earnings daily.

```sql
ALTER TABLE public.riders 
ADD COLUMN IF NOT EXISTS active_token_id TEXT,
ADD COLUMN IF NOT EXISTS pending_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payout_date TIMESTAMPTZ;
```
