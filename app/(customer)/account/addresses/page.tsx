import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AddressesClient } from './addresses-client'

export const dynamic = 'force-dynamic'

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('delivery_address')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false })

  const uniqueAddresses = Array.from(new Set(orders?.map(o => o.delivery_address).filter(Boolean)))

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 font-sans antialiased">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group mb-6">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Account
          </Link>
        </div>

        <AddressesClient legacyAddresses={uniqueAddresses as string[]} />
      </div>
    </div>
  )
}
