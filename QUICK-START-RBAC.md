# RBAC Quick Start Guide

## What You Got

A complete, production-ready Role-Based Access Control system for your multi-warehouse grocery platform.

## Files Created

1. **`RBAC-DATABASE-SCHEMA.sql`** - Complete database schema with RLS policies
2. **`lib/auth/rbac.ts`** - Authorization utilities
3. **`app/actions/rbac-products.ts`** - Example RBAC-protected product actions
4. **`app/actions/user-management.ts`** - Owner-only user management
5. **`RBAC-IMPLEMENTATION-GUIDE.md`** - Comprehensive implementation guide

## 5-Minute Setup

### Step 1: Run Database Schema (2 min)

```bash
# In Supabase SQL Editor:
1. Open RBAC-DATABASE-SCHEMA.sql
2. Copy all content
3. Paste in SQL Editor
4. Click "Run"
```

### Step 2: Create Owner Account (1 min)

```sql
-- After signing up, run this:
UPDATE profiles 
SET role = 'owner', full_name = 'Your Name'
WHERE email = 'your-email@example.com';
```

### Step 3: Test It (2 min)

```typescript
// In any server action:
import { getCurrentUserProfile } from '@/lib/auth/rbac'

const profile = await getCurrentUserProfile()
console.log(profile.role) // 'owner'
```

## Key Features

### ✅ Owner Role
- Full system access
- Manages all warehouses
- Creates/manages superadmins
- Views all analytics

### ✅ Superadmin Role
- Assigned to specific warehouses
- Can ONLY see assigned warehouse data
- Cannot access other warehouses
- Cannot manage other admins

### ✅ Security
- Row Level Security (RLS) policies
- Server-side validation
- Audit logging
- Horizontal privilege escalation prevention

## Usage Examples

### Check User Role

```typescript
import { hasRole, isOwner } from '@/lib/auth/rbac'

if (await isOwner()) {
  // Show owner-only features
}
```

### Protect Server Actions

```typescript
import { requireAnyRole, requireWarehouseAccess } from '@/lib/auth/rbac'

export async function createProduct(formData: FormData) {
  // Require owner or superadmin
  await requireAnyRole(['owner', 'superadmin'])
  
  // Validate warehouse access
  const warehouse_id = formData.get('warehouse_id') as string
  await requireWarehouseAccess(warehouse_id)
  
  // Proceed with creation
}
```

### Filter by Accessible Warehouses

```typescript
import { applyWarehouseFilter } from '@/lib/auth/rbac'

let query = supabase.from('products').select('*')
query = await applyWarehouseFilter(query)
// Owner: sees all products
// Superadmin: sees only assigned warehouse products
```

### Get Accessible Warehouses

```typescript
import { getAccessibleWarehouseIds } from '@/lib/auth/rbac'

const warehouseIds = await getAccessibleWarehouseIds()
// Owner: all warehouse IDs
// Superadmin: assigned warehouse IDs only
```

## Create Superadmin

```typescript
import { createSuperadmin, assignWarehousesToUser } from '@/app/actions/user-management'

// 1. Create superadmin
const result = await createSuperadmin({
  email: 'admin@example.com',
  password: 'secure-password',
  full_name: 'John Doe',
  phone: '9876543210'
})

// 2. Assign warehouses
await assignWarehousesToUser(
  result.userId,
  ['warehouse-id-1', 'warehouse-id-2']
)
```

## Dashboard Behavior

### Owner Dashboard
```typescript
// Shows ALL warehouses and products
const products = await getAccessibleProducts()
// Returns products from ALL warehouses
```

### Superadmin Dashboard
```typescript
// Shows ONLY assigned warehouses
const products = await getAccessibleProducts()
// Returns products from ASSIGNED warehouses only
```

## Security Guarantees

### ✅ Warehouse Isolation
```typescript
// Superadmin assigned to Warehouse A
await requireWarehouseAccess('warehouse-b-id')
// ❌ Throws: "Unauthorized: No access to warehouse..."
```

### ✅ RLS Protection
```sql
-- Even if application code is bypassed, RLS blocks unauthorized access
SELECT * FROM products WHERE warehouse_id = 'unauthorized-id'
-- Returns 0 rows for superadmin without access
```

### ✅ Audit Trail
```typescript
// Every action is logged
await logAuditAction('CREATE', 'product', productId, warehouseId)
// Stored in audit_logs table
```

## Testing Checklist

- [ ] Owner can see all warehouses
- [ ] Owner can create superadmins
- [ ] Owner can assign warehouses to superadmins
- [ ] Superadmin can only see assigned warehouses
- [ ] Superadmin cannot access other warehouses
- [ ] Superadmin cannot create other admins
- [ ] All actions are logged in audit_logs

## Common Issues

### Issue: "Unauthorized: Not authenticated"
**Fix:** User is not logged in. Check authentication.

### Issue: "Unauthorized: Requires owner role"
**Fix:** User doesn't have required role. Check profile.role in database.

### Issue: "No access to warehouse"
**Fix:** Superadmin not assigned to warehouse. Use `assignWarehousesToUser()`.

## Next Steps

1. Read `RBAC-IMPLEMENTATION-GUIDE.md` for detailed examples
2. Update your existing actions to use RBAC utilities
3. Create user management UI for owners
4. Test with different roles
5. Deploy to production

## Support

Check these files for more details:
- `RBAC-IMPLEMENTATION-GUIDE.md` - Full implementation guide
- `lib/auth/rbac.ts` - All available utilities
- `app/actions/rbac-products.ts` - Example implementations
- `app/actions/user-management.ts` - User management examples

Your RBAC system is ready to use! 🚀
