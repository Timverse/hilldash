# FINAL FIX - Duplicate Foreign Key Constraints

## The Problem

Your error message:
```
"Could not embed because more than one relationship was found for 'products' and 'categories'"
```

This means the `products` table has **multiple foreign key constraints** pointing to the `categories` table. This happened because we ran the fix scripts multiple times, and each time it added a new constraint.

Supabase doesn't know which foreign key to use for the join, so the query fails.

## The Solution

### Step 1: Run the Fix Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste **`FIX-DUPLICATE-CONSTRAINTS.sql`**
3. Click **Run**

This script will:
- ✅ Show you all current foreign key constraints
- ✅ Drop ALL foreign key constraints on the products table
- ✅ Recreate ONLY the two necessary constraints with clear names:
  - `products_category_id_fkey` (products → categories)
  - `products_warehouse_id_fkey` (products → warehouses)
- ✅ Test the query to make sure it works
- ✅ Show you the product count

### Step 2: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 3: Hard Refresh Your Browser

Press **`Ctrl + Shift + R`** (Windows) or **`Cmd + Shift + R`** (Mac)

### Step 4: Check Your Products Page

Go to `http://localhost:3000/dashboard/products`

You should now see:
- ✅ Your products displayed in the table
- ✅ Category names showing correctly
- ✅ All product details visible

## What I Also Fixed in the Code

I updated the products page query to explicitly specify which foreign key relationship to use:

**Before:**
```typescript
.select('*, categories(name)')
```

**After:**
```typescript
.select(`
  *,
  categories!products_category_id_fkey(name)
`)
```

The `!products_category_id_fkey` syntax tells Supabase exactly which foreign key to use for the join, preventing ambiguity.

## Verification

After running the script, you should see in the SQL output:

```
Foreign Keys After Fix:
- products_category_id_fkey → categories
- products_warehouse_id_fkey → warehouses

Test Query - Products with Categories:
(Your products listed with their category names)

Total Products: 1 (or however many you created)
Active Products: 1
```

And in your terminal after restart:
```
Products query result: { count: 1, error: undefined }
Categories query result: { count: 17, error: undefined }
```

## If You Still Have Issues

1. **Check the SQL script output** - Make sure it shows your products in the test query
2. **Check the terminal** - Make sure `count` is not 0 and `error` is undefined
3. **Check browser console** (F12) - Look for any JavaScript errors

Share any errors you see and I'll help further!

## Why This Happened

When we ran multiple fix scripts (SAFE-FIX.sql, FIX-PRODUCTS-TABLE.sql, etc.), each one tried to add foreign key constraints. PostgreSQL allows multiple foreign keys between the same tables, so it didn't complain. But Supabase's query builder got confused when trying to do the join.

This fix ensures there's only ONE foreign key constraint for each relationship, with clear, unambiguous names.
