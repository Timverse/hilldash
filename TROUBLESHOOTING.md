# HillDash Product Creation Troubleshooting Guide

## The Problem
You're seeing: **"No warehouse found. Please create a Hub first. (DB error: Cannot coerce the result to a single JSON object)"**

## Root Cause
The error "Cannot coerce the result to a single JSON object" happens when:
1. **No warehouses exist in the database**, OR
2. **RLS (Row Level Security) policies are blocking the query**

## Solution Steps

### Step 1: Fix the Code (✅ DONE)
I've already fixed the warehouse query in `app/actions/inventory.ts` to handle multiple/zero results properly.

### Step 2: Run Database Setup Scripts

Go to your **Supabase Dashboard** → **SQL Editor** and run these scripts **in order**:

#### 2.1 Run `complete-setup.sql`
This will:
- ✅ Create/verify the Jowai Central Hub warehouse
- ✅ Create 10 product categories
- ✅ Verify storage bucket exists
- ✅ Show you a summary of your database state

**Expected Output:**
```
Existing Warehouses: 1 row (Jowai Central Hub)
Categories Created: 10 rows
Total Warehouses: 1
Total Categories: 10
```

#### 2.2 Run `fix-rls-policies.sql`
This will:
- ✅ Disable RLS for development (quick fix)
- ✅ Set up storage bucket policies
- ✅ Allow product image uploads

**For Development:** Use OPTION 1 (Disable RLS)
**For Production:** Use OPTION 2 (Enable RLS with proper policies)

### Step 3: Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test Product Creation

1. Go to `http://localhost:3000/dashboard/products`
2. Click "Add Product"
3. Fill in the form:
   - **Name:** Test Tomatoes
   - **Category:** Select "Vegetables"
   - **Price:** 50
   - **Stock:** 100
   - **Available:** Toggle ON
   - **Image:** Upload any image
4. Click "Save Product"

You should now see:
- ✅ A green success toast: "Product created successfully!"
- ✅ The product appears in the table

## Common Issues & Fixes

### Issue 1: "No categories yet. Create one first."
**Fix:** Run `complete-setup.sql` to create categories

### Issue 2: Still getting "No warehouse found"
**Possible causes:**
- RLS is blocking the query
- Warehouse exists but `is_active = false`

**Fix:**
```sql
-- Check warehouse status
SELECT id, name, is_active FROM warehouses;

-- If is_active is false, enable it:
UPDATE warehouses SET is_active = true WHERE name = 'Jowai Central Hub';
```

### Issue 3: Image upload fails
**Fix:** Run the storage bucket policies section in `fix-rls-policies.sql`

### Issue 4: Toast notifications don't appear
**Fix:** Already fixed! I added the Toaster component to `app/layout.tsx`

## Verification Checklist

Run this in Supabase SQL Editor to verify everything:

```sql
-- Should return 1 active warehouse
SELECT COUNT(*) as active_warehouses FROM warehouses WHERE is_active = true;

-- Should return 10 categories
SELECT COUNT(*) as total_categories FROM categories;

-- Should return 'product-images' bucket
SELECT name, public FROM storage.buckets WHERE name = 'product-images';

-- Check if RLS is enabled (false = disabled, easier for dev)
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('warehouses', 'categories', 'products');
```

**Expected Results:**
- `active_warehouses`: 1
- `total_categories`: 10
- `product-images`: exists, public = true
- `rowsecurity`: false (for development)

## Still Having Issues?

Check the browser console (F12) for detailed error messages and share them with me. The console will show:
- Supabase query errors
- Network request failures
- JavaScript errors

## Next Steps After Fix

Once products are working:
1. ✅ Add more products to your inventory
2. ✅ Test the customer-facing shop page
3. ✅ Implement the shopping cart (Week 3)
4. ✅ Build the checkout flow with geolocation
