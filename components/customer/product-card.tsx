"use client"

import { useCartStore } from "@/lib/store/cart"
import { Button } from "@/components/ui/button"
import { Plus, Minus, ShoppingCart, Star } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

type Product = {
  id: string
  name: string
  mrp?: number | null
  price: number
  unit?: string | null
  stock_status?: string | null
  stock: number
  image_url: string
}

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQuantity } = useCartStore()

  const cartItem = items.find(item => item.product_id === product.id)
  const quantityInCart = cartItem?.quantity || 0

  const isOutOfStock = product.stock_status ? product.stock_status === 'out_of_stock' : product.stock <= 0
  const maxStockAllowed = product.stock_status === 'in_stock' ? 99 : (product.stock_status === 'limited_stock' ? Math.max(product.stock, 5) : product.stock)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) {
      toast.error("Currently out of stock")
      return
    }
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
      max_stock: maxStockAllowed
    })
    toast.success(`${product.name} added to cart`)
  }

  const increment = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantityInCart >= maxStockAllowed) {
      toast.error("Maximum limit reached")
      return
    }
    updateQuantity(product.id, quantityInCart + 1)
  }

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantityInCart > 0) {
      updateQuantity(product.id, quantityInCart - 1)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border border-slate-100 p-4 hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col h-full group"
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ShoppingCart className="w-10 h-10 opacity-20" />
            </div>
          )}
          
          <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-slate-900 border border-white/20 z-10">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span>4.8</span>
          </div>

          {product.stock_status === 'limited_stock' && !isOutOfStock && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md z-10">
              Limited Stock
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-slate-900 font-black text-sm backdrop-blur-[2px] uppercase tracking-widest z-20">
              Out of Stock
            </div>
          )}
        </div>
        
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Fresh Essentials</p>
          <h3 className="font-bold text-slate-900 text-lg line-clamp-1 mb-1" title={product.name}>{product.name}</h3>
          <p className="text-slate-500 text-xs mb-4 font-bold">{product.unit || '1 kg'}</p>
        </div>
      </Link>
      
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] line-through">₹{product.mrp || Math.round(product.price * 1.2)}</span>
          <span className="font-black text-slate-900 text-xl tracking-tight">₹{product.price}</span>
        </div>

        <AnimatePresence mode="wait">
          {quantityInCart > 0 ? (
            <motion.div 
              key="counter"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center bg-primary rounded-xl p-0.5 shadow-lg shadow-primary/20"
            >
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20 rounded-lg" onClick={decrement}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-black text-white px-3 min-w-[2rem] text-center">{quantityInCart}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20 rounded-lg" onClick={increment}>
                <Plus className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="add-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button 
                variant="outline"
                className="rounded-xl border-primary text-primary font-bold hover:bg-primary hover:text-white h-10 px-6 transition-all active:scale-95" 
                onClick={handleAdd}
                disabled={isOutOfStock}
              >
                Add
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
