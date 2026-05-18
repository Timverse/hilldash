import { CheckoutForm } from "./checkout-form"
import { ShoppingBag, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('id, lat, lng, radius_km, name')
    .eq('is_active', true)
    .limit(1)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  let userPoints = 0
  if (user) {
    let { data: profile } = await adminClient.from('profiles').select('points').eq('id', user.id).single()
    if (!profile) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Sawaïom Member'
      const phone = user.user_metadata?.phone || null
      const { data: newProfile } = await adminClient.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        phone: phone,
        role: 'customer',
        is_active: true,
        points: 100, // 100 Welcome Points
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }).select('points').single()
      profile = newProfile
    }
    userPoints = profile?.points || 0
  }

  // Fetch active discounts/promotions
  const { data: discounts } = await supabase
    .from('discounts')
    .select('*')
    .eq('is_active', true)

  // Fetch products mapping for category discount calculations
  const { data: products } = await supabase
    .from('products')
    .select('id, category_id')

  // Fetch global settings for emergency delivery configuration
  const { data: settings } = await supabase
    .from('global_settings')
    .select('*')

  const emergencySetting = settings?.find(s => s.key === 'emergency_delivery_enabled')?.value
  const emergencyEnabled = emergencySetting === undefined || emergencySetting === 'true'
  const emergencyFee = parseFloat(settings?.find(s => s.key === 'emergency_delivery_fee')?.value || '20')

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 md:py-20 font-sans antialiased">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12">
          <Link href="/shop" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mt-6">
            Secure <span className="text-primary italic">Checkout</span>
          </h1>
          <p className="text-slate-500 text-lg mt-4 font-medium">Review your items and provide delivery details to complete your order.</p>
        </div>
        
        <CheckoutForm 
          warehouse={warehouse || null} 
          userPoints={userPoints} 
          discounts={discounts || []} 
          products={products || []}
          emergencyEnabled={emergencyEnabled}
          emergencyFee={emergencyFee}
        />
      </div>
    </div>
  )
}
