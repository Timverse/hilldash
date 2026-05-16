import { createClient } from '@/lib/supabase/server'
import { WarehouseTable } from './warehouse-table'
import { redirect } from 'next/navigation'

export default async function WarehousesPage() {
  const supabase = await createClient()

  // 1. Verify user role is strictly 'owner'
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    redirect('/dashboard') // Redirect superadmin/warehouse_admin to their hub overview
  }

  // 2. Fetch warehouses for owner
  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Warehouses & Hubs</h1>
        <p className="text-slate-500">Manage central hubs, geographical coordinates, and delivery zones (Owner Access Only).</p>
      </div>

      <WarehouseTable warehouses={warehouses || []} />
    </div>
  )
}
