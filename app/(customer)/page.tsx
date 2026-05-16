import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, ShieldCheck, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { HomeHero } from "@/components/customer/home-hero"
import { HomeBento } from "@/components/customer/home-bento"
import { ProductCard } from "@/components/customer/product-card"

export default async function CustomerHomepage() {
  const supabase = await createClient()

  // Fetch featured products with categories
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="bg-white font-sans antialiased">
      {/* Hero Section */}
      <HomeHero />

      {/* Trust Badges */}
      <section className="py-12 border-b bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-primary shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-none">15 Min Delivery</h4>
                <p className="text-slate-500 text-xs mt-1 font-medium">Faster than a heartbeat</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-none">Best Quality</h4>
                <p className="text-slate-500 text-xs mt-1 font-medium">Strict quality checks</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-primary shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-none">Local Support</h4>
                <p className="text-slate-500 text-xs mt-1 font-medium">Helping hill farmers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-none">Flash Deals</h4>
                <p className="text-slate-500 text-xs mt-1 font-medium">New offers every hour</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Categories */}
      <HomeBento />

      {/* Featured Products */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold mb-4">
                <Sparkles className="w-3 h-3" />
                <span>Just Arrived</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                Fresh <span className="text-primary italic">Finds</span>
              </h2>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="rounded-full font-bold border-2 h-12 px-8 hover:bg-primary hover:text-white transition-all">
                View All Products
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* App Download / CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 blur-[120px] -rotate-12 translate-x-1/2" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8 leading-tight">
                Grocery shopping is better on the <span className="text-primary">Sawaïom</span> app.
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed font-medium">
                Get exclusive app-only deals, real-time tracking, and a smoother checkout experience. Coming soon to iOS and Android.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" variant="outline" className="h-16 px-8 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border-white/20 rounded-2xl font-bold text-base cursor-default shadow-lg">
                  App Store <span className="ml-2 px-2.5 py-1 bg-primary text-white text-xs rounded-full font-black uppercase tracking-widest">Coming Soon</span>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-8 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border-white/20 rounded-2xl font-bold text-base cursor-default shadow-lg">
                  Google Play <span className="ml-2 px-2.5 py-1 bg-primary text-white text-xs rounded-full font-black uppercase tracking-widest">Coming Soon</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
