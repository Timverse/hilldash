import { createClient } from '@/lib/supabase/server'
import { ProductTable } from './product-table'

// Force dynamic rendering - disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductsPage() {
  const supabase = await createClient()

  // Simplified query without explicit foreign key names
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  // Debug logging
  console.log('Products query result:', { 
    count: products?.length || 0, 
    error: productsError?.message 
  })
  console.log('Categories query result:', { 
    count: categories?.length || 0, 
    error: categoriesError?.message 
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
        <p className="text-slate-500">Manage products, pricing, and stock for the Jowai Central Hub.</p>
      </div>

      <ProductTable products={products || []} categories={categories || []} />
    </div>
  )
}
