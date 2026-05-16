/**
 * RBAC (Role-Based Access Control) Utilities
 * Handles authorization and permission checks for multi-warehouse system
 */

import { createClient } from '@/lib/supabase/server'

export type UserRole = 'owner' | 'superadmin' | 'warehouse_admin' | 'customer'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  phone: string | null
  is_active: boolean
}

export interface WarehouseAssignment {
  warehouse_id: string
  warehouse_name: string
  assigned_at: string
}

/**
 * Get the current authenticated user's profile with role
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, full_name, phone, is_active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return profile as UserProfile
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.role === requiredRole
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile ? roles.includes(profile.role) : false
}

/**
 * Check if user is an owner (has full access)
 */
export async function isOwner(): Promise<boolean> {
  return hasRole('owner')
}

/**
 * Check if user is a superadmin
 */
export async function isSuperadmin(): Promise<boolean> {
  return hasRole('superadmin')
}

/**
 * Get all warehouse IDs accessible to the current user
 * - Owner: returns all warehouse IDs
 * - Superadmin: returns assigned warehouse IDs
 * - Others: returns empty array
 */
export async function getAccessibleWarehouseIds(): Promise<string[]> {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return []
  }

  // Owner has access to all warehouses
  if (profile.role === 'owner') {
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('is_active', true)

    return warehouses?.map(w => w.id) || []
  }

  // Superadmin has access to assigned warehouses
  if (profile.role === 'superadmin') {
    const { data: assignments } = await supabase
      .from('user_warehouse_assignments')
      .select('warehouse_id')
      .eq('user_id', profile.id)
      .eq('is_active', true)

    return assignments?.map(a => a.warehouse_id) || []
  }

  // Other roles have no warehouse access
  return []
}

/**
 * Check if user has access to a specific warehouse
 */
export async function hasWarehouseAccess(warehouseId: string): Promise<boolean> {
  const accessibleIds = await getAccessibleWarehouseIds()
  return accessibleIds.includes(warehouseId)
}

/**
 * Get detailed warehouse assignments for current user
 */
export async function getUserWarehouseAssignments(): Promise<WarehouseAssignment[]> {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return []
  }

  // Owner gets all warehouses
  if (profile.role === 'owner') {
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id, name, created_at')
      .eq('is_active', true)

    return warehouses?.map(w => ({
      warehouse_id: w.id,
      warehouse_name: w.name,
      assigned_at: w.created_at
    })) || []
  }

  // Superadmin gets assigned warehouses
  if (profile.role === 'superadmin') {
    const { data: assignments } = await supabase
      .from('user_warehouse_assignments')
      .select(`
        warehouse_id,
        assigned_at,
        warehouses!user_warehouse_assignments_warehouse_id_fkey(name)
      `)
      .eq('user_id', profile.id)
      .eq('is_active', true)

    return assignments?.map(a => ({
      warehouse_id: a.warehouse_id,
      warehouse_name: (a.warehouses as any)?.name || 'Unknown',
      assigned_at: a.assigned_at
    })) || []
  }

  return []
}

/**
 * Require specific role - throws error if user doesn't have it
 */
export async function requireRole(requiredRole: UserRole): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    throw new Error('Unauthorized: Not authenticated')
  }

  if (profile.role !== requiredRole) {
    throw new Error(`Unauthorized: Requires ${requiredRole} role`)
  }

  return profile
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: UserRole[]): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    throw new Error('Unauthorized: Not authenticated')
  }

  if (!roles.includes(profile.role)) {
    throw new Error(`Unauthorized: Requires one of: ${roles.join(', ')}`)
  }

  return profile
}

/**
 * Require warehouse access - throws error if user doesn't have access
 */
export async function requireWarehouseAccess(warehouseId: string): Promise<void> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    throw new Error('Unauthorized: Not authenticated')
  }

  // Owner has access to all warehouses
  if (profile.role === 'owner') {
    return
  }

  // Check if user has access to this warehouse
  const hasAccess = await hasWarehouseAccess(warehouseId)

  if (!hasAccess) {
    throw new Error(`Unauthorized: No access to warehouse ${warehouseId}`)
  }
}

/**
 * Filter query by accessible warehouses
 * Automatically adds warehouse_id filter based on user's permissions
 */
export async function applyWarehouseFilter<T>(
  query: any,
  warehouseIdColumn: string = 'warehouse_id'
): Promise<any> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    throw new Error('Unauthorized: Not authenticated')
  }

  // Owner sees everything - no filter needed
  if (profile.role === 'owner') {
    return query
  }

  // Superadmin sees only assigned warehouses
  if (profile.role === 'superadmin') {
    const warehouseIds = await getAccessibleWarehouseIds()
    
    if (warehouseIds.length === 0) {
      // No warehouses assigned - return query that returns nothing
      return query.eq(warehouseIdColumn, '00000000-0000-0000-0000-000000000000')
    }

    return query.in(warehouseIdColumn, warehouseIds)
  }

  // Other roles shouldn't access warehouse data
  throw new Error('Unauthorized: Insufficient permissions')
}

/**
 * Log user action for audit trail
 */
export async function logAuditAction(
  action: string,
  resourceType: string,
  resourceId: string | null = null,
  warehouseId: string | null = null,
  details: Record<string, any> = {}
): Promise<void> {
  const supabase = await createClient()
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return // Don't log if not authenticated
  }

  await supabase.from('audit_logs').insert({
    user_id: profile.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    warehouse_id: warehouseId,
    details
  })
}
