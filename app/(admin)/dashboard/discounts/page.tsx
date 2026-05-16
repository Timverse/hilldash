import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DiscountsTable } from './discounts-table'

export const dynamic = 'force-dynamic'

export default async function DiscountsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    redirect('/dashboard')
  }

  // Fetch discounts, categories, and products
  const { data: discounts } = await adminClient
    .from('discounts')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: categories } = await adminClient
    .from('categories')
    .select('id, name')
    .order('name')

  const { data: products } = await adminClient
    .from('products')
    .select('id, name, price')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6 font-sans antialiased">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Amazon-Grade Discounts & Offers</h1>
        <p className="text-slate-500 font-medium mt-1">Manage festive promotions, category discounts, product deals, and sitewide coupons.</p>
      </div>

      <DiscountsTable 
        discounts={discounts || []} 
        categories={categories || []} 
        products={products || []} 
      />
    </div>
  )
}
