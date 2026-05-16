'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) {
    console.error('updateOrderStatusAction error:', error)
    return { error: 'Failed to update order status' }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
  return { success: true }
}
