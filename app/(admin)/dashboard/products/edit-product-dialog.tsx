"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { editProductAction } from "@/app/actions/inventory"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Please select a category"),
  price: z.string().min(1, "Price is required"),
  stock: z.string().min(1, "Stock is required"),
  is_active: z.boolean(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
})

export function EditProductDialog({ 
  open, 
  onOpenChange,
  categories,
  product
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: { id: string; name: string }[]
  product: any
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setImagePreview(product.image_url || null)
    }
  }, [product])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(product?.image_url || null)
    }
  }
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      category_id: product?.category_id || (product?.categories?.id || ""),
      price: product?.price?.toString() || "0",
      stock: product?.stock?.toString() || "0",
      is_active: product?.is_active ?? true,
      batch_number: product?.batch_number || "",
      expiry_date: product?.expiry_date ? product.expiry_date.split('T')[0] : "",
    },
  })

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        category_id: product.category_id || (product.categories?.id || ""),
        price: product.price?.toString() || "0",
        stock: product.stock?.toString() || "0",
        is_active: product.is_active ?? true,
        batch_number: product.batch_number || "",
        expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : "",
      })
    }
  }, [product, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", values.name)
      if (values.description) formData.append("description", values.description)
      formData.append("category_id", values.category_id)
      formData.append("price", values.price.toString())
      formData.append("stock", values.stock.toString())
      if (values.is_active) formData.append("is_active", "on")
      if (values.batch_number) formData.append("batch_number", values.batch_number)
      if (values.expiry_date) formData.append("expiry_date", values.expiry_date)

      const fileInput = document.getElementById('edit-image') as HTMLInputElement
      if (fileInput?.files?.[0]) {
        formData.append("image", fileInput.files[0])
      }

      const result = await editProductAction(product.id, formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Product updated successfully!")
        onOpenChange(false)
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white font-sans antialiased">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Edit Product</DialogTitle>
          <DialogDescription className="text-slate-500">
            Modify product details, batch tracking, or update the image.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Local Organic Khasi Tomatoes" className="border-slate-300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-slate-300 bg-white text-slate-900">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-slate-200 z-[200]">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-slate-900 hover:bg-slate-50">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" className="border-slate-300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Stock</FormLabel>
                    <FormControl>
                      <Input type="number" className="border-slate-300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-center space-y-2 mt-2">
                    <FormLabel className="text-slate-700 font-medium">Available for Sale</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Batch Number (FIFO)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BATCH-2026-A" className="border-slate-300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="border-slate-300 text-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormItem>
              <FormLabel className="text-slate-700 font-medium">Product Image</FormLabel>
              <FormControl>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} className="border-slate-300 cursor-pointer" />
              </FormControl>
              {imagePreview && (
                <div className="mt-4 border rounded-md overflow-hidden bg-slate-50 w-full h-40 relative flex justify-center items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                </div>
              )}
            </FormItem>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Update Product'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
