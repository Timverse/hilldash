"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { updateOrderStatusAction } from "@/app/actions/orders"
import { toast } from "sonner"
import { format } from "date-fns"

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
}

const STATUS_FLOW: Record<string, { label: string; next: string | null; nextLabel: string | null; badge: string }> = {
  pending:          { label: "Pending Review",   next: "confirmed",        nextLabel: "Confirm Order",   badge: "bg-blue-100 text-blue-700" },
  confirmed:        { label: "Confirmed",        next: "packed",           nextLabel: "Pack Order",      badge: "bg-indigo-100 text-indigo-700" },
  packed:           { label: "Packed",           next: "out_for_delivery", nextLabel: "Send for Delivery", badge: "bg-amber-100 text-amber-700" },
  out_for_delivery: { label: "Out for Delivery", next: "delivered",        nextLabel: "Mark Delivered",  badge: "bg-purple-100 text-purple-700" },
  delivered:        { label: "Delivered",        next: null,               nextLabel: null,              badge: "bg-emerald-100 text-emerald-700" },
  cancelled:        { label: "Cancelled",        next: null,               nextLabel: null,              badge: "bg-red-100 text-red-700" },
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAdvance = async (orderId: string, nextStatus: string) => {
    setLoadingId(orderId)
    const result = await updateOrderStatusAction(orderId, nextStatus)
    if (result.error) toast.error(result.error)
    else toast.success(`Order updated to "${STATUS_FLOW[nextStatus]?.label}"`)
    setLoadingId(null)
  }

  const handleCancel = async (orderId: string) => {
    setLoadingId(orderId)
    const result = await updateOrderStatusAction(orderId, "cancelled")
    if (result.error) toast.error(result.error)
    else toast.success("Order cancelled")
    setLoadingId(null)
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No orders yet</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-xs">
          When customers place orders from the store, they will appear here instantly.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Customer Info</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const flow = STATUS_FLOW[order.status] || STATUS_FLOW.pending
            const isLoading = loadingId === order.id
            // Parse customer name/phone from dedicated fields or fallback to notes field
            const nameMatch = order.notes?.match(/Name: ([^\n]+)/)
            const phoneMatch = order.notes?.match(/Phone: ([^\n]+)/)
            const customerName = order.customer_name || nameMatch?.[1] || "Guest"
            const customerPhone = order.customer_phone || phoneMatch?.[1] || "-"

            return (
              <TableRow key={order.id} className="hover:bg-slate-50">
                <TableCell className="font-mono text-xs text-slate-500">
                  #{order.id.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                  {format(new Date(order.created_at), "dd MMM, hh:mm a")}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm text-slate-900">{customerName}</p>
                  <p className="text-xs text-slate-500">{customerPhone}</p>
                  {order.delivery_address && (
                    <p className="text-xs text-slate-600 mt-0.5">{order.delivery_address}</p>
                  )}
                  {order.notes && order.notes !== '' && !order.notes.startsWith('Name:') && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-1 inline-block">
                      Note: {order.notes}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-600 capitalize">
                  {order.payment_method?.replace(/_/g, " ") || "—"}
                </TableCell>
                <TableCell className="text-right font-bold text-slate-900">
                  ₹{order.total?.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${flow.badge}`}>
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
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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
                        className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
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
  )
}
