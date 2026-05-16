import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MapPin, Plus, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
        <div className="mb-12">
          <Link href="/account" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group mb-6">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Account
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Saved <span className="text-primary italic">Addresses</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium mt-3">Manage your delivery locations in Jowai.</p>
            </div>
            <Link href="/checkout">
              <Button className="rounded-2xl font-bold h-12 px-6 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 gap-2">
                <Plus className="w-5 h-5" /> Add New Address
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {uniqueAddresses.length > 0 ? (
            uniqueAddresses.map((address, idx) => (
              <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 mt-1">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-slate-900">Jowai Delivery Hub Zone</h3>
                      {idx === 0 && (
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-3 py-1 text-xs rounded-xl shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed max-w-lg">{address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Link href="/checkout">
                    <Button variant="outline" className="rounded-xl font-bold border-2 h-11 px-6">Use Address</Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                <MapPin className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No saved addresses</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">You haven't saved any delivery addresses yet. They will automatically appear here when you place orders.</p>
              <Link href="/shop">
                <Button className="rounded-full px-10 font-bold h-14 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
                  Go to Shop
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
