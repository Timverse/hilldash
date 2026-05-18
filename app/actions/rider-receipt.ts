'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveRiderReceiptAction(riderId: string, tokenId: string, totalDeliveries: number, totalEarnings: number) {
  const adminClient = createAdminClient()

  console.log(`=== saveRiderReceiptAction called for rider ${riderId} with token ${tokenId} ===`)

  try {
    const { data, error } = await adminClient
      .from('riders')
      .update({
        active_token_id: tokenId,
        pending_earnings: totalEarnings,
        pending_deliveries: totalDeliveries,
        receipt_generated_at: new Date().toISOString()
      })
      .eq('id', riderId)
      .select()
      .single()

    if (error) {
      console.error('Failed to save rider receipt in riders table:', error)
      return { error: `Database error: ${error.message}. Please ensure you have run the ALTER TABLE SQL snippet in STAFF-ROLE-MANAGEMENT.md.` }
    }

    console.log('Rider receipt saved successfully:', data)
    revalidatePath('/rider', 'page')
    revalidatePath('/dashboard/riders', 'page')
    return { success: true, tokenId }
  } catch (err: any) {
    console.error('Exception in saveRiderReceiptAction:', err)
    return { error: `Server error: ${err?.message || 'Unknown error'}` }
  }
}

export async function verifyRiderReceiptAction(tokenId: string) {
  const adminClient = createAdminClient()

  console.log(`=== verifyRiderReceiptAction called for token ${tokenId} ===`)

  if (!tokenId || !tokenId.trim()) {
    return { error: 'Please enter a valid Token ID' }
  }

  const cleanToken = tokenId.trim().toUpperCase()

  try {
    // Lookup rider by active_token_id
    const { data: rider, error: fetchError } = await adminClient
      .from('riders')
      .select('*')
      .eq('active_token_id', cleanToken)
      .single()

    if (fetchError || !rider) {
      console.error('Rider receipt not found for token:', cleanToken, fetchError)
      return { error: `No pending daily receipt found for Token ID: ${cleanToken}. Please verify the code.` }
    }

    const pendingEarnings = rider.pending_earnings || 0
    const pendingDeliveries = rider.pending_deliveries || 0

    // Update rider's daily verified earnings and clear active token
    const { data: updatedRider, error: updateError } = await adminClient
      .from('riders')
      .update({
        daily_earnings: pendingEarnings, // Insert today's verified earnings
        daily_deliveries: pendingDeliveries,
        last_payout_date: new Date().toISOString(),
        active_token_id: null,
        pending_earnings: 0,
        pending_deliveries: 0
      })
      .eq('id', rider.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to verify rider receipt and insert earnings:', updateError)
      return { error: `Failed to insert earnings: ${updateError.message}` }
    }

    console.log('Rider earnings inserted successfully:', updatedRider)
    revalidatePath('/dashboard/riders', 'page')
    revalidatePath('/rider', 'page')
    
    return { 
      success: true, 
      riderName: updatedRider.name, 
      earningsInserted: pendingEarnings,
      deliveriesCount: pendingDeliveries 
    }
  } catch (err: any) {
    console.error('Exception in verifyRiderReceiptAction:', err)
    return { error: `Server error: ${err?.message || 'Unknown error'}` }
  }
}
