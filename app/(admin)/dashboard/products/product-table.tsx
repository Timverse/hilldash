"use client"

import { useState } from "react"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Image as ImageIcon, Pencil } from "lucide-react"
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price (₹)</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No products found. Add your first product.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-100 border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-slate-100 border flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-slate-500 font-normal">
                      {product.categories?.name || 'Uncategorized'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">₹{product.price}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
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
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
