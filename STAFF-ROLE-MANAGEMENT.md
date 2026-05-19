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

---

### 📊 5. Enable Business Finance Ledger Table
Run this snippet once in your Supabase SQL Editor to create the `business_finance_reports` table. This tracks all gross revenue, rider salary payouts, inventory costs, and manual income/expenses.

```sql
CREATE TABLE IF NOT EXISTS public.business_finance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by TEXT
);

-- Enable RLS and create open admin policies if needed
ALTER TABLE public.business_finance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to business_finance_reports for admins" 
ON public.business_finance_reports 
FOR ALL USING (true) WITH CHECK (true);
```

---

### 🏷️ 6. Enable Product MRP (Maximum Retail Price) Column
Run this snippet once in your Supabase SQL Editor to add the `mrp` column to your `products` table. This allows you to set an MRP (e.g., ₹500) alongside your Sawaïom Price (e.g., ₹480) for all current and future products.

```sql
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS mrp NUMERIC DEFAULT 500;
```

---

### 📦 7. Enable Unit Variants & Stock Status Management (and Remove Seafood/Meat)
Run this snippet once in your Supabase SQL Editor to remove Seafood/Meat categories from your database and add the `unit` variant and `stock_status` columns to your `products` table.

```sql
-- A. Remove Seafood and Meat categories from the database
DELETE FROM public.categories WHERE name ILIKE '%seafood%' OR name ILIKE '%meat%';

-- B. Add Unit Variant and Stock Status columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '1 kg',
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock';
```

---

### 🏍️ 8. Fix Rider Role Enum Value
Run this snippet once in your Supabase SQL Editor if you get a profile creation error about `invalid input value for enum user_role: "rider"`. This adds the `'rider'` role to the enum type.

```sql
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'rider';
```

