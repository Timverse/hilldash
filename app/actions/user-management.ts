/**
 * User Management Actions (Owner Only)
 * Handles creating users, assigning roles, and managing warehouse assignments
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRole, logAuditAction } from '@/lib/auth/rbac'

/**
 * Get all users (Owner only)
 */
export async function getAllUsers() {
  try {
    const supabase = await createClient()
    
    // Only owners can view all users
    await requireRole('owner')

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch users' }
    }

    return { success: true, users }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Create a new superadmin user (Owner only)
 */
export async function createSuperadmin(data: {
  email: string
  password: string
  full_name: string
  phone?: string
}) {
  try {
    const supabase = await createClient()
    
    // Only owners can create superadmins
    await requireRole('owner')

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true
    })

    if (authError || !authData.user) {
      return { error: `Failed to create user: ${authError?.message}` }
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        role: 'superadmin',
        full_name: data.full_name,
        phone: data.phone || null,
        is_active: true
      })

    if (profileError) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { error: 'Failed to create profile' }
    }

    // Log audit action
    await logAuditAction(
      'CREATE',
      'user',
      authData.user.id,
      null,
      { email: data.email, role: 'superadmin' }
    )

    revalidatePath('/dashboard/users', 'page')
    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Assign warehouses to a superadmin (Owner only)
 */
export async function assignWarehousesToUser(
  userId: string,
  warehouseIds: string[]
) {
  try {
    const supabase = await createClient()
    
    // Only owners can assign warehouses
    const profile = await requireRole('owner')

    // First, deactivate all existing assignments
    await supabase
      .from('user_warehouse_assignments')
      .update({ is_active: false })
      .eq('user_id', userId)

    // Then create new assignments
    if (warehouseIds.length > 0) {
      const assignments = warehouseIds.map(warehouseId => ({
        user_id: userId,
        warehouse_id: warehouseId,
        assigned_by: profile.id,
        is_active: true
      }))

      const { error: insertError } = await supabase
        .from('user_warehouse_assignments')
        .upsert(assignments, {
          onConflict: 'user_id,warehouse_id',
          ignoreDuplicates: false
        })

      if (insertError) {
        return { error: 'Failed to assign warehouses' }
      }
    }

    // Log audit action
    await logAuditAction(
      'ASSIGN_WAREHOUSES',
      'user',
      userId,
      null,
      { warehouse_count: warehouseIds.length }
    )

    revalidatePath('/dashboard/users', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Get user's warehouse assignments (Owner only)
 */
export async function getUserWarehouseAssignments(userId: string) {
  try {
    const supabase = await createClient()
    
    // Only owners can view assignments
    await requireRole('owner')

    const { data: assignments, error } = await supabase
      .from('user_warehouse_assignments')
      .select(`
        *,
        warehouses!user_warehouse_assignments_warehouse_id_fkey(id, name, address)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      return { error: 'Failed to fetch assignments' }
    }

    return { success: true, assignments }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Update user status (Owner only)
 */
export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    const supabase = await createClient()
    
    // Only owners can update user status
    await requireRole('owner')

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (error) {
      return { error: 'Failed to update user status' }
    }

    // Log audit action
    await logAuditAction(
      isActive ? 'ACTIVATE' : 'DEACTIVATE',
      'user',
      userId,
      null,
      { is_active: isActive }
    )

    revalidatePath('/dashboard/users', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Delete user (Owner only)
 */
export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient()
    
    // Only owners can delete users
    await requireRole('owner')

    // Delete from auth (this will cascade to profiles due to FK)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      return { error: 'Failed to delete user' }
    }

    // Log audit action
    await logAuditAction(
      'DELETE',
      'user',
      userId,
      null,
      {}
    )

    revalidatePath('/dashboard/users', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Get audit logs (Owner only)
 */
export async function getAuditLogs(filters?: {
  userId?: string
  warehouseId?: string
  resourceType?: string
  limit?: number
}) {
  try {
    const supabase = await createClient()
    
    // Only owners can view audit logs
    await requireRole('owner')

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles!audit_logs_user_id_fkey(email, full_name),
        warehouses!audit_logs_warehouse_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 100)

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.warehouseId) {
      query = query.eq('warehouse_id', filters.warehouseId)
    }

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType)
    }

    const { data: logs, error } = await query

    if (error) {
      return { error: 'Failed to fetch audit logs' }
    }

    return { success: true, logs }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}
