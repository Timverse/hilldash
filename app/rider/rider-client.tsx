"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bike, MapPin, Phone, CheckCircle2, Navigation, ShoppingBag, ArrowRight, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { RiderOrderActions } from '@/components/rider/order-actions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRiderShiftStore } from '@/lib/store/rider-shift';

export function RiderClient({ 
  initialOrders = [], 
  initialCompleted = [], 
  totalEarnings = 0 
}: { 
  initialOrders: any[]; 
  initialCompleted: any[]; 
  totalEarnings: number 
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders || []);
  const [completed, setCompleted] = useState(initialCompleted || []);
  
  // Daily 7:30 AM Shift Management State
  const { isReadyForWork, checkInForWork, checkShiftStatus } = useRiderShiftStore();
  const [shiftActive, setShiftActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check shift status on mount and initialize Supabase rider status
  useEffect(() => {
    const active = checkShiftStatus();
    setShiftActive(active);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        if (active) {
          supabase.from('riders').update({ status: 'available' }).eq('id', data.user.id).then();
        } else {
          supabase.from('riders').update({ status: 'off_duty' }).eq('id', data.user.id).then();
        }
      }
    });
  }, [checkShiftStatus]);

  // Sync state if initial props change via server revalidation
  useEffect(() => {
    setOrders(initialOrders || []);
    setCompleted(initialCompleted || []);
  }, [initialOrders, initialCompleted]);

  // SUPABASE REALTIME SUBSCRIPTION FOR LIVE RIDER DISPATCHES (INSTANT CLIENT STATE SYNC)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-orders-rider-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Realtime rider order update received:', payload);

        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new;
          if (newOrder?.status === 'packed' || newOrder?.status === 'out_for_delivery') {
            setOrders(prev => [newOrder, ...prev]);
            toast.success('📦 New Dispatch Alert: Order is ready for delivery!');
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = payload.new;
          
          // Handle active dispatches (packed, out_for_delivery)
          if (updatedOrder?.status === 'packed' || updatedOrder?.status === 'out_for_delivery') {
            setOrders(prev => {
              const exists = prev.some(o => o.id === updatedOrder.id);
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
              } else {
                toast.success('📦 New Dispatch Alert: Order is ready for delivery!');
                return [updatedOrder, ...prev];
              }
            });
          } else {
            // If status changed to delivered or cancelled, remove from active dispatches list
            setOrders(prev => prev.filter(o => o.id !== updatedOrder?.id));

            if (updatedOrder?.status === 'delivered') {
              setCompleted(prev => {
                if (!prev.some(c => c.id === updatedOrder.id)) {
                  toast.success('🎉 Delivery Confirmed! Commission added to your earnings.');
                  return [...prev, { id: updatedOrder.id, total: updatedOrder.total }];
                }
                return prev;
              });
            }
          }
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old?.id));
        }

        // Trigger background server revalidation
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleStartShift = async () => {
    checkInForWork();
    setShiftActive(true);
    toast.success("🏍️ Shift Started! You are now online for today's deliveries.");
    if (currentUser) {
      const supabase = createClient();
      await supabase.from('riders').update({ status: 'available' }).eq('id', currentUser.id);
    }
  };

  const calculatedEarnings = completed.length * 40; // ₹40 per delivery commission

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Bike className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white leading-none">
              Sawaïom <span className="text-emerald-400">Rider</span>
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Mookyrdup Hub</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full shadow-sm transition-colors ${
          shiftActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${shiftActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className={`text-xs font-bold uppercase tracking-widest ${shiftActive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {shiftActive ? 'Online' : 'Off Duty'}
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {!shiftActive ? (
          <div className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-500/40 rounded-[2.5rem] p-8 text-center space-y-6 shadow-xl relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/30 animate-bounce">
              <Bike className="w-10 h-10" />
            </div>
            <div>
              <Badge className="bg-amber-500 text-slate-900 font-extrabold uppercase tracking-widest px-3 py-1 text-xs mb-3 border-none shadow-sm">
                Shift Reset (7:30 AM)
              </Badge>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Ready for Today's Deliveries?</h2>
              <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                Your daily rider shift resets every morning at 7:30 AM. Check in now to alert Mookyrdup Hub and start receiving live delivery dispatches.
              </p>
            </div>
            <Button 
              onClick={handleStartShift}
              className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6" /> PRESS HERE: READY FOR WORK
            </Button>
          </div>
        ) : (
          <>
            {/* Rider Stats / Earnings Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-6 shadow-xl shadow-emerald-900/40 border border-emerald-500/30 relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Today's Earnings</p>
                  <h2 className="text-4xl font-black text-white mt-1">₹{calculatedEarnings}</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20 relative z-10">
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Completed Deliveries</p>
                  <p className="text-2xl font-black text-white mt-0.5">{completed.length} Orders</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Active Dispatch</p>
                  <p className="text-2xl font-black text-white mt-0.5">{orders.length} Pending</p>
                </div>
              </div>
            </div>

            {/* Orders Header */}
            <div className="flex justify-between items-center pt-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" /> Active Dispatches
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 shadow-sm">
                Live Feed
              </span>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center shadow-inner animate-fadeIn">
                <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 mb-4 border border-slate-700 shadow-sm">
                  <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 tracking-tight">No active dispatches</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium leading-relaxed">Waiting for Mookyrdup Hub to pack and assign new orders. Take a breather!</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {orders.map((order) => {
                  const nameMatch = order.notes?.match(/Name: ([^\n]+)/);
                  const phoneMatch = order.notes?.match(/Phone: ([^\n]+)/);
                  const customerName = order.customer_name || nameMatch?.[1] || "Guest";
                  const customerPhone = order.customer_phone || phoneMatch?.[1] || "+91 8974319494";
                  const mapsUrl = `https://maps.google.com/?q=${order.delivery_lat || 25.4484},${order.delivery_lng || 92.2031}`;

                  return (
                    <div 
                      key={order.id} 
                      className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6 shadow-xl space-y-6 hover:border-slate-600 transition-all"
                    >
                      {/* Order Header */}
                      <div className="flex justify-between items-start border-b border-slate-700 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/50 shadow-sm">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {format(new Date(order.created_at), "hh:mm a")}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-white tracking-tight">{customerName}</h3>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-medium">Collect Cash</span>
                          <span className="text-xl font-black text-emerald-400">₹{order.total?.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Customer Details & Address */}
                      <div className="space-y-3.5 text-sm font-medium">
                        <div className="flex items-start gap-3 text-slate-300">
                          <MapPin className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-white leading-snug">{order.delivery_address || 'Jowai Market, Near Civil Hospital'}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-mono bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-600 shadow-sm">
                                📍 GPS: {order.delivery_lat?.toFixed(5) || '25.44840'}, {order.delivery_lng?.toFixed(5) || '92.20310'}
                              </span>
                              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 shadow-sm">
                                📏 ~{order.distance_km?.toFixed(1) || '1.8'} km away
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-sm">
                                🚗 Fee: ₹{order.delivery_fee || 20}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-slate-300">
                          <Phone className="w-5 h-5 text-blue-400 shrink-0" />
                          <a href={`tel:${customerPhone}`} className="font-bold text-white hover:underline flex items-center gap-2">
                            {customerPhone}
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Call</span>
                          </a>
                        </div>

                        {order.notes && order.notes !== '' && !order.notes.startsWith('Name:') && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-amber-300 text-xs flex items-start gap-2 shadow-sm">
                            <span className="font-bold uppercase tracking-wider shrink-0 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">Note</span>
                            <p className="leading-snug">{order.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                        <Button asChild variant="outline" className="h-14 rounded-2xl font-bold bg-slate-700 hover:bg-slate-600 border-none text-white gap-2 shadow-lg active:scale-95 transition-all">
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation className="w-5 h-5 text-blue-400" /> Navigate
                          </a>
                        </Button>

                        <RiderOrderActions orderId={order.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
