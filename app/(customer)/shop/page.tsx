import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/customer/product-card"
import Link from "next/link"
import { ChevronRight, Filter, Search, Grid2X2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams
  const categoryId = resolvedSearchParams?.category

  const { data: warehouse } = await supabase.from('warehouses').select('id').limit(1).single()
  const warehouseId = warehouse?.id

  const { data: categories } = await supabase.from('categories').select('*').order('name')

  let matchedCategory = null
  if (categoryId && categories) {
    matchedCategory = categories.find(c => c.id === categoryId) || 
                      categories.find(c => c.name.toLowerCase().includes(categoryId.toLowerCase())) ||
                      categories.find(c => categoryId.toLowerCase().includes(c.name.toLowerCase()))
  }

  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('is_active', true)

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId)
  }

  if (matchedCategory) {
    query = query.eq('category_id', matchedCategory.id)
  }

  const { data: products } = await query

  const currentCategory = matchedCategory

  return (
    <div className="bg-white min-h-screen font-sans antialiased">
      {/* Shop Header / Breadcrumbs */}
      <div className="border-b bg-slate-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900">Shop</span>
            {currentCategory && (
               <>
                 <ChevronRight className="w-3 h-3" />
                 <span className="text-primary">{currentCategory.name}</span>
               </>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                {currentCategory ? currentCategory.name : <>All <span className="text-primary italic">Essentials</span></>}
              </h1>
              <p className="text-slate-500 mt-4 text-lg font-medium">
                Showing {products?.length || 0} premium results from our Jowai Central Hub.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search in this category..." 
                  className="pl-9 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-primary w-[250px]"
                />
              </div>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 gap-2 font-bold md:hidden">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Sidebar Filters */}
          <div className="hidden md:block w-72 shrink-0">
            <div className="sticky top-28 space-y-10">
              <div>
                <h2 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                  <Grid2X2 className="w-4 h-4 text-primary" />
                  Categories
                </h2>
                <ul className="space-y-1">
                  <li>
                    <Link 
                      href="/shop" 
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${!currentCategory ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      All Products
                      {!currentCategory && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </Link>
                  </li>
                  {categories?.map((cat) => (
                    <li key={cat.id}>
                      <Link 
                        href={`/shop?category=${cat.id}`} 
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${currentCategory?.id === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {cat.name}
                        {currentCategory?.id === cat.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
                <h3 className="font-black text-xl mb-2 relative z-10">Need Help?</h3>
                <p className="text-slate-400 text-xs mb-6 relative z-10 leading-relaxed font-medium">Our support team is available 24/7 for any delivery concerns.</p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl font-bold h-10 shadow-lg shadow-primary/20">
                  Chat With Us
                </Button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {products?.length === 0 ? (
              <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border mx-auto flex items-center justify-center text-slate-300 mb-6">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 max-w-xs mx-auto font-medium">We couldn't find anything matching your selection in this category.</p>
                <Link href="/shop" className="inline-block mt-8">
                  <Button variant="outline" className="rounded-full px-8 font-bold border-2">Clear All Filters</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
