"use client"

import { useState } from "react"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Trash2, Tag, Gift, Percent, AlertCircle } from "lucide-react"
import { createDiscountAction, toggleDiscountActiveAction, deleteDiscountAction } from "@/app/actions/discounts"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog"

type Category = { id: string; name: string }
type Product = { id: string; name: string; price: number }
type Discount = {
  id: string
  title: string
  code: string | null
  discount_type: string
  discount_value: number
  target_type: string
  target_id: string | null
  min_order_value: number
  max_discount_amount: number | null
  is_active: boolean
  created_at: string
}

export function DiscountsTable({ 
  discounts, categories, products 
}: { 
  discounts: Discount[]; categories: Category[]; products: Product[] 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [targetType, setTargetType] = useState("all")
  const [targetId, setTargetId] = useState("")
  const [minOrderValue, setMinOrderValue] = useState("0")
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("")
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !discountValue) return

    setIsPending(true)
    const formData = new FormData()
    formData.append("title", title)
    if (code.trim()) formData.append("code", code.trim().toUpperCase())
    formData.append("discount_type", discountType)
    formData.append("discount_value", discountValue)
    formData.append("target_type", targetType)
    if (targetType !== "all" && targetId) formData.append("target_id", targetId)
    formData.append("min_order_value", minOrderValue)
    if (maxDiscountAmount) formData.append("max_discount_amount", maxDiscountAmount)
    if (isActive) formData.append("is_active", "on")

    const result = await createDiscountAction(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Discount promotion created successfully!")
      setTitle("")
      setCode("")
      setDiscountValue("")
      setTargetType("all")
      setTargetId("")
      setMinOrderValue("0")
      setMaxDiscountAmount("")
      setIsActive(true)
      setIsOpen(false)
    }
    setIsPending(false)
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const result = await toggleDiscountActiveAction(id, !currentStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Discount ${!currentStatus ? 'activated' : 'deactivated'}`)
    }
    setTogglingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotional discount?")) return
    setDeletingId(id)
    const result = await deleteDiscountAction(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Discount deleted")
    }
    setDeletingId(null)
  }

  const getTargetLabel = (d: Discount) => {
    if (d.target_type === 'all') return <Badge variant="outline" className="bg-slate-100 text-slate-800 font-bold border-slate-200">Sitewide</Badge>
    if (d.target_type === 'category') {
      const cat = categories.find(c => c.id === d.target_id)
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-bold">Category: {cat?.name || 'Unknown'}</Badge>
    }
    if (d.target_type === 'product') {
      const prod = products.find(p => p.id === d.target_id)
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-bold line-clamp-1">Product: {prod?.name || 'Unknown'}</Badge>
    }
    return null
  }

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg">Active Promotions ({discounts.filter(d => d.is_active).length})</h3>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Discounts automatically apply or can be selected during checkout</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold h-12 px-6 shadow-xl shadow-emerald-600/20 transition-all active:scale-95">
              <Plus className="w-5 h-5 mr-2" /> Add Promotion / Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-[2.5rem] p-8 bg-white border border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar font-sans">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Gift className="w-6 h-6 text-emerald-600" /> Create Amazon-Grade Discount
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-xs mt-1">
                Configure promotional rules, thresholds, and target audience.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Promotion Title</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Festive Season Megashow"
                  className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 font-bold text-slate-900" 
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Coupon Code (Optional)</label>
                  <Input 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    placeholder="e.g. FESTIVE10"
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 font-bold text-slate-900 uppercase tracking-wider" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Discount Type</label>
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value)} 
                    className="w-full h-13 rounded-2xl bg-slate-50 border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Discount Value</label>
                  <Input 
                    type="number"
                    step="any"
                    value={discountValue} 
                    onChange={(e) => setDiscountValue(e.target.value)} 
                    placeholder={discountType === 'percentage' ? "e.g. 10 (for 10%)" : "e.g. 50 (for ₹50)"}
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 font-bold text-slate-900" 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Target Scope</label>
                  <select 
                    value={targetType} 
                    onChange={(e) => {
                      setTargetType(e.target.value)
                      setTargetId("")
                    }} 
                    className="w-full h-13 rounded-2xl bg-slate-50 border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Sitewide (All Products)</option>
                    <option value="category">Specific Category</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>
              </div>

              {targetType === 'category' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Select Category</label>
                  <select 
                    value={targetId} 
                    onChange={(e) => setTargetId(e.target.value)} 
                    className="w-full h-13 rounded-2xl bg-slate-50 border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'product' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Select Product</label>
                  <select 
                    value={targetId} 
                    onChange={(e) => setTargetId(e.target.value)} 
                    className="w-full h-13 rounded-2xl bg-slate-50 border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Min Order Value (₹)</label>
                  <Input 
                    type="number"
                    value={minOrderValue} 
                    onChange={(e) => setMinOrderValue(e.target.value)} 
                    placeholder="e.g. 500"
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 font-bold text-slate-900" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Max Discount Cap (₹)</label>
                  <Input 
                    type="number"
                    value={maxDiscountAmount} 
                    onChange={(e) => setMaxDiscountAmount(e.target.value)} 
                    placeholder="e.g. 1000 (Optional)"
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 font-bold text-slate-900" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Activate Immediately</h4>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">Customers can start using this discount instantly</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-12 rounded-2xl font-bold px-6">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-xl shadow-emerald-600/20 transition-all">
                  {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Create Promotion
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/75 border-b border-slate-100">
            <TableRow>
              <TableHead className="py-5 px-6 font-black text-slate-400 uppercase text-[10px] tracking-wider">Promotion Details</TableHead>
              <TableHead className="py-5 px-6 font-black text-slate-400 uppercase text-[10px] tracking-wider">Discount Value</TableHead>
              <TableHead className="py-5 px-6 font-black text-slate-400 uppercase text-[10px] tracking-wider">Target Scope</TableHead>
              <TableHead className="py-5 px-6 font-black text-slate-400 uppercase text-[10px] tracking-wider">Thresholds</TableHead>
              <TableHead className="py-5 px-6 font-black text-slate-400 uppercase text-[10px] tracking-wider">Status</TableHead>
              <TableHead className="py-5 px-6 font-black text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                  No discount promotions configured yet. Click 'Add Promotion / Discount' above to create one.
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((d) => (
                <TableRow key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-5 px-6">
                    <p className="font-black text-slate-900 text-base mb-1">{d.title}</p>
                    {d.code && (
                      <span className="inline-flex items-center gap-1 font-mono font-extrabold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg shadow-sm">
                        <Tag className="w-3 h-3" /> {d.code}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-5 px-6 font-black text-slate-900 text-lg">
                    {d.discount_type === 'percentage' ? `${d.discount_value}% OFF` : `₹${d.discount_value} OFF`}
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    {getTargetLabel(d)}
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <p className="text-xs font-bold text-slate-700 mb-0.5">Min Order: ₹{d.min_order_value}</p>
                    {d.max_discount_amount && <p className="text-[11px] text-slate-400 font-medium">Max Cap: ₹{d.max_discount_amount}</p>}
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={d.is_active} 
                        disabled={togglingId === d.id}
                        onCheckedChange={() => handleToggle(d.id, d.is_active)} 
                      />
                      {togglingId === d.id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={deletingId === d.id}
                      onClick={() => handleDelete(d.id)} 
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl"
                    >
                      {deletingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
