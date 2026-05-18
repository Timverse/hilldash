import { createClient } from "@/lib/supabase/server"
import { ShoppingCart, Star, ShieldCheck, Truck, RefreshCw, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/customer/product-card"
import { ProductActions } from "@/components/customer/product-actions"

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', resolvedParams.id)
    .single()

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/shop" className="text-primary mt-4 block">Back to Shop</Link>
      </div>
    )
  }

  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-12">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronLeft className="w-3 h-3 rotate-180" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <ChevronLeft className="w-3 h-3 rotate-180" />
          <span className="text-slate-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Product Gallery */}
          <div className="space-y-6">
            <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 group relative">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200">
                  <ShoppingCart className="w-24 h-24" />
                </div>
              )}
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-black text-slate-900 shadow-xl shadow-black/5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>4.8 (120+ Reviews)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className={`aspect-square rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${i === 0 ? 'border-primary' : 'border-slate-100 hover:border-slate-200 opacity-50 hover:opacity-100'}`}>
                    {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
                 </div>
               ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-10">
            <div>
              <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-widest text-[10px] px-3 py-1 mb-6 rounded-full">
                {product.categories?.name || 'Essentials'}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
                {product.name}
              </h1>
              <div className="flex items-end gap-4 mb-8">
                <span className="text-4xl font-black text-slate-900">₹{product.price}</span>
                <span className="text-xl text-slate-400 line-through mb-1">₹{product.mrp || Math.round(product.price * 1.2)}</span>
                <Badge className="bg-emerald-500 text-white border-none font-bold mb-1 ml-2">SAVE 20%</Badge>
              </div>
              <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
                Experience the freshest {product.name} sourced directly from local hill farms in Meghalaya. 
                Our products are hand-picked daily to ensure the highest quality for your kitchen.
              </p>
            </div>

            <div className="pt-4">
               <ProductActions product={product} />
               
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-6">
                 {product.stock > 0 ? (
                   <span className="text-emerald-600">● In Stock ({product.stock} units available)</span>
                 ) : (
                   <span className="text-red-500">● Currently Out of Stock</span>
                 )}
               </p>
            </div>

            {/* Features Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-slate-100">
               <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center text-center">
                  <Truck className="w-6 h-6 text-primary mb-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">90 Min Delivery</span>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center text-center">
                  <ShieldCheck className="w-6 h-6 text-primary mb-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">100% Quality</span>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center text-center">
                  <RefreshCw className="w-6 h-6 text-primary mb-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Easy Returns</span>
               </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-32">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4">
                  You May Also <span className="text-primary italic">Like</span>
                </h2>
                <p className="text-slate-500 font-medium">Similar items from the {product.categories?.name} category.</p>
              </div>
              <Link href="/shop">
                <Button variant="link" className="text-primary font-black uppercase tracking-widest text-xs p-0 h-auto hover:no-underline">
                  View All Products
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
