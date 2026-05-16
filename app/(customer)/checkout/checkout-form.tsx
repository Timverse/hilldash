"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { processCheckoutAction } from "@/app/actions/checkout"
import { toast } from "sonner"
import { MapPin, Loader2, CheckCircle2, ShoppingBag, CreditCard, Info, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { calculateDistanceKm, calculateDeliveryFee } from "@/lib/utils/distance"

interface Warehouse {
  id: string;
  lat: number;
  lng: number;
  radius_km: number;
  name: string;
}

export function CheckoutForm({ warehouse }: { warehouse?: Warehouse | null }) {
  const router = useRouter()
  const { items, getCartTotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [deliveryFee, setDeliveryFee] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getLocation = () => {
    setIsGettingLocation(true)
    setLocationError("")
    
    if (!navigator.geolocation) {
      const defaultLat = warehouse?.lat || 25.4508;
      const defaultLng = warehouse?.lng || 92.1868;
      setLocation({ lat: defaultLat, lng: defaultLng });
      setDistanceKm(0);
      setDeliveryFee(0);
      setIsGettingLocation(false);
      toast.success("Default Jowai delivery zone selected.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setLocation({ lat, lng })
        setIsGettingLocation(false)
        
        if (warehouse) {
          const dist = calculateDistanceKm(lat, lng, warehouse.lat, warehouse.lng)
          setDistanceKm(dist)
          if (dist > warehouse.radius_km) {
            setLocationError(`Sorry, you are outside our delivery zone. Maximum radius is ${warehouse.radius_km}km, but you are ${dist.toFixed(1)}km away.`)
            toast.error("Outside delivery zone!")
          } else {
            const fee = calculateDeliveryFee(dist)
            setDeliveryFee(fee)
            toast.success(`Location verified! Distance: ${dist.toFixed(1)} km (Fee: ₹${fee})`)
          }
        } else {
          toast.success("Location acquired successfully!")
        }
      },
      (error) => {
        const defaultLat = warehouse?.lat || 25.4508;
        const defaultLng = warehouse?.lng || 92.1868;
        setLocation({ lat: defaultLat, lng: defaultLng });
        setDistanceKm(0);
        setDeliveryFee(0);
        setIsGettingLocation(false);
        toast.success("Location bypassed. Selected default Jowai delivery zone.");
      },
      { timeout: 5000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!location) {
      toast.error("Please verify your delivery location before placing order.")
      return
    }

    if (warehouse && distanceKm && distanceKm > warehouse.radius_km) {
      toast.error(`Sorry, you are outside our delivery zone (${warehouse.radius_km}km max).`)
      return
    }

    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.append("latitude", location.lat.toString())
    formData.append("longitude", location.lng.toString())
    formData.append("delivery_fee", deliveryFee.toString())
    formData.append("distance_km", (distanceKm || 0).toString())
    formData.append("cart", JSON.stringify(items))
    formData.append("total", (getCartTotal() + deliveryFee).toString())

    const result = await processCheckoutAction(formData)

    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else if (result.success) {
      clearCart()
      toast.success("Order placed successfully! 🎉")
      setTimeout(() => {
        router.push('/checkout/success')
      }, 1000)
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm font-sans antialiased">
        <div className="w-24 h-24 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center text-slate-300 mb-8 shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Your cart is empty</h3>
        <p className="text-slate-500 max-w-sm mx-auto mb-10 text-lg font-medium">Add some items to your cart before proceeding to checkout.</p>
        <Button onClick={() => router.push('/shop')} className="rounded-full px-12 font-black h-16 text-lg bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20">
          Go to Shop
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12 items-start font-sans antialiased">
      {/* Form Section */}
      <div className="flex-1 w-full">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                  <Input name="name" required placeholder="John Doe" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all px-6 text-lg font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
                  <Input name="phone" required placeholder="9876543210" type="tel" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all px-6 text-lg font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Delivery Address</label>
                <Textarea name="address" required placeholder="House No, Street, Landmark, Area" rows={3} className="rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all p-6 text-lg font-medium" />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 flex justify-between items-center">
                  <span>Exact Delivery Location</span>
                  <AnimatePresence>
                    {location && (
                      <motion.span 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-emerald-600 flex items-center text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1.5" /> 
                        Verified Zone
                      </motion.span>
                    )}
                  </AnimatePresence>
                </label>
                
                <div className="relative group">
                  <Button 
                    type="button" 
                    variant="outline"
                    className={`w-full h-16 rounded-2xl border-2 font-bold text-lg transition-all active:scale-[0.98] ${
                      location 
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                        : 'border-dashed border-primary/30 text-primary hover:border-primary hover:bg-primary/5'
                    }`}
                    onClick={getLocation}
                    disabled={isGettingLocation || location !== null}
                  >
                    {isGettingLocation ? (
                      <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Locating (Auto-fallback in 5s)...</>
                    ) : location ? (
                      <><MapPin className="w-6 h-6 mr-3 text-emerald-600" /> Delivery Location Verified</>
                    ) : (
                      <><MapPin className="w-6 h-6 mr-3" /> Tap for Delivery Location Verification</>
                    )}
                  </Button>
                </div>
                
                {locationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {locationError}
                  </motion.div>
                )}
                
                {!location && !locationError && (
                  <div className="flex items-center gap-2 px-1 text-slate-400 font-medium">
                    <Info className="w-4 h-4" />
                    <p className="text-xs italic">Tap above to instantly confirm your delivery feasibility in Jowai.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Delivery Instructions (Optional)</label>
                <Input name="notes" placeholder="e.g. Near Big Church, blue gate" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all px-6 text-lg font-medium" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Method</h2>
              </div>
              
              <div className="relative group">
                <label className="flex items-center space-x-4 p-6 border-2 border-primary bg-primary/5 rounded-[2rem] cursor-pointer transition-all shadow-lg shadow-primary/5">
                  <div className="w-6 h-6 rounded-full border-4 border-primary flex items-center justify-center bg-white">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <input type="radio" name="payment_method" value="COD" defaultChecked className="hidden" />
                  <div>
                    <p className="font-black text-slate-900 text-lg">Cash on Delivery (COD)</p>
                    <p className="text-slate-500 text-sm font-medium">Pay when your order arrives at your door.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !location || (warehouse && distanceKm !== null ? distanceKm > warehouse.radius_km : false)} 
            className="w-full h-20 text-2xl font-black bg-primary hover:bg-primary/90 text-white rounded-[2rem] shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-8 h-8 mr-3 animate-spin" /> Processing Order...</>
            ) : (
              `Place Order • ₹${(getCartTotal() + (location && distanceKm !== null && distanceKm <= (warehouse?.radius_km || 15) ? deliveryFee : 0)).toFixed(2)}`
            )}
          </Button>

        </form>
      </div>

      {/* Order Summary Sidebar */}
      <div className="w-full lg:w-[400px] shrink-0">
        <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl sticky top-28 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-8 tracking-tight">Order Summary</h2>
            
            <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {items.map(item => (
                <div key={item.product_id} className="flex gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm leading-tight mb-1">{item.name}</p>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-8 border-t border-white/10">
              <div className="flex justify-between text-white/60 text-sm font-medium">
                <span>Subtotal</span>
                <span className="text-white">₹{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-white/60 text-sm font-medium">
                <span>Delivery Fee</span>
                {location && distanceKm !== null && distanceKm <= (warehouse?.radius_km || 15) ? (
                  <span className="text-white font-bold bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">₹{deliveryFee.toFixed(2)}</span>
                ) : (
                  <span className="text-primary font-bold text-xs italic">Calculated at checkout</span>
                )}
              </div>
              
              <div className="pt-6 flex flex-col gap-2">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Payable</p>
                <div className="flex justify-between items-end">
                  <span className="text-5xl font-black text-primary tracking-tighter">
                    ₹{(getCartTotal() + (location && distanceKm !== null && distanceKm <= (warehouse?.radius_km || 15) ? deliveryFee : 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/20 text-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-white/60 font-medium leading-relaxed">
                Your order is protected by <span className="text-white font-bold">HillDash Safety Guarantee</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
