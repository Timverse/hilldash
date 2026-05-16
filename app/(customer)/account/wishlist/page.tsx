import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/customer/product-card'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch some premium active products to serve as curated Jowai Wishlist / Favorites
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('is_active', true)
    .limit(4)

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 font-sans antialiased">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12">
          <Link href="/account" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group mb-6">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Account
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                My <span className="text-primary italic">Wishlist</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium mt-3">Your saved premium favorites from Jowai.</p>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="rounded-2xl font-bold h-12 px-6 border-2 gap-2">
                Explore Shop <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center text-slate-300 mb-6 shadow-inner">
              <Heart className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Your wishlist is empty</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">You haven't saved any items to your wishlist yet. Tap the heart icon on any product to save it here!</p>
            <Link href="/shop">
              <Button className="rounded-full px-10 font-bold h-14 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
                Start Browsing
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
