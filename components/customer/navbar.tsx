"use client"

import Link from "next/link"
import { useCartStore } from "@/lib/store/cart"
import { ShoppingCart, Menu, User, Search, MapPin, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function CustomerNavbar() {
  const items = useCartStore((state) => state.items)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [locationName, setLocationName] = useState<string>("Jowai, Central")
  const [locating, setLocating] = useState<boolean>(false)
  const [openMobileMenu, setOpenMobileMenu] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    
    // Check if user is logged in
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: { 'User-Agent': 'HillDash/1.0' }
          })
          const data = await res.json()
          
          const address = data.address || {}
          const preciseLocality = 
            address.road ||
            address.neighbourhood || 
            address.residential ||
            address.suburb || 
            address.quarter ||
            address.hamlet ||
            address.village || 
            address.town || 
            address.city || 
            "Jowai, Meghalaya"
          
          setLocationName(preciseLocality)
          toast.success(`Precise location set: ${preciseLocality}! 📍`)
        } catch (err) {
          console.error("Reverse geocoding error:", err)
          setLocationName("Jowai, Meghalaya")
          toast.success("Precise location captured! 📍")
        } finally {
          setLocating(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast.error("Could not capture precise location. Please check browser permissions.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 font-sans antialiased ${
      isScrolled ? "bg-white/80 backdrop-blur-lg border-b shadow-sm py-2" : "bg-white py-4"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300 bg-white">
              <img src="/images/logo.jpg" alt="HillDash Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:flex sm:flex-col sm:justify-center">
              <span className="font-black text-2xl tracking-tighter text-slate-900 leading-none">
                Hill<span className="text-primary">Dash</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-primary mt-0.5 leading-none">
                Freshness in a Dash
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form action="/shop" className="hidden md:flex flex-1 max-w-2xl relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <Input 
              name="category"
              placeholder="Search groceries, snacks, categories..." 
              className="pl-11 h-11 bg-slate-100 border-none rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all text-slate-900 font-medium w-full shadow-inner"
            />
          </form>

          {/* Location - Desktop */}
          <div 
            onClick={handleGetLocation}
            className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95 group shadow-sm"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            )}
            <div className="text-xs">
              <p className="text-slate-400 font-medium leading-none">Deliver to</p>
              <p className="text-slate-900 font-bold leading-none mt-1 capitalize">{locationName}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1">
              {user ? (
                <Link href="/account">
                  <Button variant="ghost" className="rounded-full gap-2 text-slate-700 hover:text-primary hover:bg-primary/5 font-bold">
                    <User className="w-5 h-5" />
                    <span className="hidden lg:block">Profile</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full font-bold text-slate-700 hover:text-primary hover:bg-primary/5">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
            
            <Link href="/checkout">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 h-11 relative shadow-lg shadow-primary/20 transition-transform active:scale-95 gap-2 font-bold">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm">
                  {mounted ? cartCount : 0} {mounted && cartCount === 1 ? 'Item' : 'Items'}
                </span>
                <AnimatePresence>
                  {mounted && cartCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </Link>
            
            {/* Mobile Menu Dialog Drawer */}
            <Dialog open={openMobileMenu} onOpenChange={setOpenMobileMenu}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                  <Menu className="w-6 h-6 text-slate-700" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] max-w-sm bg-white p-8 rounded-[2.5rem] font-sans antialiased flex flex-col justify-between border border-slate-100 shadow-2xl">
                <div className="space-y-8">
                  <DialogHeader className="text-left border-b border-slate-100 pb-6">
                    <DialogTitle className="font-black text-2xl tracking-tighter text-slate-900 flex items-center gap-2">
                      Hill<span className="text-primary">Dash</span>
                    </DialogTitle>
                  </DialogHeader>

                  <form action="/shop" onSubmit={() => setOpenMobileMenu(false)} className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input name="category" placeholder="Search groceries..." className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-slate-900 font-medium w-full focus-visible:ring-2 focus-visible:ring-primary shadow-inner" />
                  </form>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Navigation</p>
                    <Link href="/shop" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-sm transition-all">
                      Browse Shop
                    </Link>
                    <Link href="/account" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-sm transition-all">
                      My Account
                    </Link>
                    <Link href="/track" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-sm transition-all">
                      Track Order
                    </Link>
                    <Link href="/checkout" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-sm transition-all">
                      Secure Checkout
                    </Link>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  {user ? (
                    <form action="/api/auth/signout" method="POST" onSubmit={() => setOpenMobileMenu(false)}>
                      <Button variant="outline" className="w-full rounded-2xl border-2 font-bold h-12 text-red-600 hover:bg-red-50 hover:text-red-700">
                        Sign Out
                      </Button>
                    </form>
                  ) : (
                    <Link href="/login" onClick={() => setOpenMobileMenu(false)} className="block">
                      <Button className="w-full rounded-2xl font-bold h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        Sign In / Register
                      </Button>
                    </Link>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </nav>
  )
}
