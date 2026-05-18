"use client"

import Link from "next/link"
import { useCartStore } from "@/lib/store/cart"
import { useAddressStore } from "@/lib/store/address"
import { ShoppingCart, Menu, User, Search, MapPin, Loader2, Plus, Trash2, CheckCircle2, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { resolveJowaiLocality } from "@/lib/utils/distance"

export function CustomerNavbar() {
  const items = useCartStore((state) => state.items)
  const { addresses, activeAddressId, addAddress, deleteAddress, setActiveAddress, getActiveAddress } = useAddressStore()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [locating, setLocating] = useState<boolean>(false)
  const [openMobileMenu, setOpenMobileMenu] = useState(false)
  const [openAddressModal, setOpenAddressModal] = useState(false)

  // Add new address form state
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newAddress, setNewAddress] = useState("")

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const activeAddress = getActiveAddress()
  const displayLocality = mounted ? (activeAddress?.locality || "Jowai Central") : "Loading..."

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
          
          // Add or update to permanent Zustand store
          addAddress({
            title: `GPS (${preciseLocality})`,
            address: `${preciseLocality}, Jowai, Meghalaya`,
            locality: preciseLocality,
            lat: latitude,
            lng: longitude,
            isDefault: true
          })

          toast.success(`Precise location set permanently: ${preciseLocality}! 📍`)
          setOpenAddressModal(false)
        } catch (err) {
          console.error("Reverse geocoding error:", err)
          const preciseLocality = resolveJowaiLocality(latitude, longitude)
          addAddress({
            title: `GPS (${preciseLocality})`,
            address: `${preciseLocality}, Jowai, Meghalaya`,
            locality: preciseLocality,
            lat: latitude,
            lng: longitude,
            isDefault: true
          })
          toast.success(`Precise location set permanently: ${preciseLocality}! 📍`)
          setOpenAddressModal(false)
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

  const handleAddNewAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newAddress.trim()) {
      toast.error("Please enter both title and address")
      return
    }

    // Default Jowai coordinates approximation
    addAddress({
      title: newTitle.trim(),
      address: newAddress.trim(),
      locality: resolveJowaiLocality(25.4508, 92.1868, newAddress.trim()),
      lat: 25.4508,
      lng: 92.1868,
      isDefault: true
    })

    toast.success("New address added permanently! 🏡")
    setNewTitle("")
    setNewAddress("")
    setIsAddingNew(false)
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

          {/* Location Management Modal Trigger */}
          <Dialog open={openAddressModal} onOpenChange={setOpenAddressModal}>
            <DialogTrigger asChild>
              <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all duration-300 active:scale-95 group shadow-sm shrink-0">
                <MapPin className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div className="text-xs">
                  <p className="text-slate-400 font-medium leading-none">Deliver to</p>
                  <p className="text-slate-900 font-extrabold leading-none mt-1 capitalize line-clamp-1 max-w-[140px]">
                    {displayLocality}
                  </p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="w-[92%] max-w-md bg-white p-8 rounded-[3rem] font-sans antialiased border border-slate-100 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <MapPin className="w-6 h-6 text-primary" /> Delivery Addresses
                </DialogTitle>
                <p className="text-sm text-slate-500 font-medium mt-1">Select an active address or permanently add new delivery locations.</p>
              </DialogHeader>

              {/* Instant GPS Auto-Detect Button */}
              <Button 
                type="button" 
                onClick={handleGetLocation} 
                disabled={locating}
                className="w-full h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-base shadow-sm gap-2 transition-all"
              >
                {locating ? <><Loader2 className="w-5 h-5 animate-spin mr-1" /> Auto-Detecting GPS...</> : <><Navigation className="w-5 h-5 text-emerald-600 mr-1" /> Auto-Detect Current GPS Location</>}
              </Button>

              {/* Saved Addresses List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Permanent Saved Addresses</label>
                  {!isAddingNew && (
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(true)} className="text-primary hover:text-primary/80 font-bold text-xs gap-1 px-2.5 py-1 h-8 rounded-xl">
                      <Plus className="w-3.5 h-3.5" /> Add New
                    </Button>
                  )}
                </div>

                {isAddingNew ? (
                  <form onSubmit={handleAddNewAddressSubmit} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4 shadow-inner animate-fadeIn">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Add New Permanent Address</h4>
                    <Input 
                      required 
                      placeholder="Address Title (e.g. Mom's House, Work)" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                      className="h-12 rounded-xl bg-white border-slate-200 font-medium text-sm"
                    />
                    <Textarea 
                      required 
                      placeholder="Complete Street Address & Landmark" 
                      rows={2} 
                      value={newAddress} 
                      onChange={e => setNewAddress(e.target.value)}
                      className="rounded-xl bg-white border-slate-200 font-medium text-sm"
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingNew(false)} className="rounded-xl font-bold text-xs h-10 px-4">Cancel</Button>
                      <Button type="submit" size="sm" className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-5 shadow-md">Save Permanent Address</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const isSelected = activeAddressId === addr.id
                      return (
                        <div 
                          key={addr.id} 
                          onClick={() => {
                            setActiveAddress(addr.id)
                            toast.success(`Active address switched to ${addr.title || addr.locality}`)
                            setOpenAddressModal(false)
                          }}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 shadow-sm ${
                            isSelected ? 'bg-primary/5 border-primary shadow-md shadow-primary/5' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 overflow-hidden">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-bold text-sm leading-none ${isSelected ? 'text-primary' : 'text-slate-900'}`}>{addr.title || addr.locality}</h4>
                                {isSelected && <Badge className="bg-primary text-white font-bold border-none px-2 py-0.5 text-[10px] rounded-md shadow-sm">Active</Badge>}
                              </div>
                              <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{addr.address}</p>
                            </div>
                          </div>

                          {addresses.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteAddress(addr.id)
                                toast.success("Address deleted permanently")
                              }} 
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 w-9 shrink-0 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
