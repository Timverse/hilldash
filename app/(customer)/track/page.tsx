"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Search, Package, ArrowRight, Truck } from "lucide-react"

export default function TrackSearchPage() {
  const router = useRouter()
  const [orderId, setOrderId] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId.trim()) return

    let cleanId = orderId.trim().replace(/^#/, "").replace(/^ORD-/, "")
    router.push(`/track/${cleanId}`)
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 md:py-20 font-sans antialiased">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group mb-6">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Track <span className="text-primary italic">Order</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium mt-3">Enter your Order ID below to get real-time delivery status in Jowai.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
            <Truck className="w-10 h-10" />
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Order Tracking ID</label>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 12345678 or ORD-123456" 
                  className="pl-14 h-16 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary px-6 text-lg font-medium"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-2">
              Track Delivery <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Need assistance? You can also view all your active and past orders directly from your <Link href="/account/orders" className="text-primary font-bold hover:underline">Account Dashboard</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
