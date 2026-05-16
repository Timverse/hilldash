"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { updateOrderStatusAction } from '@/app/actions/orders';
import { toast } from 'sonner';

export function RiderOrderActions({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelivered = async () => {
    setLoading(true);
    try {
      const result = await updateOrderStatusAction(orderId, 'delivered');
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Order marked as Delivered! Great job!");
      }
    } catch (err) {
      toast.error("Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleDelivered}
      disabled={loading}
      className="h-14 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
    >
      <CheckCircle2 className="w-5 h-5" /> 
      {loading ? "Updating..." : "Mark Delivered"}
    </Button>
  );
}
