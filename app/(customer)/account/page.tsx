import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User, Package, MapPin, Heart, Settings, LogOut, ChevronRight, CreditCard, Clock, Star, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, created_at, total, status')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false })
    .limit(3)

  const userPoints = profile?.points || 0
  const pointsWorth = (userPoints / 1000).toFixed(2)

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 font-sans antialiased">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">
              My <span className="text-primary italic">Account</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium">Welcome back, {profile?.full_name || 'User'}! Ready for some fresh finds?</p>
          </div>
          <div className="flex items-center gap-3">
             <form action="/api/auth/signout" method="POST">
              <Button variant="outline" className="rounded-full border-2 font-bold px-6 h-12 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all">
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
            {/* Profile Bento */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">{profile?.full_name || 'Account Member'}</h2>
                <p className="text-slate-400 text-sm font-medium mb-8">{user.email}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <div>
                        <span className="text-sm font-black text-purple-900 block">HillDash Points</span>
                        <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Worth ₹{pointsWorth}</span>
                      </div>
                    </div>
                    <span className="text-purple-700 font-black text-2xl">{userPoints}</span>
                  </div>
                </div>

                <Link href="/account/profile" className="block mt-8">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold h-12 shadow-lg shadow-slate-900/10">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-900 leading-none">12</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-2">Total Orders</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-900 leading-none">₹2.4k</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-2">Saved This Month</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Links Horizontal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/account/orders" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900">Orders</span>
              </Link>
              <Link href="/account/addresses" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900">Addresses</span>
              </Link>
              <Link href="/account/wishlist" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <Heart className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900">Wishlist</span>
              </Link>
              <Link href="/account/support" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900">Support</span>
              </Link>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Recent Orders</h3>
                  <p className="text-slate-400 text-sm font-medium">Keep track of your latest deliveries</p>
                </div>
                <Link href="/account/orders">
                  <Button variant="outline" className="rounded-full font-bold border-2 gap-2 h-11 px-6 hover:bg-primary hover:text-white">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              {recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link key={order.id} href={`/track/${order.id}`} className="block group">
                      <div className="flex flex-col sm:flex-row justify-between items-center p-6 border border-slate-100 rounded-3xl group-hover:bg-slate-50 group-hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-6 mb-4 sm:mb-0">
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Package className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg leading-none mb-1">#{order.id.slice(0, 8)}</p>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                              Placed on {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="font-black text-slate-900 text-xl leading-none mb-1">₹{order.total.toFixed(2)}</p>
                            <Badge className={`${
                              order.status === 'delivered' ? 'bg-emerald-500' : 
                              order.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'
                            } text-white border-none font-bold uppercase text-[10px] tracking-widest rounded-full px-3`}>
                              {order.status}
                            </Badge>
                          </div>
                          <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border mx-auto flex items-center justify-center text-slate-300 mb-6">
                    <Package className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No orders found</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mb-10 font-medium">You haven't placed any orders yet. Start shopping to see them here!</p>
                  <Link href="/shop">
                    <Button className="rounded-full px-12 font-black h-14 text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
