"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Truck, Radio, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

const RiderMap = dynamic(() => import('./rider-map').then(m => m.RiderMap), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full rounded-[1.5rem] bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 font-medium shadow-inner gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading high-precision satellite tracking radar...</span>
    </div>
  )
})

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
  // Fallback coordinates for Jowai, Meghalaya if missing
  const destLat = deliveryLat || 25.4484;
  const destLng = deliveryLng || 92.2016;
  
  // Default rider position slightly away from destination if not active yet
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 25.4450,
    lng: initialLng || 92.2000
  });

  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (riderPos && destLat && destLng) {
      const dist = calculateDistance(riderPos.lat, riderPos.lng, destLat, destLng);
      setLiveDistance(dist);
    }
  }, [riderPos, destLat, destLng]);

  useEffect(() => {
    if (status === 'delivered' || status === 'cancelled') return;

    const supabase = createClient();
    
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

      {/* Leaflet Dynamic Interactive Map */}
      <RiderMap 
        riderLat={riderPos.lat}
        riderLng={riderPos.lng}
        deliveryLat={destLat}
        deliveryLng={destLng}
        riderName={riderName}
        riderPhone={riderPhone}
      />

      <div className="relative z-10 text-center mt-4">
        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
          Tracking active GPS coordinates via Supabase Realtime WebSockets.
        </p>
      </div>
    </div>
  )
}
