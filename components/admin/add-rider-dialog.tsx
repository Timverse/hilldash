"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addRiderAction } from '@/app/actions/riders';

interface Warehouse {
  id: string;
  name: string;
}

export function AddRiderDialog({ warehouses }: { warehouses: Warehouse[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addRiderAction(formData);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Rider added successfully! 🛵");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 shadow-md">
          <Plus className="w-4 h-4" /> Add New Rider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl p-6 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Add Delivery Personnel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rider Name</label>
            <Input name="name" required placeholder="e.g. Banshan Khongwir" className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
            <Input name="phone" required placeholder="e.g. +91 98765 43210" className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-medium" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Hub / Warehouse</label>
            <select name="warehouse_id" required className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600">
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial Status</label>
            <select name="status" defaultValue="available" className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600">
              <option value="available">Available</option>
              <option value="on_delivery">On Delivery</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding Rider...</> : "Save Rider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
