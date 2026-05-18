"use client"

import { useState, useEffect } from "react"
import { useAddressStore } from "@/lib/store/address"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Plus, CheckCircle2, Trash2, Home, Briefcase, MapPinCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { resolveJowaiLocality } from "@/lib/utils/distance"

export function AddressesClient({ legacyAddresses }: { legacyAddresses: string[] }) {
  const { addresses, activeAddressId, setActiveAddress, addAddress, deleteAddress } = useAddressStore()
  const [mounted, setMounted] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newAddressText, setNewAddressText] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newAddressText.trim()) {
      toast.error("Please provide both title and address")
      return
    }

    addAddress({
      title: newTitle.trim(),
      address: newAddressText.trim(),
      locality: resolveJowaiLocality(25.4508, 92.1868, newAddressText.trim()),
      lat: 25.4508,
      lng: 92.1868,
      isDefault: true
    })

    toast.success("New address saved permanently! 🏡")
    setNewTitle("")
    setNewAddressText("")
    setIsAddingNew(false)
  }

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center text-slate-400 font-medium animate-pulse">Loading permanent saved addresses...</div>
  }

  return (
    <div className="space-y-8 font-sans antialiased">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Permanent Saved Addresses</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage your permanent delivery locations in Jowai. Switch active address or add multiple locations.</p>
        </div>
        {!isAddingNew && (
          <Button onClick={() => setIsAddingNew(true)} className="rounded-2xl font-bold h-12 px-6 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 gap-2">
            <Plus className="w-5 h-5" /> Add New Address
          </Button>
        )}
      </div>

      {isAddingNew && (
        <form onSubmit={handleAddSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-lg">Add New Permanent Address</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Address Title / Label</label>
              <Input 
                required 
                placeholder="e.g. Home, Work, Mom's House" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary px-6 text-base font-medium shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Complete Street Address & Landmark</label>
              <Textarea 
                required 
                placeholder="House No, Street, Landmark, Area" 
                rows={2} 
                value={newAddressText} 
                onChange={e => setNewAddressText(e.target.value)}
                className="rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary p-4 text-base font-medium shadow-inner"
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddingNew(false)} className="rounded-xl font-bold h-12 px-6 border-2">Cancel</Button>
            <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 shadow-lg shadow-primary/20">Save Permanent Address</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6">
        {addresses.length > 0 ? (
          addresses.map((addr) => {
            const isActive = activeAddressId === addr.id
            return (
              <div 
                key={addr.id} 
                className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm ${
                  isActive ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mt-1 transition-colors ${
                    isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-xl text-slate-900">{addr.title || addr.locality}</h3>
                      {isActive && (
                        <Badge className="bg-primary text-white border-none font-bold px-3 py-1 text-xs rounded-xl shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> Active Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed max-w-lg">{addr.address}</p>
                    <p className="text-xs text-primary font-bold mt-1">📍 Jowai Locality Zone: {addr.locality}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {!isActive && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setActiveAddress(addr.id)
                        toast.success(`Active address switched to ${addr.title || addr.locality}`)
                      }}
                      className="rounded-xl font-bold border-2 h-11 px-6 hover:bg-primary/5 hover:border-primary hover:text-primary"
                    >
                      Set as Active
                    </Button>
                  )}

                  {addresses.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        deleteAddress(addr.id)
                        toast.success("Address deleted permanently")
                      }}
                      className="rounded-xl h-11 w-11 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center text-slate-300 mb-6 shadow-inner">
              <MapPin className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No saved addresses</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">You haven't saved any permanent delivery addresses yet. Add one above to get started.</p>
            <Button onClick={() => setIsAddingNew(true)} className="rounded-full px-10 font-bold h-14 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
              Add New Address
            </Button>
          </div>
        )}
      </div>

      {legacyAddresses.length > 0 && (
        <div className="pt-8 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Past Order Locations (Legacy)</h4>
          <div className="space-y-3">
            {legacyAddresses.map((addr, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-600 font-medium">{addr}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    addAddress({
                      title: `Legacy Address #${idx + 1}`,
                      address: addr,
                      locality: resolveJowaiLocality(25.4508, 92.1868, addr),
                      lat: 25.4508,
                      lng: 92.1868,
                      isDefault: true
                    })
                    toast.success("Legacy address imported permanently!")
                  }}
                  className="rounded-xl text-xs font-bold h-9 px-4 border-slate-200 shrink-0"
                >
                  Import to Permanent Store
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
