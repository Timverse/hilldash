"use client"

import { useState } from "react"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Image as ImageIcon, Pencil, AlertTriangle, Clock } from "lucide-react"
import { toggleProductAvailability } from "@/app/actions/inventory"
import { AddProductDialog } from "./add-product-dialog"
import { EditProductDialog } from "./edit-product-dialog"
import { toast } from "sonner"

type Product = {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
  image_url: string
  batch_number?: string | null
  expiry_date?: string | null
  categories?: { name: string } | null
}

export function ProductTable({ products, categories }: { products: Product[], categories: { id: string; name: string }[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)

  const handleToggle = async (id: string, current: boolean) => {
    setIsPending(true)
    const result = await toggleProductAvailability(id, current)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(current ? "Product marked as Out of Stock" : "Product marked as Available")
    }
    setIsPending(false)
  }

  const handleEditClick = (product: any) => {
    setEditingProduct(product)
    setIsEditOpen(true)
  }

  const isExpiringSoon = (expiryDate?: string | null) => {
    if (!expiryDate) return false;
    const diffTime = new Date(expiryDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }

  const isExpired = (expiryDate?: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate).getTime() < new Date().getTime();
  }

  return (
    <div className="space-y-4 font-sans antialiased">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-amber-800 text-xs font-bold shadow-sm">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>FIFO Active: Automated batch and perishability tracking enabled for Khasi produce.</span>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/75 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-16 py-4">Image</TableHead>
              <TableHead className="py-4 font-bold text-slate-700">Name</TableHead>
              <TableHead className="py-4 font-bold text-slate-700">Category</TableHead>
              <TableHead className="py-4 font-bold text-slate-700">Batch (FIFO)</TableHead>
              <TableHead className="py-4 font-bold text-slate-700">Expiry Date</TableHead>
              <TableHead className="text-right py-4 font-bold text-slate-700">Price (₹)</TableHead>
              <TableHead className="text-right py-4 font-bold text-slate-700">Stock</TableHead>
              <TableHead className="text-center py-4 font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-center py-4 font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-slate-500 font-medium">
                  No products found. Add your first fresh product.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const expired = isExpired(product.expiry_date);
                const expiringSoon = isExpiringSoon(product.expiry_date);

                return (
                  <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      {product.image_url ? (
                        <div className="h-11 w-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-slate-600 font-medium bg-slate-50 border-slate-200">
                        {product.categories?.name || 'Uncategorized'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.batch_number ? (
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                          {product.batch_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No batch</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">
                          {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : '—'}
                        </span>
                        {expired && (
                          <Badge className="bg-red-50 text-red-600 border border-red-200 font-bold px-2 py-0.5 rounded uppercase tracking-wider text-[9px] shadow-sm flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Expired
                          </Badge>
                        )}
                        {expiringSoon && !expired && (
                          <Badge className="bg-amber-50 text-amber-600 border border-amber-200 font-bold px-2 py-0.5 rounded uppercase tracking-wider text-[9px] shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-slate-900">₹{product.price}</TableCell>
                    <TableCell className="text-right font-bold text-slate-700">{product.stock}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Switch 
                          checked={product.is_active}
                          disabled={isPending}
                          onCheckedChange={() => handleToggle(product.id, product.is_active)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)} className="hover:bg-slate-100 rounded-xl">
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddProductDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        categories={categories}
      />

      <EditProductDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        categories={categories}
        product={editingProduct}
      />
    </div>
  )
}
