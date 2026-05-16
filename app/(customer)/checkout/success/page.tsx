"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { CheckCircle2, ShoppingBag, ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SuccessPage() {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" 
        />
      </div>

      <div className="max-w-xl w-full text-center relative z-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center mb-10 shadow-2xl shadow-emerald-200"
        >
          <CheckCircle2 className="w-16 h-16 text-white" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6">
            Order <span className="text-primary italic">Success!</span>
          </h1>
          <p className="text-slate-500 text-xl mb-12 max-w-md mx-auto leading-relaxed">
            Your order has been received and is being processed by our team. We'll dash to your doorstep soon!
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Button asChild size="lg" className="h-16 rounded-2xl font-black text-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
            <Link href="/account">
              Track Order <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-16 rounded-2xl font-black text-lg border-2 border-slate-200 hover:bg-slate-50 text-slate-900">
            <Link href="/">
              <Home className="mr-2 w-5 h-5" /> Back Home
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]"
        >
          <ShoppingBag className="w-4 h-4" />
          Powered by HillDash Quick Commerce
        </motion.div>
      </div>
    </div>
  )
}
