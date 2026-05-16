# Products Not Displaying - Troubleshooting Guide

## What I Fixed:

1. ✅ **Added `dynamic = 'force-dynamic'`** to the products page - disables Next.js caching
2. ✅ **Added `revalidate = 0`** - ensures the page always fetches fresh data
3. ✅ **Added debug logging** - will show product count in server console
4. ✅ **Improved revalidatePath calls** - more explicit cache invalidation

## Steps to See Your Products:

### Step 1: Restart Your Dev Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 2: Hard Refresh Your Browser
- **Windows/Linux:** `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`

### Step 3: Check the Server Console
Look at your terminal where `npm run dev` is running. You should see:
```
Products query result: { count: 1, error: undefined }
Categories query result: { count: 10, error: undefined }
```

If you see `count: 0`, the products aren't being fetched from the database.

### Step 4: Verify in Supabase
1. Go to **Supabase Dashboard** → **Table Editor** → **products**
2. You should see your product(s) there
3. Check that:
   - ✅ `is_active` is `true`
   - ✅ `category_id` is not null
   - ✅ `warehouse_id` is not null

### Step 5: Test the Query Directly
Run this in **Supabase SQL Editor**:
```sql
SELECT 
  p.id,
  p.name,
  p.price,
  p.stock,
  p.is_active,
  p.image_url,
  c.name as category_name,
  w.name as warehouse_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN warehouses w ON p.warehouse_id = w.id
ORDER BY p.created_at DESC;
```

This should return your products with all their details.

## Common Issues:

### Issue 1: Products exist but count is 0
**Cause:** RLS policies might be blocking the query
**Fix:** Run this in Supabase SQL Editor:
```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

### Issue 2: Category name not showing
**Cause:** The join with categories table is failing
**Fix:** Make sure `category_id` is set correctly:
```sql
-- Check if category_id is null
SELECT id, name, category_id FROM products;

-- If null, update it:
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Vegetables' LIMIT 1)
WHERE category_id IS NULL;
```

### Issue 3: Still not showing after restart
**Cause:** Browser cache or service worker
**Fix:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage**
4. Check all boxes
5. Click **Clear site data**
6. Hard refresh again

### Issue 4: Console shows error
**Check the browser console (F12 → Console)** for errors like:
- Network errors
- Supabase authentication errors
- JavaScript errors

Share the error message if you see one.

## Quick Verification Script

Run this in Supabase SQL Editor to verify everything:

```sql
-- Check products
SELECT 'Products:' as info, COUNT(*) as count FROM products;
SELECT 'Active Products:' as info, COUNT(*) as count FROM products WHERE is_active = true;

-- Check if products have categories
SELECT 'Products with Categories:' as info, COUNT(*) as count 
FROM products WHERE category_id IS NOT NULL;

-- Check if products have warehouses
SELECT 'Products with Warehouses:' as info, COUNT(*) as count 
FROM products WHERE warehouse_id IS NOT NULL;

-- Show actual products
SELECT id, name, price, is_active, category_id, warehouse_id 
FROM products 
ORDER BY created_at DESC;
```

Expected results:
- Products: 1 or more
- Active Products: 1 or more
- Products with Categories: Same as total products
- Products with Warehouses: Same as total products

## After Following These Steps:

Your products should now appear in the dashboard! If they still don't show up:

1. Share the output from the server console (the debug logs)
2. Share the output from the verification script above
3. Share any errors from the browser console

This will help me identify the exact issue.
