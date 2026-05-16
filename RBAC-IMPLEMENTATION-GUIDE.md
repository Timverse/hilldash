# Complete RBAC Implementation Guide

## Overview

This guide implements a production-ready Role-Based Access Control (RBAC) system for your multi-warehouse grocery platform, similar to BigBasket's architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         OWNER                                │
│  - Full system access                                        │
│  - Manages all warehouses                                    │
│  - Creates/manages superadmins                               │
│  - Views all analytics & reports                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────┬──────────────┐
                              ▼              ▼              ▼
                    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                    │ Warehouse A  │ │ Warehouse B  │ │ Warehouse C  │
                    └──────────────┘ └──────────────┘ └──────────────┘
                         │                 │                 │
                         ▼                 ▼                 ▼
                   ┌──────────┐      ┌──────────┐      ┌──────────┐
                   │Superadmin│      │Superadmin│      │Superadmin│
                   │   #1     │      │   #2     │      │   #3     │
                   └──────────┘      └──────────┘      └──────────┘
                   - Assigned to     - Assigned to     - Assigned to
                     Warehouse A       Warehouse B       Warehouse C
                   - Can ONLY see    - Can ONLY see    - Can ONLY see
                     A's products      B's products      C's products
```

## Implementation Steps

### Step 1: Run Database Schema

```bash
# In Supabase SQL Editor, run:
RBAC-DATABASE-SCHEMA.sql
```

This creates:
- ✅ `user_role` enum (owner, superadmin, warehouse_admin, customer)
- ✅ Updated `profiles` table with role column
- ✅ `user_warehouse_assignments` table
- ✅ `audit_logs` table
- ✅ Helper functions for permission checks
- ✅ Row Level Security (RLS) policies

### Step 2: Create Your Owner Account

After running the schema, create your owner account:

```sql
-- 1. First, sign up in Supabase Auth UI or via your app
-- 2. Get your user ID from auth.users table
-- 3. Update your profile to owner role:

UPDATE profiles 
SET role = 'owner', full_name = 'Your Name'
WHERE email = 'your-email@example.com';
```

### Step 3: Integrate RBAC Utilities

The RBAC utilities are in `/lib/auth/rbac.ts`. Use them in your server actions:

```typescript
import {
  getCurrentUserProfile,
  requireRole,
  requireAnyRole,
  requireWarehouseAccess,
  applyWarehouseFilter,
  getAccessibleWarehouseIds
} from '@/lib/auth/rbac'
```

### Step 4: Update Existing Actions

Replace your existing product actions with RBAC-protected versions:

**Before:**
```typescript
export async function createProductAction(formData: FormData) {
  const supabase = await createClient()
  // ... insert product
}
```

**After:**
```typescript
export async function createProductAction(formData: FormData) {
  // Require owner or superadmin role
  await requireAnyRole(['owner', 'superadmin'])
  
  // Validate warehouse access
  const warehouse_id = formData.get('warehouse_id') as string
  await requireWarehouseAccess(warehouse_id)
  
  // ... rest of logic
}
```

### Step 5: Update Dashboard Pages

#### Owner Dashboard (sees everything):

```typescript
// app/(admin)/dashboard/products/page.tsx
import { getAccessibleProducts } from '@/app/actions/rbac-products'

export default async function ProductsPage() {
  const result = await getAccessibleProducts()
  
  if (result.error) {
    return <div>Error: {result.error}</div>
  }
  
  return <ProductTable products={result.products} />
}
```

#### Superadmin Dashboard (sees only assigned warehouses):

```typescript
import { getUserWarehouseAssignments } from '@/lib/auth/rbac'

export default async function SuperadminDashboard() {
  const assignments = await getUserWarehouseAssignments()
  
  // Show only assigned warehouses
  return (
    <div>
      <h1>My Warehouses</h1>
      {assignments.map(a => (
        <WarehouseCard key={a.warehouse_id} {...a} />
      ))}
    </div>
  )
}
```

### Step 6: Create User Management UI (Owner Only)

```typescript
// app/(admin)/dashboard/users/page.tsx
import { getAllUsers } from '@/app/actions/user-management'
import { requireRole } from '@/lib/auth/rbac'

