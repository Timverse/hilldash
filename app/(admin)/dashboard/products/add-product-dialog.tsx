"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProductAction } from "@/app/actions/inventory"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AddProductDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: { id: string; name: string }[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const nameEl = form.elements.namedItem("name") as HTMLInputElement
    const priceEl = form.elements.namedItem("price") as HTMLInputElement
    const stockEl = form.elements.namedItem("stock") as HTMLInputElement
    const descEl = form.elements.namedItem("description") as HTMLInputElement

    // Basic validation
    if (!nameEl.value.trim()) { toast.error("Product name is required"); return }
    if (!selectedCategoryId) { toast.error("Please select a category"); return }
    if (!priceEl.value) { toast.error("Price is required"); return }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", nameEl.value.trim())
      formData.append("description", descEl.value.trim())
      formData.append("category_id", selectedCategoryId)
      formData.append("price", priceEl.value)
      formData.append("stock", stockEl.value || "0")
      if (isActive) formData.append("is_active", "on")
      if (imageFile) formData.append("image", imageFile)

      console.log("Submitting product:", {
        name: nameEl.value,
        category_id: selectedCategoryId,
        price: priceEl.value,
        stock: stockEl.value,
      })

      const result = await createProductAction(formData)
      console.log("Result:", result)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Product created successfully!")
        form.reset()
        setImagePreview(null)
        setImageFile(null)
        setSelectedCategoryId("")
        setIsActive(true)
        onOpenChange(false)
      }
    } catch (err) {
      console.error("Caught error:", err)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Add New Product</DialogTitle>
          <DialogDescription className="text-slate-500">
            Fill in the details below to add a product to your inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-slate-700 font-medium">Product Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Fresh Organic Tomatoes"
              className="border-slate-300 focus:border-emerald-500"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional short description"
              className="border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">Category *</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="border-slate-300 bg-white text-slate-900 w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 z-[200]">
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">No categories yet. Create one first.</div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-slate-900 hover:bg-slate-50">
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-slate-700 font-medium">Price (₹) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="border-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Stock */}
            <div className="space-y-1.5">
              <Label htmlFor="stock" className="text-slate-700 font-medium">Initial Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue="0"
                className="border-slate-300"
              />
            </div>

            {/* Available toggle */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">Available for Sale</Label>
              <div className="flex items-center h-9">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <span className="ml-2 text-sm text-slate-500">{isActive ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 font-medium">Product Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="border-slate-300 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-2 border rounded-lg overflow-hidden bg-slate-50 h-36 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-full object-contain" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Save Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
