"use client"

import { useState } from "react"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2 } from "lucide-react"
import { createWarehouseAction, toggleWarehouseAction } from "@/app/actions/inventory"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"

type Warehouse = {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  radius_km: number
  is_active: boolean
}

export function WarehouseTable({ warehouses }: { warehouses: Warehouse[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    
    const result = await createWarehouseAction({
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      lat: parseFloat(formData.get("lat") as string),
      lng: parseFloat(formData.get("lng") as string),
      radius_km: parseFloat(formData.get("radius_km") as string)
    })
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Warehouse created")
      setIsOpen(false)
    }
    setIsPending(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    const result = await toggleWarehouseAction(id, current)
    if (result.error) toast.error(result.error)
    else toast.success(current ? 'Hub deactivated' : 'Hub activated')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input name="name" placeholder="e.g. Shillong Hub" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input name="address" placeholder="Full address" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Latitude</label>
                  <Input name="lat" type="number" step="any" placeholder="25.5788" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longitude</label>
                  <Input name="lng" type="number" step="any" placeholder="91.8933" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Radius (km)</label>
                <Input name="radius_km" type="number" step="0.1" placeholder="10.5" required />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending} className="bg-primary text-white">
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Warehouse
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Radius (km)</TableHead>
              <TableHead className="text-center">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No warehouses found.
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium text-slate-900">{wh.name}</TableCell>
                  <TableCell className="text-slate-500 max-w-[200px] truncate">{wh.address}</TableCell>
                  <TableCell className="text-right">{wh.radius_km}</TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={wh.is_active}
                      onCheckedChange={() => handleToggle(wh.id, wh.is_active)}
                    />
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
