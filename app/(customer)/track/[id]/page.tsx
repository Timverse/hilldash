import { createClient } from "@/lib/supabase/server"
import { MapPin, PackageCheck, ShoppingBag, Truck, AlertCircle, ChevronLeft, Calendar, CreditCard, Box } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LiveRiderTracker } from "@/components/customer/live-rider-tracker"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        products(name, image_url)
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !order) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] border border-slate-100 p-12 text-center shadow-xl max-w-lg w-full">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Order Not Found</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            We couldn't find an order with the ID: <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{resolvedParams.id}</span>. Please check the link and try again.
          </p>
          <div className="flex flex-col gap-4">
            <Link href="/shop">
              <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg">
                Return to Shop
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold text-lg">
                My Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statuses = [
    { id: 'pending', label: 'Order Placed', desc: 'We have received your order', icon: ShoppingBag },
    { id: 'confirmed', label: 'Confirmed', desc: 'The hub has confirmed your items', icon: PackageCheck },
    { id: 'packed', label: 'Packed', desc: 'Items are packed and ready', icon: Box },
    { id: 'out_for_delivery', label: 'Out for Delivery', desc: 'Our rider is on the way', icon: Truck },
    { id: 'delivered', label: 'Delivered', desc: 'Order reached its destination', icon: MapPin },
  ]

  const currentStatusIndex = statuses.findIndex(s => s.id === order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Navigation */}
        <div className="mb-12">
          <Link href="/account/orders" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Orders
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Tracking Card */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
               
               <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
                      Track <span className="text-primary italic">Order</span>
                    </h1>
                    <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">ID: {order.id}</p>
                  </div>
                  {isCancelled && (
                    <Badge className="bg-red-500 text-white border-none font-bold px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px]">
                      Cancelled
                    </Badge>
                  )}
                </div>

                {isCancelled ? (
                  <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center font-bold border border-red-100">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    This order was cancelled. Please contact our support team if you have any questions or would like to reorder.
                  </div>
                ) : (
                  <div className="space-y-10 relative before:absolute before:left-[27px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {statuses.map((status, index) => {
                      const isActive = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const isPast = index < currentStatusIndex;
                      
                      return (
                        <div key={status.id} className="relative pl-16 group">
                          <div className={`absolute left-0 top-0 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 z-10 ${
                            isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <status.icon className={`w-6 h-6 ${isCurrent ? 'animate-pulse' : ''}`} />
                          </div>
                          <div>
                            <h3 className={`text-lg font-black tracking-tight leading-none mb-1 ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                              {status.label}
                            </h3>
                            <p className={`text-sm font-medium ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>
                              {status.desc}
                            </p>
                            {isCurrent && (
                              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Current Status
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
               </div>
            </div>

            {/* Live Rider Tracking Radar Component */}
            {!isCancelled && (
              <LiveRiderTracker 
                orderId={order.id}
                initialLat={order.rider_lat}
                initialLng={order.rider_lng}
                deliveryLat={order.delivery_lat}
                deliveryLng={order.delivery_lng}
                status={order.status}
                riderName={order.rider_name}
                riderPhone={order.rider_phone}
              />
            )}
          </div>

          {/* Sidebar: Order Summary */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
              <h3 className="text-2xl font-black mb-8 relative z-10">Order Summary</h3>
              
              <div className="space-y-6 relative z-10">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden shrink-0">
                      {item.products.image_url ? (
                        <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm leading-tight mb-1">{item.products.name}</h4>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">₹{(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 space-y-4 relative z-10">
                <div className="flex justify-between items-center text-white/60 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Method</span>
                  </div>
                  <span className="font-bold text-white uppercase text-xs tracking-widest">
                    {order.payment_method?.replace(/_/g, ' ') || 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/60 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Ordered At</span>
                  </div>
                  <span className="font-bold text-white uppercase text-xs tracking-widest">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest">Total Amount</p>
                  <p className="text-4xl font-black text-primary">₹{order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 tracking-tight mb-1">Delivery Address</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{order.delivery_address || 'Jowai Central Hub Area, Meghalaya'}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full h-12 rounded-2xl border-2 font-bold hover:bg-slate-50">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

