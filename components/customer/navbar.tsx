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
import { resolveJowaiLocality } from "@/lib/utils/distance"

export function CustomerNavbar() {
  const items = useCartStore((state) => state.items)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [locationName, setLocationName] = useState<string>("Click to set location")
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
            headers: { 'User-Agent': 'Sawaïom/1.0' }
          })
          const data = await res.json()

          const address = data.address || {}
          const rawLocality =
            address.suburb ||
            address.neighbourhood ||
            address.road ||
            address.residential ||
            address.village ||
            address.town ||
            "Jowai, Meghalaya"

          const preciseLocality = resolveJowaiLocality(latitude, longitude, rawLocality)
          setLocationName(preciseLocality)
          toast.success(`Precise location set: ${preciseLocality}! 📍`)
        } catch (err) {
          console.error("Reverse geocoding error:", err)
          const preciseLocality = resolveJowaiLocality(latitude, longitude)
          setLocationName(preciseLocality)
          toast.success(`Precise location set: ${preciseLocality}! 📍`)
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
      isScrolled ? "bg-white/90 backdrop-blur-xl border-b shadow-sm py-3" : "bg-white py-5"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 shrink-0 group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-500 bg-white border border-slate-100 flex items-center justify-center">
              <img src="/images/logo.jpg" alt="Sawaïom Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:flex sm:flex-col sm:justify-center">
              <span className="font-black text-2xl tracking-tighter text-slate-900 leading-none">
                Sawa<span className="text-primary">ïom</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-1 leading-none">
                Rooted in Meghalaya
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form action="/shop" className="hidden md:flex flex-1 max-w-xl relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <Input
              name="category"
              placeholder="Search groceries, snacks, categories..."
              className="pl-12 h-12 bg-slate-50 border border-slate-200/80 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all text-slate-900 font-medium w-full shadow-inner text-sm"
            />
          </form>

          {/* Location - Desktop */}
          <div
            onClick={handleGetLocation}
            className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all duration-300 active:scale-95 group shadow-sm shrink-0"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
            )}
            <div className="text-xs">
              <p className="text-slate-400 font-medium leading-none">Deliver to</p>
              <p className="text-slate-900 font-extrabold leading-none mt-1 capitalize line-clamp-1 max-w-[140px]">{locationName}</p>
            </div>
          </div>

          {/* Actions - Beautifully Spaced Horizontally */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 lg:gap-3">
              {user ? (
                <Link href="/account">
                  <Button variant="ghost" className="rounded-full gap-2 text-slate-700 hover:text-primary hover:bg-primary/5 font-bold h-12 px-5 border border-slate-200/60 shadow-sm transition-all duration-300 active:scale-95">
                    <User className="w-4 h-4 text-primary" />
                    <span className="hidden lg:block font-extrabold text-sm">My Profile</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login?tab=signin">
                    <Button variant="ghost" className="rounded-full font-extrabold text-sm text-slate-700 hover:text-primary hover:bg-primary/5 h-12 px-6 transition-all duration-300 active:scale-95">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login?tab=signup">
                    <Button className="rounded-full font-extrabold text-sm bg-slate-900 hover:bg-slate-800 text-white h-12 px-7 shadow-lg shadow-slate-900/10 transition-all duration-300 active:scale-95">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <Link href="/checkout">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 h-12 relative shadow-xl shadow-primary/20 transition-all duration-300 active:scale-95 gap-2.5 font-bold">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-extrabold">
                  {mounted ? cartCount : 0} {mounted && cartCount === 1 ? 'Item' : 'Items'}
                </span>
                <AnimatePresence>
                  {mounted && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md"
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
                <Button variant="ghost" size="icon" className="md:hidden rounded-full h-12 w-12">
                  <Menu className="w-6 h-6 text-slate-700" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[92%] max-w-sm bg-white p-8 rounded-[3rem] font-sans antialiased flex flex-col justify-between border border-slate-100 shadow-2xl">
                <div className="space-y-8">
                  <DialogHeader className="text-left border-b border-slate-100 pb-6">
                    <DialogTitle className="font-black text-3xl tracking-tighter text-slate-900 flex items-center gap-2">
                      Sawa<span className="text-primary">ïom</span>
                    </DialogTitle>
                  </DialogHeader>

                  <form action="/shop" onSubmit={() => setOpenMobileMenu(false)} className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input name="category" placeholder="Search groceries..." className="pl-11 h-13 bg-slate-50 border-none rounded-2xl text-slate-900 font-medium w-full focus-visible:ring-2 focus-visible:ring-primary shadow-inner" />
                  </form>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Navigation</p>
                    <Link href="/shop" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-base transition-all">
                      Browse Shop
                    </Link>
                    <Link href="/account" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-base transition-all">
                      My Account
                    </Link>
                    <Link href="/track" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-base transition-all">
                      Track Order
                    </Link>
                    <Link href="/checkout" onClick={() => setOpenMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold text-base transition-all">
                      Secure Checkout
                    </Link>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 space-y-4">
                  {user ? (
                    <form action="/api/auth/signout" method="POST" onSubmit={() => setOpenMobileMenu(false)}>
                      <Button variant="outline" className="w-full rounded-2xl border-2 font-bold h-14 text-red-600 hover:bg-red-50 hover:text-red-700 text-lg">
                        Sign Out
                      </Button>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link href="/login?tab=signin" onClick={() => setOpenMobileMenu(false)} className="block">
                        <Button variant="outline" className="w-full rounded-2xl font-extrabold h-14 border-slate-200 text-slate-800 text-base">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/login?tab=signup" onClick={() => setOpenMobileMenu(false)} className="block">
                        <Button className="w-full rounded-2xl font-extrabold h-14 bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 text-base">
                          Sign Up / Register
                        </Button>
                      </Link>
                    </div>
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
