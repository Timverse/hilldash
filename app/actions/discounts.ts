'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'

export async function createDiscountAction(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // STRICT ROLE CHECK: ONLY OWNER CAN CREATE DISCOUNTS
    await requireRole('owner')

    const title = formData.get('title') as string
    const code = formData.get('code') as string || null
    const discount_type = formData.get('discount_type') as string
    const discount_value = parseFloat(formData.get('discount_value') as string)
    const target_type = formData.get('target_type') as string
    let target_id = formData.get('target_id') as string || null
    const min_order_value = parseFloat(formData.get('min_order_value') as string) || 0
    let max_discount_amount: number | null = parseFloat(formData.get('max_discount_amount') as string)
    if (isNaN(max_discount_amount)) max_discount_amount = null

    if (target_type === 'all' || !target_id) {
      target_id = null
    }

    const { data, error } = await supabase
      .from('discounts')
      .insert({
        title,
        code,
        discount_type,
        discount_value,
        target_type,
        target_id,
        min_order_value,
        max_discount_amount,
        is_active: formData.get('is_active') === 'on'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating discount:', error)
      return { error: `Failed to create discount: ${error.message}` }
    }

    revalidatePath('/dashboard/discounts', 'page')
    revalidatePath('/checkout', 'page')
    return { success: true, discount: data }
  } catch (error: any) {
    console.error('Authorization error:', error)
    return { error: error.message || 'Unauthorized' }
  }
}

export async function toggleDiscountActiveAction(id: string, is_active: boolean) {
  try {
    const supabase = await createClient()
    await requireRole('owner')

    const { error } = await supabase
      .from('discounts')
      .update({ is_active })
      .eq('id', id)

    if (error) {
      return { error: `Failed to update status: ${error.message}` }
    }

    revalidatePath('/dashboard/discounts', 'page')
    revalidatePath('/checkout', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}

export async function deleteDiscountAction(id: string) {
  try {
    const supabase = await createClient()
    await requireRole('owner')

    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: `Failed to delete discount: ${error.message}` }
    }

    revalidatePath('/dashboard/discounts', 'page')
    revalidatePath('/checkout', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Unauthorized' }
  }
}
