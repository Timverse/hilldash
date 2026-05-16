"use client"

import { useState } from "react"
import { useCartStore } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

type Product = {
  id: string
  name: string
  price: number
  stock: number
  image_url: string
}

export function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)

  const handleAdd = () => {
    if (product.stock <= 0) {
      toast.error("Out of stock")
      return
    }
    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} units available`)
      return
    }
    
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image_url: product.image_url,
      max_stock: product.stock
    })
    toast.success(`${quantity}x ${product.name} added to basket`)
  }

  const increment = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1)
    } else {
      toast.error("Maximum stock reached")
    }
  }

  const decrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="flex items-center bg-slate-100 rounded-2xl p-1 w-full sm:w-auto justify-between sm:justify-start">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-xl text-slate-600 hover:bg-white hover:text-primary transition-all disabled:opacity-30" 
          onClick={decrement}
          disabled={quantity <= 1}
        >
          <Minus className="w-5 h-5" />
        </Button>
        <span className="font-black text-xl px-6 min-w-[4rem] text-center text-slate-900">{quantity}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-xl text-slate-600 hover:bg-white hover:text-primary transition-all disabled:opacity-30" 
          onClick={increment}
          disabled={quantity >= product.stock}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
      <Button 
        className="flex-1 w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
        onClick={handleAdd}
        disabled={product.stock <= 0}
      >
        <ShoppingCart className="w-6 h-6" />
        Add to Basket
      </Button>
    </div>
  )
}
