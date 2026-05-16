"use client"

import Link from "next/link"
import { useCartStore } from "@/lib/store/cart"
import { ShoppingCart, Menu, User, Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"

export function CustomerNavbar() {
  const items = useCartStore((state) => state.items)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)

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

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
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
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <Input 
              placeholder="Search for groceries, snacks and more..." 
              className="pl-10 h-11 bg-slate-100 border-none rounded-full focus-visible:ring-primary focus-visible:bg-white transition-all"
            />
          </div>

          {/* Location - Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <MapPin className="w-4 h-4 text-primary" />
            <div className="text-xs">
              <p className="text-slate-400 font-medium leading-none">Deliver to</p>
              <p className="text-slate-900 font-bold leading-none mt-1">Jowai, Central</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1">
              {user ? (
                <Link href="/account">
                  <Button variant="ghost" className="rounded-full gap-2 text-slate-700 hover:text-primary hover:bg-primary/5">
                    <User className="w-5 h-5" />
                    <span className="font-semibold hidden lg:block">Profile</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full font-semibold text-slate-700 hover:text-primary hover:bg-primary/5">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
            
            <Link href="/checkout">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 h-11 relative shadow-lg shadow-primary/20 transition-transform active:scale-95 gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-bold text-sm">
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
            
            <Button variant="ghost" size="icon" className="md:hidden rounded-full">
              <Menu className="w-6 h-6 text-slate-700" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

