# How to Enable Supabase Realtime via SQL

By default, Supabase does **not** broadcast database changes over WebSockets for security and performance reasons. To make your live orders, delivery riders, inventory, and finance ledger update instantly without refreshing the page, you must add those tables to the `supabase_realtime` publication.

### 📋 Instructions:
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
2. Copy and paste the SQL script below.
3. Click **Run**.

---

```sql
-- ====================================================================
-- ENABLE SUPABASE REALTIME BROADCASTS
-- Configures WebSockets for live orders, riders, products, discounts, and finance ledger
-- ====================================================================

BEGIN;

-- 1. Drop the existing publication cleanly to avoid duplicate table errors
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 2. Recreate the publication tracking all tables that require real-time updates
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.orders, 
    public.riders, 
    public.products, 
    public.discounts,
    public.business_finance_reports;

COMMIT;

-- Verify active real-time tables
SELECT pubname, schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

---

### 🔍 What This SQL Does
* **`DROP PUBLICATION IF EXISTS`**: Resets the real-time tracker cleanly so you don't get errors if some tables were already added.
* **`CREATE PUBLICATION supabase_realtime`**: Tells PostgreSQL to instantly broadcast all `INSERT`, `UPDATE`, and `DELETE` events for `orders`, `riders`, `products`, `discounts`, and `business_finance_reports` over WebSockets to your Next.js admin dashboard.

Once executed, your **Finance Ledger** (`/dashboard/finance`), **Live Orders** (`/dashboard/orders`), and **Delivery Personnel** (`/dashboard/riders`) pages will immediately start receiving live pop-up alerts and table updates!
