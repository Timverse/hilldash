import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Clock } from 'lucide-react'
import { OrdersTable } from './orders-table'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      status,
      total,
      payment_method,
      notes,
      customer_name,
      customer_phone,
      delivery_address,
      warehouse_id,
      order_items (
        id,
        quantity,
        price_at_time,
        product_id,
        products (
          name,
          image_url,
          batch_number,
          expiry_date,
          unit
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusCounts = {
    received: orders?.filter(o => o.status === 'received').length || 0,
    preparing: orders?.filter(o => o.status === 'preparing').length || 0,
    out_for_delivery: orders?.filter(o => o.status === 'out_for_delivery').length || 0,
    delivered: orders?.filter(o => o.status === 'delivered').length || 0,
  }

  return (
    <div className="space-y-6 font-sans antialiased">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Orders & Packing Lists</h1>
        <p className="text-slate-500 mt-1 font-medium">Monitor incoming orders, inspect exact item packing lists, and dispatch riders.</p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'New / Received', count: statusCounts.received, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Preparing', count: statusCounts.preparing, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Out for Delivery', count: statusCounts.out_for_delivery, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Delivered', count: statusCounts.delivered, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-6 ${s.color} shadow-sm flex flex-col justify-between`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">{s.label}</p>
            <p className="text-4xl font-black mt-2">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 shadow-sm">
          <p className="font-bold">Could not load orders.</p>
          <p className="text-sm mt-1">Ensure the <code>orders</code> table exists in your database and run the required SQL migrations.</p>
        </div>
      ) : (
        <OrdersTable orders={orders || []} />
      )}
    </div>
  )
}
