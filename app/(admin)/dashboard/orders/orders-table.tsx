"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { updateOrderStatusAction } from "@/app/actions/orders"
import { toast } from "sonner"
import { format } from "date-fns"
import { PackageCheck, ShoppingBag, CheckSquare, Square, ArrowRight, Truck, AlertCircle, FileText } from "lucide-react"

type OrderItem = {
  id: string
  quantity: number
  price_at_time: number
  product_id: string
  products?: {
    name: string
    image_url?: string
    batch_number?: string
    expiry_date?: string
    unit?: string
  }
}

type Order = {
  id: string
  created_at: string
  status: string
  total: number
  payment_method?: string
  notes?: string
  customer_name?: string
  customer_phone?: string
  delivery_address?: string
  order_items?: OrderItem[]
}

const STATUS_FLOW: Record<string, { label: string; next: string | null; nextLabel: string | null; badge: string }> = {
  received:         { label: "Received",         next: "preparing",        nextLabel: "Start Packing",   badge: "bg-blue-100 text-blue-700 border border-blue-200" },
  preparing:        { label: "Preparing",        next: "packed",           nextLabel: "Mark Packed",     badge: "bg-amber-100 text-amber-700 border border-amber-200" },
  packed:           { label: "Packed",           next: "out_for_delivery", nextLabel: "Dispatch Rider",  badge: "bg-indigo-100 text-indigo-700 border border-indigo-200" },
  out_for_delivery: { label: "Out for Delivery", next: "delivered",        nextLabel: "Mark Delivered",  badge: "bg-purple-100 text-purple-700 border border-purple-200" },
  delivered:        { label: "Delivered",        next: null,               nextLabel: null,              badge: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  cancelled:        { label: "Cancelled",        next: null,               nextLabel: null,              badge: "bg-red-100 text-red-700 border border-red-200" },
  pending:          { label: "Pending Review",   next: "confirmed",        nextLabel: "Confirm Order",   badge: "bg-slate-100 text-slate-700 border border-slate-200" },
  confirmed:        { label: "Confirmed",        next: "packed",           nextLabel: "Pack Order",      badge: "bg-indigo-100 text-indigo-700 border border-indigo-200" },
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({})

  const handleAdvance = async (orderId: string, nextStatus: string) => {
    setLoadingId(orderId)
    const result = await updateOrderStatusAction(orderId, nextStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Order updated to "${STATUS_FLOW[nextStatus]?.label || nextStatus}"`)
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
      }
    }
    setLoadingId(null)
  }

  const handleCancel = async (orderId: string) => {
    setLoadingId(orderId)
    const result = await updateOrderStatusAction(orderId, "cancelled")
    if (result.error) toast.error(result.error)
    else toast.success("Order cancelled")
    setLoadingId(null)
  }

  const togglePackedItem = (itemId: string) => {
    setPackedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 text-slate-400 shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">No orders yet</h3>
        <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
          When customers place orders from the storefront, they will appear here instantly for warehouse packing and dispatch.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm font-sans antialiased">
        <Table>
          <TableHeader className="bg-slate-50/75 border-b border-slate-100">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Order ID</TableHead>
              <TableHead className="font-bold text-slate-700">Time</TableHead>
              <TableHead className="font-bold text-slate-700">Customer Info</TableHead>
              <TableHead className="font-bold text-slate-700">Packing List</TableHead>
              <TableHead className="font-bold text-slate-700">Payment</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Total</TableHead>
              <TableHead className="text-center font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-center font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const flow = STATUS_FLOW[order.status] || STATUS_FLOW.pending
              const isLoading = loadingId === order.id
              const nameMatch = order.notes?.match(/Name: ([^\n]+)/)
              const phoneMatch = order.notes?.match(/Phone: ([^\n]+)/)
              const customerName = order.customer_name || nameMatch?.[1] || "Guest"
              const customerPhone = order.customer_phone || phoneMatch?.[1] || "-"
              const itemCount = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0

              return (
                <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-slate-600">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                    {format(new Date(order.created_at), "dd MMM, hh:mm a")}
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-sm text-slate-900">{customerName}</p>
                    <p className="text-xs font-semibold text-slate-500">{customerPhone}</p>
                    {order.delivery_address && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 max-w-xs bg-slate-50 p-1 rounded border border-slate-100">{order.delivery_address}</p>
                    )}
                    {order.notes && order.notes !== '' && !order.notes.startsWith('Name:') && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-1 inline-block font-medium shadow-sm">
                        Note: {order.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        // Reset packed state for this order's items
                        const initialPacked: Record<string, boolean> = {}
                        order.order_items?.forEach(i => { initialPacked[i.id] = false })
                        setPackedItems(initialPacked)
                      }}
                      className="rounded-xl font-bold gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      {itemCount} {itemCount === 1 ? 'Item' : 'Items'} (View List)
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600 capitalize">
                    {order.payment_method?.replace(/_/g, " ") || "Cash on Delivery"}
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900 text-base">
                    ₹{order.total?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${flow.badge}`}>
                      {flow.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {flow.next && (
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleAdvance(order.id, flow.next!)}
                          className="h-8 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        >
                          {flow.nextLabel}
                        </Button>
                      )}
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => handleCancel(order.id)}
                          className="h-8 rounded-xl text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* WAREHOUSE PACKING LIST DIALOG / MODAL */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-8 bg-white border border-slate-100 shadow-2xl font-sans antialiased overflow-hidden">
          {selectedOrder && (
            <>
              <DialogHeader className="space-y-2 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500 text-white border-none font-bold uppercase tracking-widest px-3 py-1 text-[10px] rounded-full">
                    Warehouse Packing Slip
                  </Badge>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Packing List for {selectedOrder.customer_name || "Customer"}</span>
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-sm font-medium">
                  Physically verify and check off items below before sealing the delivery parcel.
                </DialogDescription>
              </DialogHeader>

              {/* Items Table */}
              <div className="py-4 max-h-[400px] overflow-y-auto pr-2 space-y-3">
                {selectedOrder.order_items?.map((item) => {
                  const isPacked = !!packedItems[item.id]
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => togglePackedItem(item.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isPacked ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                          {item.products?.image_url ? (
                            <img src={item.products.image_url} alt={item.products?.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-bold text-base leading-none mb-1 ${isPacked ? 'text-slate-900 line-through opacity-80' : 'text-slate-900'}`}>
                            {item.products?.name || "Product Item"}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Qty: {item.quantity} {item.products?.unit || 'Units'}
                            </span>
                            <span>₹{item.price_at_time?.toFixed(2)} each</span>
                          </div>
                          {item.products?.batch_number && (
                            <p className="text-[10px] font-mono text-slate-400 mt-1">
                              Batch: <span className="font-bold text-slate-600">{item.products.batch_number}</span> 
                              {item.products.expiry_date && ` (Exp: ${format(new Date(item.products.expiry_date), 'MMM yyyy')})`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="font-black text-slate-900 text-base">₹{(item.quantity * item.price_at_time).toFixed(2)}</p>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subtotal</span>
                        </div>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
                          isPacked ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-transparent hover:border-slate-300'
                        }`}>
                          <CheckSquare className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <DialogFooter className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-xs text-slate-500 font-medium">Total Order Amount</p>
                  <p className="text-2xl font-black text-slate-900">₹{selectedOrder.total?.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedOrder(null)}
                    className="w-full sm:w-auto h-12 rounded-xl font-bold border-2"
                  >
                    Close Slip
                  </Button>
                  
                  {selectedOrder.status === 'received' || selectedOrder.status === 'preparing' || selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed' ? (
                    <Button 
                      onClick={() => handleAdvance(selectedOrder.id, 'packed')}
                      className="w-full sm:w-auto h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-2"
                    >
                      <PackageCheck className="w-5 h-5" />
                      Mark Packed & Dispatch Rider
                    </Button>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 border border-slate-200 font-bold px-4 py-2 text-sm rounded-xl">
                      Status: {selectedOrder.status.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
