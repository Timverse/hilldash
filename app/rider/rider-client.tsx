"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bike, MapPin, Phone, CheckCircle2, Navigation, ShoppingBag, ArrowRight, ShieldCheck, Clock, AlertCircle, Receipt, Copy, Check, PauseCircle, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { RiderOrderActions } from '@/components/rider/order-actions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { saveRiderReceiptAction } from '@/app/actions/rider-receipt';

export function RiderClient({ 
  initialOrders = [], 
  initialCompleted = [], 
  totalEarnings = 0,
  initialRiderProfile = null
}: { 
  initialOrders: any[]; 
  initialCompleted: any[]; 
  totalEarnings: number;
  initialRiderProfile?: any;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders || []);
  const [completed, setCompleted] = useState(initialCompleted || []);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [riderProfile, setRiderProfile] = useState<any>(initialRiderProfile);

  // Online / Stop Work State
  const [isWorking, setIsWorking] = useState(initialRiderProfile ? initialRiderProfile.status !== 'off_duty' : true);

  // Daily Receipt Generation State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [generatedTokenId, setGeneratedTokenId] = useState<string | null>(initialRiderProfile?.active_token_id || null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // SYSTEM REFRESH WINDOW CHECK (7:30 AM - 7:50 AM Daily)
  // "between 7:30AM-7:50AM, they should not be able to login as we are doing a system refresh"
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isRefreshWindow = currentHour === 7 && currentMinute >= 30 && currentMinute < 50;

  // Filter completed orders for the active window
  const todayCompleted = completed;
  
  // If rider has an active_token_id, it means they already generated a receipt for their work, so their displayed earnings refresh to 0
  const hasGeneratedReceipt = !!riderProfile?.active_token_id;
  const effectiveCompletedCount = hasGeneratedReceipt ? 0 : todayCompleted.length;
  const calculatedEarnings = effectiveCompletedCount * 40; // ₹40 per delivery commission

  // Fetch current user and rider profile on mount if not provided by server props
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        supabase.from('riders').select('*').eq('id', data.user.id).single().then(({ data: rider }) => {
          if (rider) {
            setRiderProfile(rider);
            setIsWorking(rider.status !== 'off_duty');
            if (rider.active_token_id) {
              setGeneratedTokenId(rider.active_token_id);
            }
          }
        });
      }
    });
  }, []);

  // Sync state if initial props change via server revalidation
  useEffect(() => {
    setOrders(initialOrders || []);
    setCompleted(initialCompleted || []);
    if (initialRiderProfile) {
      setRiderProfile(initialRiderProfile);
      setIsWorking(initialRiderProfile.status !== 'off_duty');
      if (initialRiderProfile.active_token_id) {
        setGeneratedTokenId(initialRiderProfile.active_token_id);
      }
    }
  }, [initialOrders, initialCompleted, initialRiderProfile]);

  // SUPABASE REALTIME SUBSCRIPTION FOR LIVE RIDER DISPATCHES (INSTANT CLIENT STATE SYNC)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-orders-rider-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Realtime rider order update received:', payload);

        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new;
          if ((newOrder?.status === 'packed' || newOrder?.status === 'out_for_delivery') && (!riderProfile?.warehouse_id || newOrder.warehouse_id === riderProfile.warehouse_id)) {
            setOrders(prev => [newOrder, ...prev]);
            toast.success('📦 New Dispatch Alert: Order is ready for delivery!');
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = payload.new;
          
          if ((updatedOrder?.status === 'packed' || updatedOrder?.status === 'out_for_delivery') && (!riderProfile?.warehouse_id || updatedOrder.warehouse_id === riderProfile.warehouse_id)) {
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
            setOrders(prev => prev.filter(o => o.id !== updatedOrder?.id));

            if (updatedOrder?.status === 'delivered' && (!riderProfile?.warehouse_id || updatedOrder.warehouse_id === riderProfile.warehouse_id)) {
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

        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, riderProfile]);

  // If we are in the 7:30 AM - 7:50 AM System Refresh Window, show the blocking maintenance screen
  if (isRefreshWindow) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center selection:bg-emerald-500 selection:text-slate-900 animate-fadeIn">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center text-amber-400 mb-6 shadow-lg animate-pulse">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">System Refresh in Progress</h1>
        <Badge className="bg-amber-500 text-slate-950 font-extrabold uppercase tracking-widest px-3 py-1 text-[10px] mb-6 border-none">
          7:30 AM – 7:50 AM Daily Maintenance
        </Badge>
        <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed mb-8">
          We are currently auditing yesterday's delivery receipts and resetting active logs for the new shift. Please check back at 7:50 AM to access your portal.
        </p>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-xs w-full text-xs text-slate-500 font-mono mx-auto">
          System Time: {format(now, "hh:mm a")}
        </div>
      </div>
    );
  }

  // Toggle Work Status (Online / Stop Work for Now)
  const handleToggleWorkStatus = async () => {
    if (!currentUser) return;
    const newStatus = !isWorking;
    setIsWorking(newStatus);
    
    const supabase = createClient();
    const statusStr = newStatus ? 'available' : 'off_duty';
    await supabase.from('riders').update({ status: statusStr }).eq('id', currentUser.id);

    if (newStatus) {
      toast.success("🟢 You are now Online and ready for live dispatches!");
    } else {
      toast.warning("🔴 Work Stopped for Now. You will not be assigned new deliveries.");
    }
  };

  // Generate Daily Earnings Receipt & Token ID
  const handleGenerateReceipt = async () => {
    if (!currentUser) {
      toast.error("User not identified");
      return;
    }

    setIsGeneratingReceipt(true);
    // Generate unique 6-character token ID e.g. RDR-8A4K29
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTokenId = `RDR-${randomChars}`;

    const res = await saveRiderReceiptAction(currentUser.id, newTokenId, todayCompleted.length, calculatedEarnings);
    setIsGeneratingReceipt(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.success) {
      setGeneratedTokenId(newTokenId);
      // Update local profile state so UI instantly shows 0 earnings
      setRiderProfile((prev: any) => ({ ...prev, active_token_id: newTokenId }));
      setIsReceiptModalOpen(true);
      toast.success("🧾 Daily Earnings Receipt generated successfully!");
    }
  };

  const copyToClipboard = () => {
    if (generatedTokenId) {
      navigator.clipboard.writeText(generatedTokenId);
      setCopiedToken(true);
      toast.success("Token ID copied to clipboard!");
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24 font-sans antialiased selection:bg-emerald-500 selection:text-slate-900">
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{riderProfile?.warehouses?.name || 'Mookyrdup Hub'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={handleToggleWorkStatus}
            className={`rounded-full px-4 py-1.5 h-9 border text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              isWorking 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            {isWorking ? (
              <><PauseCircle className="w-4 h-4 mr-1.5 text-emerald-400" /> Online</>
            ) : (
              <><PlayCircle className="w-4 h-4 mr-1.5 text-amber-400" /> Stop Work</>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Stop Work Notice Banner */}
        {!isWorking && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-300 text-xs font-bold flex items-center gap-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 animate-bounce" />
            <div>
              <p className="text-white font-extrabold mb-0.5">Work Stopped for Now (Emergency / Break)</p>
              <p className="text-slate-400 font-medium">You will not be assigned new deliveries. Click "Stop Work" above to resume.</p>
            </div>
          </div>
        )}

        {/* Rider Stats / Earnings Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-6 shadow-xl shadow-emerald-900/40 border border-emerald-500/30 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 font-bold px-2.5 py-0.5 text-[10px] rounded-full uppercase tracking-widest shadow-sm">
                  Yesterday's Work (Valid till 7:30 AM)
                </Badge>
              </div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mt-1">Pending Unverified Earnings</p>
              <h2 className="text-4xl font-black text-white mt-0.5">₹{calculatedEarnings}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20 relative z-10">
            <div>
              <p className="text-emerald-100 text-xs font-medium">Completed Deliveries</p>
              <p className="text-2xl font-black text-white mt-0.5">{effectiveCompletedCount} Orders</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs font-medium">Active Dispatch</p>
              <p className="text-2xl font-black text-white mt-0.5">{orders.length} Pending</p>
            </div>
          </div>

          {/* Generate Daily Receipt Button / Status */}
          <div className="pt-6 mt-2 border-t border-white/20 relative z-10 space-y-2">
            {hasGeneratedReceipt ? (
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2 shadow-inner">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Receipt Generated Successfully
                </div>
                <div className="font-mono text-lg font-black text-white tracking-widest bg-slate-950 py-2 rounded-xl border border-slate-800">
                  {generatedTokenId}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Provide this Token ID to the warehouse admin. Your earnings will refresh to ₹0 until the next shift starts.
                </p>
                <Button 
                  onClick={() => setIsReceiptModalOpen(true)}
                  variant="ghost" 
                  size="sm" 
                  className="text-xs font-bold text-emerald-300 hover:text-white hover:bg-slate-800"
                >
                  View Receipt Details
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleGenerateReceipt}
                  disabled={isGeneratingReceipt || effectiveCompletedCount === 0}
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-xl shadow-slate-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  {isGeneratingReceipt ? "GENERATING RECEIPT..." : "GENERATE DAILY EARNINGS RECEIPT"}
                </Button>
                {effectiveCompletedCount === 0 && (
                  <p className="text-[10px] text-emerald-200 text-center mt-2 italic font-medium">
                    * Complete at least 1 delivery today to generate an earnings receipt.
                  </p>
                )}
              </>
            )}
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
            <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium leading-relaxed">Waiting for {riderProfile?.warehouses?.name || 'Mookyrdup Hub'} to pack and assign new orders. Take a breather!</p>
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
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-50/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Call</span>
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

        {/* Daily Earnings Receipt Modal */}
        {isReceiptModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden animate-scaleUp">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-white text-lg tracking-tight">Daily Earnings Receipt</h3>
                </div>
                <Badge className="bg-emerald-500 text-slate-900 font-extrabold px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md border-none shadow-sm">
                  Generated
                </Badge>
              </div>

              <div className="space-y-4 text-sm font-medium">
                <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-3">
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Rider Name</span>
                    <span className="text-white font-bold">{riderProfile?.name || 'Delivery Rider'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Contact Phone</span>
                    <span className="text-white font-bold">{riderProfile?.phone || '+91 8974319494'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs border-t border-slate-700 pt-2">
                    <span>Deliveries Today</span>
                    <span className="text-emerald-400 font-black">{todayCompleted.length} Orders</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Total Pending Earnings</span>
                    <span className="text-emerald-400 font-black text-base">₹{(todayCompleted.length * 40).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block text-center">Receipt Token ID</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-700 shadow-inner">
                    <Input 
                      readOnly 
                      value={generatedTokenId || ''} 
                      className="bg-transparent border-none text-center font-mono font-black text-xl text-emerald-400 tracking-widest h-12 focus-visible:ring-0" 
                    />
                    <Button 
                      type="button" 
                      onClick={copyToClipboard} 
                      variant="ghost" 
                      className="h-12 w-12 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                    >
                      {copiedToken ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed pt-1">
                    Provide this Token ID to the Superadmin / Owner at the warehouse hub. They will verify it on the admin dashboard to record your earnings.
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                DONE / CLOSE RECEIPT
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
