# Order Status Enum Fix

## The Error

```
Failed to create order: invalid input value for enum order_status: "pending"
```

This means:
1. Your `orders.status` column uses a PostgreSQL ENUM type called `order_status`
2. The enum doesn't have "pending" as one of its allowed values
3. The checkout code is trying to insert "pending" which is rejected

## The Solution

### Step 1: Run the Fix Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste **`FIX-STATUS-COMPLETE.sql`**
3. Click **Run**

This will:
- ✅ Check what enum values currently exist
- ✅ Add all missing values: `pending`, `confirmed`, `packed`, `out_for_delivery`, `delivered`, `cancelled`
- ✅ Show you the final list of valid values
- ✅ Verify the fix works

### Step 2: Restart Dev Server

```bash
npm run dev
```

### Step 3: Test Checkout Again

Place an order - it should work now!

---

## What Are Valid Status Values?

After running the fix, these status values will be available:

| Status | Description |
|--------|-------------|
| `pending` | Order just placed, waiting for admin review |
| `confirmed` | Admin accepted the order |
| `packed` | Order is packed and ready for delivery |
| `out_for_delivery` | Order is with the delivery rider |
| `delivered` | Order successfully delivered |
| `cancelled` | Order was cancelled |

---

## Understanding the Output

After running `FIX-STATUS-COMPLETE.sql`, you should see:

```
Current status column:
- table_name: orders
- column_name: status
- data_type: USER-DEFINED
- udt_name: order_status

Existing order_status enum values:
(Shows current values, might be empty or have some values)

NOTICES:
- "Added pending to order_status enum"
- "Added confirmed to order_status enum"
- etc.

Final order_status enum values:
- pending (order: 1)
- confirmed (order: 2)
- packed (order: 3)
- out_for_delivery (order: 4)
- delivered (order: 5)
- cancelled (order: 6)
```

---

## Alternative: Convert to TEXT (If Needed)

If you prefer using TEXT instead of ENUM (more flexible), run this:

```sql
-- Convert status from enum to text
ALTER TABLE orders ALTER COLUMN status TYPE TEXT;

-- Add check constraint for valid values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'));

-- Set default value
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';
```

**Pros of TEXT:**
- ✅ Easier to add new status values later
- ✅ No need to run ALTER TYPE commands

**Pros of ENUM:**
- ✅ Slightly better performance
- ✅ Database enforces valid values at the type level

For development, TEXT is usually easier. For production, ENUM is slightly better.

---

## Verification

After the fix, verify it works:

```sql
-- Test inserting an order with 'pending' status
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
RETURNING id, customer_name, status;

-- If successful, delete the test order
DELETE FROM orders WHERE customer_name = 'Test Customer';
```

If this works without errors, your checkout will work too!

---

## Common Issues

### Issue 1: "cannot alter type because column is used by a view"
**Solution:** Drop the view temporarily, alter the enum, then recreate the view

### Issue 2: "enum label already exists"
**Solution:** This is fine! It means the value was already added. The script handles this gracefully.

### Issue 3: Still getting enum error after fix
**Solution:** 
1. Check the terminal output from the SQL script
2. Make sure all 6 values were added
3. Restart your dev server
4. Clear browser cache

---

## After This Fix

Your checkout flow will work! The order will be created with `status = 'pending'` and you can later update it through the admin dashboard to:
- `confirmed` (when admin accepts)
- `packed` (when ready for delivery)
- `out_for_delivery` (when rider picks it up)
- `delivered` (when customer receives it)
- `cancelled` (if order is cancelled)

Run the fix script now and try placing an order!
