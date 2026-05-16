import { CheckoutForm } from "./checkout-form"
import { ShoppingBag, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('id, lat, lng, radius_km, name')
    .eq('is_active', true)
    .limit(1)
    .single()

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12">
          <Link href="/shop" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mt-6">
            Secure <span className="text-primary italic">Checkout</span>
          </h1>
          <p className="text-slate-500 text-lg mt-4">Review your items and provide delivery details to complete your order.</p>
        </div>
        
        <CheckoutForm warehouse={warehouse || null} />
      </div>
    </div>
  )
}

