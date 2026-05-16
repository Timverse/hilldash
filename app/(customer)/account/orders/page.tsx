import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, ChevronRight, ArrowLeft, Search, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, total, status')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-slate-50/50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumbs & Header */}
        <div className="mb-12">
          <Link href="/account" className="inline-flex items-center gap-2 text-primary font-bold mb-6 hover:underline group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">
                Order <span className="text-primary italic">History</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium">Manage and track all your past orders.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-9 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-primary w-[200px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <Link key={order.id} href={`/track/${order.id}`} className="block group">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:border-primary/20 transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary rounded-2xl flex items-center justify-center shrink-0 transition-colors">
                        <Package className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-slate-900 leading-none">Order #{order.id.slice(0, 8)}</h3>
                          <Badge className={`${
                            order.status === 'delivered' ? 'bg-emerald-500' : 
                            order.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'
                          } text-white border-none font-bold uppercase text-[10px] tracking-widest rounded-full px-3`}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                          Placed on {new Date(order.created_at).toLocaleDateString(undefined, { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })} at {new Date(order.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="mt-4 flex items-center gap-4">
                          <Button variant="link" className="p-0 h-auto text-primary font-bold hover:no-underline">
                            View Details
                          </Button>
                          <div className="w-1 h-1 bg-slate-300 rounded-full" />
                          <Button variant="link" className="p-0 h-auto text-slate-400 font-bold hover:no-underline">
                            Download Invoice
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 pt-6 md:pt-0 border-t md:border-none border-slate-50">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Amount</p>
                      <p className="text-3xl font-black text-slate-900 leading-none">₹{order.total.toFixed(2)}</p>
                      <div className="hidden md:flex items-center gap-1 text-primary font-bold text-xs mt-2 group-hover:translate-x-1 transition-transform">
                        Track Order
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center text-slate-300 mb-8">
                <Package className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">No orders yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-10 text-lg">Your order history is empty. Time to fill it up with some fresh goodness!</p>
              <Link href="/shop">
                <Button className="rounded-full px-12 font-black h-16 text-lg bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20">
                  Browse Shop
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
