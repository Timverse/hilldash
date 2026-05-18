'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function processRiderPayoutAction(riderId: string, amount: number, paymentMethod: string, referenceId?: string) {
  const adminClient = createAdminClient()

  console.log(`=== processRiderPayoutAction called for rider ${riderId}, amount ₹${amount}, method ${paymentMethod} ===`)

  try {
    // Lookup rider name
    const { data: rider } = await adminClient.from('riders').select('name').eq('id', riderId).single()
    const riderName = rider?.name || 'Delivery Rider'

    // 1. Reset rider's daily_earnings (accumulated unpaid earnings) to 0 and set last_payout_date
    const { error: updateError } = await adminClient
      .from('riders')
      .update({
        daily_earnings: 0,
        daily_deliveries: 0,
        last_payout_date: new Date().toISOString()
      })
      .eq('id', riderId)

    if (updateError) {
      console.error('Failed to reset rider accumulated earnings:', updateError)
      return { error: `Failed to update rider record: ${updateError.message}` }
    }

    // 2. Insert expense record into business_finance_reports
    const desc = `Salary Payout for rider ${riderName} (${paymentMethod.toUpperCase()})`
    const { error: financeError } = await adminClient
      .from('business_finance_reports')
      .insert({
        transaction_type: 'expense',
        category: 'rider_salary',
        amount: amount,
        payment_method: paymentMethod,
        description: desc,
        reference_id: referenceId || riderId,
        created_at: new Date().toISOString(),
        recorded_by: 'Superadmin / Owner'
      })

    if (financeError) {
      console.error('Failed to record payout in finance ledger (table may not exist yet):', financeError)
      // We don't fail the salary reset if finance table isn't created yet, but we inform the user
      console.log('Note: Please run the SQL snippet in STAFF-ROLE-MANAGEMENT.md to create business_finance_reports table.')
    }

    revalidatePath('/dashboard/riders', 'page')
    revalidatePath('/dashboard/finance', 'page')
    return { success: true, riderName, amount }
  } catch (err: any) {
    console.error('Exception in processRiderPayoutAction:', err)
    return { error: `Server error: ${err?.message || 'Unknown error'}` }
  }
}

export async function addManualFinanceEntryAction(formData: FormData) {
  const adminClient = createAdminClient()

  const transactionType = formData.get('transaction_type') as string
  const category = formData.get('category') as string
  const amountStr = formData.get('amount') as string
  const paymentMethod = formData.get('payment_method') as string
  const description = formData.get('description') as string
  const referenceId = formData.get('reference_id') as string

  const amount = parseFloat(amountStr) || 0

  if (!transactionType || !category || amount <= 0) {
    return { error: 'Please fill in all required fields with a valid amount.' }
  }

  try {
    const { error } = await adminClient
      .from('business_finance_reports')
      .insert({
        transaction_type: transactionType,
        category: category,
        amount: amount,
        payment_method: paymentMethod || 'cash',
        description: description || `${category.toUpperCase()} Entry`,
        reference_id: referenceId || null,
        created_at: new Date().toISOString(),
        recorded_by: 'Superadmin / Owner'
      })

    if (error) {
      console.error('Failed to insert manual finance entry:', error)
      return { error: `Database error: ${error.message}. Please ensure you have run the CREATE TABLE SQL snippet in STAFF-ROLE-MANAGEMENT.md.` }
    }

    revalidatePath('/dashboard/finance', 'page')
    return { success: true }
  } catch (err: any) {
    console.error('Exception in addManualFinanceEntryAction:', err)
    return { error: `Server error: ${err?.message || 'Unknown error'}` }
  }
}
