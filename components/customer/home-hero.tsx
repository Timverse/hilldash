"use client"

import { Button } from "@/components/ui/button"
import { Search, ArrowRight, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function HomeHero() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?category=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/shop')
    }
  }

  return (
    <section className="relative min-h-[550px] md:min-h-[650px] flex items-center overflow-hidden font-sans antialiased py-16 md:py-24 w-full">
      {/* Background Image with Overlay - Universal Scaling across screen ratios */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
        style={{ backgroundImage: "url('/images/hero-lady.png')" }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-20 max-w-7xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full text-primary-foreground text-xs sm:text-sm font-bold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Now delivering in Jowai</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.08] mb-6 tracking-tighter">
            Sawaïom <br /><span className="text-primary italic">Rooted in Meghalaya</span>.
          </h1>

          <p className="text-lg sm:text-xl text-slate-200 mb-10 leading-relaxed max-w-xl font-medium">
            Experience the finest local produce and daily essentials delivered at your preferred time slot. Pure quality, rooted in Meghalaya.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fresh fruits, veggies, dairy..."
                className="w-full h-14 pl-12 pr-4 bg-white/95 backdrop-blur-md border-none rounded-2xl text-base sm:text-lg shadow-2xl focus-visible:ring-2 focus-visible:ring-primary transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-primary/30 group shrink-0 transition-all active:scale-95">
              Shop Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-12 flex flex-wrap items-center gap-8 text-slate-300">
            <div className="flex flex-col">
              <span className="text-white font-black text-2xl sm:text-3xl leading-none">8 AM - 8 PM</span>
              <span className="text-[11px] uppercase tracking-widest font-extrabold mt-1.5 text-primary">Flexible Time Slots</span>
            </div>
            <div className="w-px h-10 bg-slate-700 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-white font-black text-2xl sm:text-3xl leading-none">100%</span>
              <span className="text-[11px] uppercase tracking-widest font-extrabold mt-1.5 text-primary">Organic & Fresh</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
