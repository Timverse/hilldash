"use client"

import { Button } from "@/components/ui/button"
import { Search, ArrowRight, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import Link from "next/link"

export function HomeHero() {
  return (
    <section className="relative h-[600px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-10000 hover:scale-110"
        style={{ backgroundImage: "url('/images/logo.jpg')" }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

      <div className="container mx-auto px-4 z-20">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full text-primary-foreground text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Now delivering in Jowai Central</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tighter">
            HillDash <br /><span className="text-primary italic">Freshness in a Dash</span>.
          </h1>
          
          <p className="text-xl text-slate-200 mb-10 leading-relaxed max-w-xl">
            Experience the finest local produce and daily essentials delivered within 15 minutes. Pure quality, lightning fast.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search fresh fruits, veggies..." 
                className="w-full h-14 pl-12 pr-4 bg-white/90 backdrop-blur-md border-none rounded-2xl text-lg shadow-2xl focus-visible:ring-2 focus-visible:ring-primary transition-all"
              />
            </div>
            <Link href="/shop">
              <Button size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/30 group">
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-8 text-slate-300">
            <div className="flex flex-col">
              <span className="text-white font-bold text-2xl leading-none">15k+</span>
              <span className="text-xs uppercase tracking-widest font-medium mt-1">Happy Customers</span>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-2xl leading-none">500+</span>
              <span className="text-xs uppercase tracking-widest font-medium mt-1">Fresh Products</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
