"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { processCheckoutAction } from "@/app/actions/checkout"
import { toast } from "sonner"
import { MapPin, Loader2, CheckCircle2, ShoppingBag, CreditCard, Info, AlertCircle, Clock, Calendar, Sparkles, Tag, Gift, User, ArrowRight, ShieldCheck, FileText, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { calculateDistanceKm, calculateDeliveryFee } from "@/lib/utils/distance"
import { format, addDays } from "date-fns"

interface Warehouse {
  id: string;
  lat: number;
  lng: number;
  radius_km: number;
  name: string;
}

interface Discount {
  id: string
  title: string
  code: string | null
  discount_type: string
  discount_value: number
  target_type: string
  target_id: string | null
  min_order_value: number
  max_discount_amount: number | null
}

interface ProductMapping {
  id: string
  category_id: string | null
}

const TIME_SLOTS = [
  { id: "slot-1", label: "08:00 AM - 10:00 AM", startHour: 8 },
  { id: "slot-2", label: "10:00 AM - 12:00 PM", startHour: 10 },
  { id: "slot-3", label: "12:00 PM - 02:00 PM", startHour: 12 },
  { id: "slot-4", label: "02:00 PM - 04:00 PM", startHour: 14 },
  { id: "slot-5", label: "04:00 PM - 06:00 PM", startHour: 16 },
  { id: "slot-6", label: "06:00 PM - 08:00 PM", startHour: 18 },
]

export function CheckoutForm({ 
  warehouse, userPoints = 0, discounts = [], products = [] 
}: { 
  warehouse?: Warehouse | null; userPoints?: number; discounts?: Discount[]; products?: ProductMapping[] 
}) {
  const router = useRouter()
  const { items, getCartTotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [deliveryFee, setDeliveryFee] = useState<number>(0)

  // Swiggy Delivery Time Slot State
  const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow">("today")
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [availableTodaySlots, setAvailableTodaySlots] = useState<typeof TIME_SLOTS>([])

  // Loyalty Points State
  const [usePoints, setUsePoints] = useState(false)
  const pointsDiscount = usePoints ? Math.floor(userPoints / 1000) : 0
  const pointsApplied = usePoints ? pointsDiscount * 1000 : 0

  // Amazon/Swiggy Coupon & Promotion State
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>("")
  const [couponInput, setCouponInput] = useState<string>("")
  const [couponError, setCouponError] = useState<string>("")

  const selectedDiscount = discounts.find(d => d.id === selectedDiscountId)
  const cartSubtotal = getCartTotal()

  // Calculate promotional discount amount
  let promoDiscountAmount = 0
  if (selectedDiscount && cartSubtotal >= selectedDiscount.min_order_value) {
    let applicableSubtotal = 0

    if (selectedDiscount.target_type === 'all') {
      applicableSubtotal = cartSubtotal
    } else if (selectedDiscount.target_type === 'product') {
      const matchingItems = items.filter(i => i.product_id === selectedDiscount.target_id)
      applicableSubtotal = matchingItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
    } else if (selectedDiscount.target_type === 'category') {
      const matchingItems = items.filter(i => {
        const prod = products.find(p => p.id === i.product_id)
        return prod?.category_id === selectedDiscount.target_id
      })
      applicableSubtotal = matchingItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
    }

    if (applicableSubtotal > 0) {
      if (selectedDiscount.discount_type === 'percentage') {
        let calc = applicableSubtotal * (selectedDiscount.discount_value / 100)
        if (selectedDiscount.max_discount_amount && calc > selectedDiscount.max_discount_amount) {
          calc = selectedDiscount.max_discount_amount
        }
        promoDiscountAmount = calc
      } else {
        promoDiscountAmount = Math.min(applicableSubtotal, selectedDiscount.discount_value)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // Calculate available slots for today based on current hour
    const now = new Date()
    const currentHour = now.getHours()
    
    const todaySlots = TIME_SLOTS.filter(slot => currentHour < slot.startHour)
    setAvailableTodaySlots(todaySlots)

    // If no slots available today (e.g. after 8 PM), default to tomorrow
    if (todaySlots.length === 0) {
      setSelectedDay("tomorrow")
      setSelectedSlot(`Tomorrow (${format(addDays(now, 1), "dd MMM")}), ${TIME_SLOTS[0].label}`)
    } else {
      setSelectedDay("today")
      setSelectedSlot(`Today (${format(now, "dd MMM")}), ${todaySlots[0].label}`)
    }
  }, [])

  const handleDayChange = (day: "today" | "tomorrow") => {
    setSelectedDay(day)
    const now = new Date()
    if (day === "today") {
      if (availableTodaySlots.length > 0) {
        setSelectedSlot(`Today (${format(now, "dd MMM")}), ${availableTodaySlots[0].label}`)
      }
    } else {
      setSelectedSlot(`Tomorrow (${format(addDays(now, 1), "dd MMM")}), ${TIME_SLOTS[0].label}`)
    }
  }

  const handleSlotSelect = (slotLabel: string) => {
    const now = new Date()
    const dayPrefix = selectedDay === "today" ? `Today (${format(now, "dd MMM")})` : `Tomorrow (${format(addDays(now, 1), "dd MMM")})`
    setSelectedSlot(`${dayPrefix}, ${slotLabel}`)
  }

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

  const handleApplyCustomCoupon = (e: React.MouseEvent) => {
    e.preventDefault()
    setCouponError("")
    if (!couponInput.trim()) return

    const matched = discounts.find(d => d.code?.toLowerCase() === couponInput.trim().toLowerCase())
    if (!matched) {
      setCouponError("Invalid coupon code or expired promotion.")
      toast.error("Invalid coupon code")
      return
    }

    if (cartSubtotal < matched.min_order_value) {
      setCouponError(`Minimum order value of ₹${matched.min_order_value} required for this coupon.`)
      toast.error(`Minimum order value ₹${matched.min_order_value} required`)
      return
    }

    setSelectedDiscountId(matched.id)
    setCouponInput("")
    toast.success(`Coupon ${matched.code} applied successfully!`)
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

    if (!selectedSlot) {
      toast.error("Please select a delivery time slot.")
      return
    }

    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    const userNotes = formData.get("notes") as string || ""
    const promoNote = selectedDiscount ? ` | Promo: ${selectedDiscount.title} (-₹${promoDiscountAmount.toFixed(2)})` : ''
    const combinedNotes = `Delivery Slot: ${selectedSlot}${promoNote}${userNotes ? ` | Note: ${userNotes}` : ''}`
    formData.set("notes", combinedNotes)

    formData.append("latitude", location.lat.toString())
    formData.append("longitude", location.lng.toString())
    formData.append("delivery_fee", deliveryFee.toString())
    formData.append("distance_km", (distanceKm || 0).toString())
    formData.append("points_applied", pointsApplied.toString())
    formData.append("promo_discount", promoDiscountAmount.toString())
    formData.append("cart", JSON.stringify(items))
    formData.append("total", Math.max(0, getCartTotal() + deliveryFee - pointsDiscount - promoDiscountAmount).toString())

    const result = await processCheckoutAction(formData)

    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else if (result.success) {
      clearCart()
      toast.success(`Order placed successfully! 🎉 You earned ${result.earnedPoints || 10} Sawaïom Points!`)
      setTimeout(() => {
        router.push('/checkout/success')
      }, 1000)
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-200 shadow-sm font-sans antialiased">
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

  const now = new Date()
  const tomorrow = addDays(now, 1)
  const finalTotalPayable = Math.max(0, getCartTotal() + (location && distanceKm !== null && distanceKm <= (warehouse?.radius_km || 15) ? deliveryFee : 0) - pointsDiscount - promoDiscountAmount)

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start font-sans antialiased">
      {/* SWIGGY STYLE LEFT FORM SECTION */}
      <div className="flex-1 w-full space-y-8">
        <form onSubmit={handleSubmit} id="swiggy-checkout-form" className="space-y-8">
          
          {/* STEP 1: ACCOUNT / CONTACT DETAILS */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-full bg-slate-900" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Step 1</span>
                  <Badge className="bg-slate-100 text-slate-700 border-none font-bold">Account</Badge>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Contact Details</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 md:pl-6 border-l-2 border-slate-100 ml-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                <Input name="name" required placeholder="John Doe" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all px-6 text-lg font-medium shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
                <Input name="phone" required placeholder="8974319494" type="tel" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all px-6 text-lg font-medium shadow-inner" />
              </div>
            </div>
          </div>

          {/* STEP 2: DELIVERY ADDRESS & GPS VERIFICATION */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-full bg-primary" />
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Step 2</span>
                    <Badge className="bg-primary/10 text-primary border-none font-bold">Delivery</Badge>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Delivery Address</h2>
                </div>
              </div>

              <AnimatePresence>
                {location && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-emerald-600 flex items-center text-xs font-black uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verified Zone
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-slate-100 ml-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Complete Delivery Address</label>
                <Textarea name="address" required placeholder="House No, Street, Landmark, Area" rows={3} className="rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all p-6 text-lg font-medium shadow-inner" />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">GPS Feasibility Verification</label>
                <Button 
                  type="button" 
                  variant="outline"
                  className={`w-full h-16 rounded-2xl border-2 font-bold text-base sm:text-lg transition-all active:scale-[0.98] shadow-sm ${
                    location 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                      : 'border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={getLocation}
                  disabled={isGettingLocation || location !== null}
                >
                  {isGettingLocation ? (
                    <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Locating (Auto-fallback in 5s)...</>
                  ) : location ? (
                    <><MapPin className="w-6 h-6 mr-3 text-emerald-600" /> Delivery Location Verified (Jowai Hub)</>
                  ) : (
                    <><MapPin className="w-6 h-6 mr-3" /> Tap for Instant GPS Verification</>
                  )}
                </Button>
                
                {locationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 shadow-sm"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {locationError}
                  </motion.div>
                )}

                {!location && !locationError && (
                  <div className="flex items-center gap-2 px-1 text-slate-400 font-medium">
                    <Info className="w-4 h-4 shrink-0" />
                    <p className="text-xs italic">Swiggy-style instant GPS verification ensures accurate rider assignment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3: SWIGGY DELIVERY TIME SLOT PICKER */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-full bg-purple-600" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Step 3</span>
                  <Badge className="bg-purple-100 text-purple-700 border-none font-bold">Schedule</Badge>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Select Delivery Slot</h2>
              </div>
            </div>

            <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-slate-100 ml-6">
              {/* Day Selection Tabs */}
              <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-full max-w-md shadow-inner">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDayChange("today")}
                  disabled={availableTodaySlots.length === 0}
                  className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all ${
                    selectedDay === "today" 
                      ? 'bg-white text-slate-900 shadow-md' 
                      : 'text-slate-500 hover:text-slate-900 disabled:opacity-30'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  Today ({format(now, "dd MMM")})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDayChange("tomorrow")}
                  className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all ${
                    selectedDay === "tomorrow" 
                      ? 'bg-white text-slate-900 shadow-md' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  Tomorrow ({format(tomorrow, "dd MMM")})
                </Button>
              </div>

              {availableTodaySlots.length === 0 && selectedDay === "today" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Orders placed after 8 PM are scheduled for delivery starting tomorrow morning.
                </div>
              )}

              {/* Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {(selectedDay === "today" ? availableTodaySlots : TIME_SLOTS).map((slot) => {
                  const isSelected = selectedSlot.includes(slot.label)
                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot.label)}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
                        isSelected 
                          ? 'bg-purple-50/50 border-purple-600 shadow-md shadow-purple-600/10' 
                          : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>
                          {slot.label}
                        </span>
                      </div>
                      <Badge className={`border-none font-bold px-2.5 py-1 text-[10px] rounded-lg shadow-sm ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}>
                        Available
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* STEP 4: SWIGGY OFFERS, PROMOTIONS & LOYALTY BENEFITS */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-full bg-emerald-500" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Step 4</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Benefits</Badge>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Offers & Benefits</h2>
              </div>
            </div>

            <div className="space-y-8 pl-4 md:pl-6 border-l-2 border-slate-100 ml-6">
              {/* Available Discounts List */}
              {discounts.length > 0 && (
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Available Promotions</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {discounts.map(d => {
                      const isSelected = selectedDiscountId === d.id
                      const isEligible = cartSubtotal >= d.min_order_value
                      return (
                        <div 
                          key={d.id}
                          onClick={() => {
                            if (!isEligible) {
                              toast.error(`Minimum order value of ₹${d.min_order_value} required.`)
                              return
                            }
                            setSelectedDiscountId(isSelected ? "" : d.id)
                          }}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-sm ${
                            isSelected 
                              ? 'bg-emerald-50/50 border-emerald-600 shadow-md shadow-emerald-600/10' 
                              : !isEligible 
                              ? 'bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed' 
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-black text-sm mb-1 ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>{d.title}</p>
                              {d.code && (
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 mb-1">
                                  <Tag className="w-3 h-3" /> {d.code}
                                </span>
                              )}
                              <p className="text-xs text-slate-500 font-medium">
                                {d.discount_type === 'percentage' ? `${d.discount_value}% discount` : `₹${d.discount_value} flat discount`}
                                {d.target_type === 'category' ? ' on specific category' : d.target_type === 'product' ? ' on specific product' : ' sitewide'}
                              </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-xs">
                            <span className={isEligible ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                              {isEligible ? "Eligible Offer" : `Min order ₹${d.min_order_value}`}
                            </span>
                            {isSelected && <span className="font-black text-emerald-700">Applied</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Custom Coupon Input */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Have a coupon code?</label>
                <div className="flex gap-3 max-w-md">
                  <Input 
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value)
                      setCouponError("")
                    }}
                    placeholder="Enter custom coupon code..."
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 font-bold text-slate-900 uppercase tracking-wider shadow-inner"
                  />
                  <Button 
                    type="button" 
                    onClick={handleApplyCustomCoupon}
                    className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-md"
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 animate-shake pt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {couponError}
                  </p>
                )}
              </div>

              {/* SAWAÏOM LOYALTY POINTS TOGGLE */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-[2rem] border border-purple-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg tracking-tight">Use Sawaïom Points</h4>
                      <p className="text-slate-500 text-xs font-medium mt-0.5">
                        You have <span className="font-bold text-purple-700">{userPoints}</span> points (Worth <span className="font-bold text-purple-700">₹{Math.floor(userPoints / 1000).toFixed(2)}</span> discount)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {usePoints && (
                      <Badge className="bg-purple-600 text-white font-bold px-3 py-1 text-xs rounded-xl shadow-sm">
                        -₹{pointsDiscount.toFixed(2)}
                      </Badge>
                    )}
                    <Switch 
                      checked={usePoints} 
                      onCheckedChange={setUsePoints} 
                      disabled={userPoints < 1000} 
                    />
                  </div>
                </div>
                {userPoints < 1000 && (
                  <p className="text-[11px] text-slate-400 italic px-2">
                    * Minimum 1,000 points required to redeem a discount (1,000 points = ₹1). Earn points on every order!
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Delivery Instructions (Optional)</label>
                <Input name="notes" placeholder="e.g. Near Big Church, blue gate" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all px-6 text-lg font-medium shadow-inner" />
              </div>
            </div>
          </div>

          {/* STEP 5: PAYMENT METHOD */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-full bg-amber-500" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Step 5</span>
                  <Badge className="bg-amber-100 text-amber-800 border-none font-bold">Payment</Badge>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Payment Method</h2>
              </div>
            </div>
            
            <div className="pl-4 md:pl-6 border-l-2 border-slate-100 ml-6">
              <label className="flex items-center space-x-4 p-6 border-2 border-primary bg-primary/5 rounded-[2rem] cursor-pointer transition-all shadow-md shadow-primary/5">
                <div className="w-6 h-6 rounded-full border-4 border-primary flex items-center justify-center bg-white shrink-0">
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
        </form>
      </div>

      {/* SWIGGY STYLE ORDER SUMMARY SIDEBAR */}
      <div className="w-full lg:w-[420px] shrink-0">
        <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl sticky top-28 overflow-hidden space-y-8 border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 border-b border-white/10 pb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">Order Summary</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Swiggy Instant Dispatch Feasibility</p>
            </div>
            <Badge className="bg-primary text-white font-bold border-none px-3 py-1 rounded-full text-xs shadow-lg shadow-primary/30">
              {items.length} Items
            </Badge>
          </div>
          
          {/* Cart Items List */}
          <div className="space-y-6 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {items.map(item => (
              <div key={item.product_id} className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden shrink-0 shadow-inner border border-white/5">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-slate-500 m-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm leading-tight mb-1 text-white">{item.name}</p>
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Swiggy Bill Details */}
          <div className="space-y-4 pt-6 border-t border-white/10 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Bill Details</h3>
            
            <div className="flex justify-between text-slate-300 text-sm font-medium">
              <span>Item Total</span>
              <span className="text-white font-bold">₹{getCartTotal().toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-300 text-sm font-medium">
              <span>Delivery Fee</span>
              {location && distanceKm !== null && distanceKm <= (warehouse?.radius_km || 15) ? (
                <span className="text-white font-bold bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 shadow-sm">₹{deliveryFee.toFixed(2)}</span>
              ) : (
                <span className="text-primary font-bold text-xs italic">Calculated at checkout</span>
              )}
            </div>

            {selectedDiscount && promoDiscountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-300 text-sm font-bold pt-1">
                <span>Promo ({selectedDiscount.code || selectedDiscount.title})</span>
                <span className="bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-sm">
                  -₹{promoDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {usePoints && pointsDiscount > 0 && (
              <div className="flex justify-between items-center text-purple-300 text-sm font-bold pt-1">
                <span>Loyalty Discount</span>
                <span className="bg-purple-500/20 px-2.5 py-1 rounded-xl border border-purple-500/30 shadow-sm">
                  -₹{pointsDiscount.toFixed(2)}
                </span>
              </div>
            )}

            {selectedSlot && (
              <div className="flex justify-between items-center text-slate-400 text-xs font-medium pt-2 border-t border-white/5">
                <span>Delivery Slot</span>
                <span className="text-purple-300 font-bold bg-purple-500/20 px-2.5 py-1 rounded-xl border border-purple-500/30 text-[11px] shadow-sm">
                  {selectedSlot.split(', ')[1] || selectedSlot}
                </span>
              </div>
            )}
            
            <div className="pt-6 flex flex-col gap-2 border-t border-white/10 mt-2">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">To Pay</p>
              <div className="flex justify-between items-end">
                <span className="text-5xl font-black text-primary tracking-tighter">
                  ₹{finalTotalPayable.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Swiggy Tip Box */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 relative z-10 shadow-sm">
            <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Review your order and address details to avoid cancellations. Protected by <span className="text-white font-bold">Sawaïom Safety Guarantee</span>.
            </p>
          </div>

          {/* Swiggy Proceed Button */}
          <div className="pt-4 relative z-10">
            <Button 
              form="swiggy-checkout-form"
              type="submit" 
              disabled={isSubmitting || !location || !selectedSlot || (warehouse && distanceKm !== null ? distanceKm > warehouse.radius_km : false)} 
              className="w-full h-20 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-[2rem] shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-between px-8"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center w-full"><Loader2 className="w-8 h-8 mr-3 animate-spin" /> Processing Order...</span>
              ) : (
                <>
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-xs uppercase tracking-widest text-primary-foreground/80 font-extrabold mb-1">Total Payable</span>
                    <span className="text-2xl font-black">₹{finalTotalPayable.toFixed(2)}</span>
                  </span>
                  <span className="flex items-center gap-2 font-black text-lg">
                    PROCEED TO PAY <ArrowRight className="w-6 h-6" />
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
