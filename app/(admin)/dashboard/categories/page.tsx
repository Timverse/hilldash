import { createClient } from '@/lib/supabase/server'
import { CategoryTable } from './category-table'

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Categories</h1>
        <p className="text-slate-500">Manage product categories for HillDash.</p>
      </div>

      <CategoryTable categories={categories || []} />
    </div>
  )
}
