"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Radio, Loader2 } from 'lucide-react';
import { updateOrderStatusAction, broadcastRiderLocation } from '@/app/actions/orders';
import { toast } from 'sonner';

export function RiderOrderActions({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleDelivered = async () => {
    setLoading(true);
    try {
      const result = await updateOrderStatusAction(orderId, 'delivered');
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Order marked as Delivered! Great job!");
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          setTracking(false);
        }
      }
    } catch (err) {
      toast.error("Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  const toggleTracking = () => {
    if (tracking) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setTracking(false);
      toast.info("Live GPS tracking paused.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.success("Live GPS tracking started! Broadcasting to customer...");
    setTracking(true);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await broadcastRiderLocation(orderId, latitude, longitude);
        } catch (err) {
          console.error("Failed to broadcast location:", err);
        }
      },
      (err) => {
        console.error("Watch position error:", err);
        toast.error("Lost GPS signal. Retrying...");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setWatchId(id);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button 
        onClick={toggleTracking}
        variant={tracking ? "default" : "outline"}
        className={`h-12 rounded-xl font-bold gap-2 transition-all ${tracking ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 animate-pulse' : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
      >
        <Radio className={`w-4 h-4 ${tracking ? 'animate-spin' : ''}`} /> 
        {tracking ? "Live Tracking Active" : "Start Live Tracking"}
      </Button>

      <Button 
        onClick={handleDelivered}
        disabled={loading}
        className="h-14 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
      >
        <CheckCircle2 className="w-5 h-5" /> 
        {loading ? "Updating..." : "Mark Delivered"}
      </Button>
    </div>
  );
}
