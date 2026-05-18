'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) {
    console.error('updateOrderStatusAction error:', error)
    return { error: 'Failed to update order status' }
  }

  // REAL-TIME FINANCE LEDGER UPDATE: "or COD will be reflected after mark delivered by the rider."
  if (newStatus === 'delivered') {
    const { data: order } = await adminClient.from('orders').select('total, payment_method').eq('id', orderId).single()
    
    if (order && order.payment_method !== 'online') {
      const { error: financeError } = await adminClient
        .from('business_finance_reports')
        .insert({
          transaction_type: 'income',
          category: 'order_revenue',
          amount: order.total || 0,
          payment_method: 'cash',
          description: `Order #${orderId.slice(0, 8).toUpperCase()} Revenue (Cash on Delivery / COD)`,
          reference_id: orderId,
          created_at: new Date().toISOString(),
          recorded_by: 'Automated Delivery'
        })
      if (financeError) {
        console.error('Failed to log COD order revenue in finance ledger:', financeError)
      } else {
        console.log('Logged COD order revenue in finance ledger successfully')
      }
    }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/finance')
  revalidatePath('/dashboard')
  revalidatePath(`/track/${orderId}`)
  return { success: true }
}

export async function broadcastRiderLocation(orderId: string, lat: number, lng: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ 
      rider_lat: lat, 
      rider_lng: lng,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) {
    console.error('broadcastRiderLocation error:', error)
    return { error: 'Failed to broadcast rider location' }
  }

  revalidatePath(`/track/${orderId}`)
  return { success: true }
}
