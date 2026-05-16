"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Truck, MapPin, Navigation, Radio, AlertCircle } from 'lucide-react'

interface LiveRiderTrackerProps {
  orderId: string;
  initialLat?: number | null;
  initialLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  status?: string;
  riderName?: string | null;
  riderPhone?: string | null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

export function LiveRiderTracker({ 
  orderId, 
  initialLat, 
  initialLng, 
  deliveryLat, 
  deliveryLng, 
  status,
  riderName,
  riderPhone
}: LiveRiderTrackerProps) {
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (riderPos && deliveryLat && deliveryLng) {
      const dist = calculateDistance(riderPos.lat, riderPos.lng, deliveryLat, deliveryLng);
      setLiveDistance(dist);
    }
  }, [riderPos, deliveryLat, deliveryLng]);

  useEffect(() => {
    if (status === 'delivered' || status === 'cancelled') return;

    const supabase = createClient();
    
    // Subscribe to real-time updates on the orders table
    const channel = supabase
      .channel(`tracking_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          const newOrder = payload.new as any;
          if (newOrder.rider_lat && newOrder.rider_lng) {
            setRiderPos({ lat: newOrder.rider_lat, lng: newOrder.rider_lng });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, status]);

  if (status !== 'out_for_delivery' && status !== 'packed') {
    return null;
  }

  return (
    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 relative overflow-hidden mt-8 font-sans antialiased">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20 shrink-0">
            <Truck className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xl text-white tracking-tight leading-none">Live Rider Tracking</h3>
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Radio className="w-3 h-3 animate-pulse" /> {isConnected ? "Live Radar" : "Connecting..."}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {riderName ? `Rider: ${riderName}` : 'Your rider is assigned and on the move!'}
              {riderPhone && ` • Ph: ${riderPhone}`}
            </p>
          </div>
        </div>

        {liveDistance !== null && (
          <div className="text-right bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Live Distance</span>
            <span className="text-xl font-black text-emerald-400">{liveDistance.toFixed(1)} km</span>
          </div>
        )}
      </div>

      {/* Visual Radar / Map Simulator UI */}
      <div className="bg-slate-950 rounded-[1.5rem] p-6 border border-slate-800/80 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px] shadow-inner">
        {/* Radar Rings */}
        <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20 animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="absolute w-48 h-48 rounded-full border border-emerald-500/30 pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full border border-emerald-500/40 pointer-events-none" />

        {/* Delivery Destination Pin */}
        <div className="absolute top-12 right-12 flex flex-col items-center group cursor-pointer z-20">
          <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 border-2 border-white animate-pulse">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 mt-1 shadow-sm">Destination</span>
        </div>

        {/* Live Rider Pin */}
        <div className="absolute bottom-12 left-16 flex flex-col items-center group cursor-pointer z-20 transition-all duration-1000">
          <div className="w-10 h-10 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 border-2 border-white animate-bounce">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 mt-1 shadow-sm">
            {riderPos ? `📍 GPS Active` : `🛵 On the way`}
          </span>
        </div>

        {/* Center Radar Sweep */}
        <div className="absolute w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500 animate-pulse z-10" />

        <div className="relative z-10 text-center mt-auto pt-24 pointer-events-none">
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
            {riderPos ? `Tracking active coordinates: ${riderPos.lat.toFixed(4)}, ${riderPos.lng.toFixed(4)}` : 'Establishing secure satellite link with rider GPS device...'}
          </p>
        </div>
      </div>
    </div>
  )
}
