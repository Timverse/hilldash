# Checkout Order Creation Fix

## The Problem

When placing an order, you're getting: **"Failed to create order. Please try again"**

This is happening because:
1. The `orders` table is missing required columns (customer_name, customer_phone, delivery_address, etc.)
2. The checkout action was trying to insert a `user_id` column that doesn't exist
3. The column names in the code didn't match the database schema

## The Solution

### Step 1: Fix the Orders Table Schema

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste **`FIX-ORDERS-TABLE.sql`**
3. Click **Run**

This will:
- ✅ Add all missing columns to the orders table
- ✅ Add foreign key constraint for warehouse_id
- ✅ Disable RLS for development
- ✅ Show you the final table structure

### Step 2: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 3: Test the Checkout Flow

1. Go to your shop page
2. Add products to cart
3. Go to checkout
4. Fill in the form:
   - Name
   - Phone
   - Address
   - Click "Get Current Location" (allow location access)
5. Click "Place Order"

You should now see:
- ✅ "Order placed successfully!" toast
- ✅ Redirect to order tracking page
- ✅ Order appears in Supabase orders table
- ✅ Order items appear in order_items table
- ✅ Product stock is reduced

## What I Fixed in the Code

### Before (checkout.ts):
```typescript
.insert({
  user_id: user?.id || null,  // ❌ Column doesn't exist
  warehouse_id: WAREHOUSE_ID,
  total,
  status: 'received',
  payment_method: paymentMethod,
  notes: `Name: ${name}...`  // ❌ Storing data in notes field
})
```

### After (checkout.ts):
```typescript
.insert({
  customer_name: name,        // ✅ Proper column
  customer_phone: phone,      // ✅ Proper column
  customer_email: null,       // ✅ Proper column
  delivery_address: address,  // ✅ Proper column
  delivery_lat: lat,          // ✅ Proper column
  delivery_lng: lng,          // ✅ Proper column
  distance_km: distance,      // ✅ Proper column
  delivery_fee: deliveryFee,  // ✅ Proper column
  subtotal: subtotal,         // ✅ Proper column
  total: finalTotal,          // ✅ Proper column
  status: 'pending',          // ✅ Proper status
  warehouse_id: WAREHOUSE_ID  // ✅ Proper column
})
```

## Expected SQL Output

After running `FIX-ORDERS-TABLE.sql`, you should see:

```
Updated Orders Table Columns:
- id (uuid)
- customer_name (text)
- customer_phone (text)
- customer_email (text)
- delivery_address (text)
- delivery_lat (numeric)
- delivery_lng (numeric)
- distance_km (numeric)
- delivery_fee (numeric)
- subtotal (numeric)
- total (numeric)
- status (text)
- warehouse_id (uuid)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

Order Items Table Columns:
- id (uuid)
- order_id (uuid)
- product_id (uuid)
- quantity (integer)
- price (numeric)
- created_at (timestamp with time zone)
```

## Debug Logging

I've added extensive console logging to the checkout action. After placing an order, check your **terminal** for:

```
=== processCheckoutAction called ===
Warehouse fetch: { warehouses: [...], warehouseError: null }
Form data: { name: 'John Doe', phone: '9876543210', ... }
Distance calculated: 2.5 km, max allowed: 10 km
Creating order with payload: { customer_name: 'John Doe', ... }
Order creation result: { order: {...}, orderError: null }
Inserting order items: [...]
Stock updated for product xxx: 100 -> 99
Order created successfully: <order-id>
```

If you see an error, it will show exactly what went wrong.

## Verification

After placing an order, verify in Supabase:

### Check Orders Table:
```sql
SELECT 
  id,
  customer_name,
  customer_phone,
  delivery_address,
  distance_km,
  total,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

### Check Order Items:
```sql
SELECT 
  oi.id,
  oi.order_id,
  p.name as product_name,
  oi.quantity,
  oi.price,
  (oi.quantity * oi.price) as subtotal
FROM order_items oi
JOIN products p ON oi.product_id = p.id
ORDER BY oi.created_at DESC
LIMIT 10;
```

### Check Stock Reduction:
```sql
SELECT id, name, stock 
FROM products 
WHERE id IN (
  SELECT DISTINCT product_id FROM order_items
)
ORDER BY name;
```

## Common Issues

### Issue 1: "No active delivery hub found"
**Fix:** Make sure warehouse is active:
```sql
UPDATE warehouses SET is_active = true;
```

### Issue 2: "Outside delivery zone"
**Fix:** Increase the radius or check coordinates:
```sql
UPDATE warehouses SET radius_km = 50 WHERE name = 'Jowai Central Hub';
```

### Issue 3: Location not working
**Fix:** 
- Make sure you're using HTTPS (or localhost)
- Allow location access in browser
- Check browser console for geolocation errors

### Issue 4: Order created but items not inserted
**Check terminal logs** - will show the exact error from order_items insertion

## Next Steps

After orders are working:
1. ✅ Build the admin orders dashboard to view orders
2. ✅ Add order status management (accept, pack, deliver)
3. ✅ Implement real-time order updates
4. ✅ Build customer order tracking page

Your checkout should work perfectly now!