export default async function UsersPage() {
  // Only owners can access this page
  await requireRole('owner')
  
  const result = await getAllUsers()
  
  return <UserManagementTable users={result.users} />
}
```

## Key Features

### 1. Warehouse Isolation

Products, orders, and inventory are strictly isolated by warehouse:

```typescript
// Superadmin can only see products from assigned warehouses
const { data: products } = await supabase
  .from('products')
  .select('*')
  .in('warehouse_id', await getAccessibleWarehouseIds())
```

### 2. Horizontal Privilege Escalation Prevention

```typescript
// Attempting to access unauthorized warehouse throws error
await requireWarehouseAccess('unauthorized-warehouse-id')
// ❌ Throws: "Unauthorized: No access to warehouse..."
```

### 3. Automatic Warehouse Filtering

```typescript
// Automatically filters query based on user's role
let query = supabase.from('products').select('*')
query = await applyWarehouseFilter(query)
// Owner: no filter (sees all)
// Superadmin: filtered to assigned warehouses only
```

### 4. Audit Logging

Every action is logged:

```typescript
await logAuditAction(
  'CREATE',           // action
  'product',          // resource type
  product.id,         // resource ID
  warehouse_id,       // warehouse ID
  { name, price }     // additional details
)
```

## API Authorization Examples

### Example 1: Create Product

```typescript
export async function createProduct(formData: FormData) {
  try {
    // 1. Check role
    await requireAnyRole(['owner', 'superadmin'])
    
    // 2. Extract warehouse ID
    const warehouse_id = formData.get('warehouse_id') as string
    
    // 3. Validate warehouse access
    await requireWarehouseAccess(warehouse_id)
    
    // 4. Proceed with creation
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .insert({ ...productData, warehouse_id })
    
    // 5. Log action
    await logAuditAction('CREATE', 'product', data.id, warehouse_id)
    
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
```

### Example 2: Get Orders

```typescript
export async function getOrders() {
  try {
    // 1. Check role
    await requireAnyRole(['owner', 'superadmin'])
    
    // 2. Build query
    const supabase = await createClient()
    let query = supabase.from('orders').select('*')
    
    // 3. Apply warehouse filter
    query = await applyWarehouseFilter(query)
    
    // 4. Execute
    const { data: orders } = await query
    
    return { success: true, orders }
  } catch (error: any) {
    return { error: error.message }
  }
}
```

### Example 3: Update Product

```typescript
export async function updateProduct(productId: string, formData: FormData) {
  try {
    // 1. Check role
    await requireAnyRole(['owner', 'superadmin'])
    
    // 2. Get existing product to check warehouse
    const supabase = await createClient()
    const { data: product } = await supabase
      .from('products')
      .select('warehouse_id')
      .eq('id', productId)
      .single()
    
    if (!product) {
      return { error: 'Product not found' }
    }
    
    // 3. Validate warehouse access
    await requireWarehouseAccess(product.warehouse_id)
    
    // 4. Proceed with update
    await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
    
    // 5. Log action
    await logAuditAction('UPDATE', 'product', productId, product.warehouse_id)
    
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
```

## Security Best Practices

### 1. Always Validate on Server

```typescript
// ❌ BAD: Client-side only
<button onClick={() => deleteProduct(id)}>Delete</button>

// ✅ GOOD: Server action with validation
export async function deleteProduct(id: string) {
  await requireWarehouseAccess(warehouseId)
  // ... delete logic
}
```

### 2. Never Trust Client Input

```typescript
// ❌ BAD: Trusting warehouse_id from client
const warehouse_id = formData.get('warehouse_id')
await supabase.from('products').insert({ warehouse_id })

// ✅ GOOD: Validate access first
const warehouse_id = formData.get('warehouse_id')
await requireWarehouseAccess(warehouse_id)
await supabase.from('products').insert({ warehouse_id })
```

### 3. Use RLS as Defense in Depth

Even with application-level checks, RLS provides an additional security layer:

```sql
-- RLS ensures superadmins can only see assigned warehouse products
CREATE POLICY "Superadmins see assigned products"
  ON products FOR SELECT
  TO authenticated
  USING (
    warehouse_id IN (
      SELECT warehouse_id FROM user_warehouse_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

## Testing RBAC

### Test 1: Owner Access

```typescript
// Login as owner
// Should see ALL warehouses and products
const products = await getAccessibleProducts()
console.log(products.length) // All products from all warehouses
```

### Test 2: Superadmin Access

```typescript
// Login as superadmin assigned to Warehouse A
// Should ONLY see Warehouse A products
const products = await getAccessibleProducts()
console.log(products.every(p => p.warehouse_id === 'warehouse-a-id')) // true
```

### Test 3: Unauthorized Access

```typescript
// Login as superadmin assigned to Warehouse A
// Try to access Warehouse B product
await requireWarehouseAccess('warehouse-b-id')
// ❌ Throws: "Unauthorized: No access to warehouse..."
```

## Folder Structure

```
app/
├── actions/
│   ├── rbac-products.ts          # RBAC-protected product actions
│   ├── user-management.ts        # Owner-only user management
│   ├── checkout.ts               # Public checkout actions
│   └── orders.ts                 # RBAC-protected order actions
├── (admin)/
│   └── dashboard/
│       ├── products/             # Product management
│       ├── orders/               # Order management
│       ├── users/                # User management (owner only)
│       ├── warehouses/           # Warehouse management
│       └── audit/                # Audit logs (owner only)
lib/
├── auth/
│   └── rbac.ts                   # RBAC utilities
└── supabase/
    ├── client.ts
    ├── server.ts
    └── middleware.ts
```

## Common Patterns

### Pattern 1: Warehouse Selector

```typescript
// Show only accessible warehouses in dropdown
export async function WarehouseSelector() {
  const assignments = await getUserWarehouseAssignments()
  
  return (
    <select name="warehouse_id">
      {assignments.map(a => (
        <option key={a.warehouse_id} value={a.warehouse_id}>
          {a.warehouse_name}
        </option>
      ))}
    </select>
  )
}
```

### Pattern 2: Conditional UI

```typescript
export async function DashboardNav() {
  const profile = await getCurrentUserProfile()
  
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/products">Products</Link>
      <Link href="/dashboard/orders">Orders</Link>
      
      {/* Owner-only links */}
      {profile?.role === 'owner' && (
        <>
          <Link href="/dashboard/users">Users</Link>
          <Link href="/dashboard/audit">Audit Logs</Link>
        </>
      )}
    </nav>
  )
}
```

### Pattern 3: Dynamic Dashboard

```typescript
export async function Dashboard() {
  const profile = await getCurrentUserProfile()
  
  if (profile?.role === 'owner') {
    return <OwnerDashboard />
  }
  
  if (profile?.role === 'superadmin') {
    return <SuperadminDashboard />
  }
  
  return <div>Unauthorized</div>
}
```

## Scaling Considerations

### 1. Caching

Cache user permissions to reduce database queries:

```typescript
import { unstable_cache } from 'next/cache'

export const getCachedWarehouseIds = unstable_cache(
  async (userId: string) => getAccessibleWarehouseIds(),
  ['warehouse-ids'],
  { revalidate: 300 } // 5 minutes
)
```

### 2. Batch Operations

For bulk operations, validate access once:

```typescript
export async function bulkUpdateProducts(productIds: string[]) {
  // Get all products
  const products = await supabase
    .from('products')
    .select('id, warehouse_id')
    .in('id', productIds)
  
  // Validate access to all warehouses
  const warehouseIds = [...new Set(products.map(p => p.warehouse_id))]
  for (const wid of warehouseIds) {
    await requireWarehouseAccess(wid)
  }
  
  // Proceed with bulk update
}
```

### 3. Database Indexes

Ensure proper indexes for performance:

```sql
CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_orders_warehouse ON orders(warehouse_id);
CREATE INDEX idx_assignments_user ON user_warehouse_assignments(user_id);
```

## Next Steps

1. ✅ Run `RBAC-DATABASE-SCHEMA.sql`
2. ✅ Create your owner account
3. ✅ Update existing actions to use RBAC utilities
4. ✅ Create user management UI
5. ✅ Test with different roles
6. ✅ Deploy to production

Your RBAC system is now production-ready!