"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Bike, MapPin, Phone, UserCheck, Clock, Plus, Key, CheckCircle2, AlertCircle, Search, DollarSign } from 'lucide-react';
import { AddRiderDialog } from '@/components/admin/add-rider-dialog';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { verifyRiderReceiptAction } from '@/app/actions/rider-receipt';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  available:   { label: 'Available',   badge: 'bg-emerald-100 text-emerald-700' },
  on_delivery: { label: 'On Delivery', badge: 'bg-amber-100 text-amber-700' },
  offline:     { label: 'Offline',     badge: 'bg-slate-100 text-slate-700' },
  off_duty:    { label: 'Stop Work',   badge: 'bg-red-100 text-red-700' },
};

export function RidersClient({ 
  initialRiders = [], warehouses = [] 
}: { 
  initialRiders: any[]; warehouses: any[] 
}) {
  const router = useRouter();
  const [liveRiders, setLiveRiders] = useState(initialRiders || []);
  const safeWarehouses = warehouses || [];

  // Receipt Verification State
  const [verificationToken, setVerificationToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync state if initial props change via server revalidation
  useEffect(() => {
    setLiveRiders(initialRiders || []);
  }, [initialRiders]);

  // SUPABASE REALTIME SUBSCRIPTION FOR LIVE RIDERS FLEET (INSTANT CLIENT STATE SYNC)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-riders-admin-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, (payload) => {
        console.log('Realtime rider update received:', payload);

        if (payload.eventType === 'INSERT') {
          const newRider = payload.new;
          setLiveRiders(prev => [newRider, ...prev]);
          toast.success('🏍️ New Rider Added! Delivery fleet updated.');
        } else if (payload.eventType === 'UPDATE') {
          const updatedRider = payload.new;
          setLiveRiders(prev => prev.map(r => r.id === updatedRider.id ? updatedRider : r));
        } else if (payload.eventType === 'DELETE') {
          setLiveRiders(prev => prev.filter(r => r.id !== payload.old?.id));
        }

        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleVerifyReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationToken.trim()) {
      toast.error("Please enter a Token ID");
      return;
    }

    setIsVerifying(true);
    const res = await verifyRiderReceiptAction(verificationToken);
    setIsVerifying(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.success) {
      toast.success(`🎉 Verified Token ${verificationToken.toUpperCase()}! ₹${res.earningsInserted?.toFixed(2)} inserted into rider ${res.riderName}'s daily earnings.`);
      setVerificationToken("");
    }
  };

  const availableCount = liveRiders.filter(r => r.status === 'available').length;
  const busyCount = liveRiders.filter(r => r.status === 'on_delivery').length;
  const offlineCount = liveRiders.filter(r => r.status === 'offline' || r.status === 'off_duty').length;

  return (
    <div className="space-y-8 font-sans antialiased selection:bg-primary selection:text-white">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Delivery Riders</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage Jowai Central Hub delivery personnel, live dispatch status, and daily earnings verification.</p>
        </div>
        <AddRiderDialog warehouses={safeWarehouses} />
      </div>

      {/* VERIFY RIDER DAILY RECEIPT SECTION */}
      <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-r from-primary/5 via-white to-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="border-b border-slate-100 bg-white/50 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold shadow-inner shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Verify Rider Daily Receipt & Insert Earnings</CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Superadmins/Owners: Type in the Token ID generated on the rider's dashboard to verify and insert their daily earnings.
              </p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-none font-extrabold uppercase tracking-widest px-3 py-1 text-xs rounded-full shadow-sm">
            Daily Audit System
          </Badge>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleVerifyReceiptSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                required 
                value={verificationToken}
                onChange={e => setVerificationToken(e.target.value)}
                placeholder="Enter 6-digit Rider Token ID (e.g. RDR-8A4K29)" 
                className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary font-mono font-bold text-base uppercase tracking-wider shadow-inner"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isVerifying || !verificationToken.trim()}
              className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 shrink-0"
            >
              {isVerifying ? "VERIFYING..." : <><CheckCircle2 className="w-5 h-5" /> VERIFY RECEIPT</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Fleet</CardTitle>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 shadow-inner">
              <Bike className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{liveRiders.length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Available</CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{availableCount}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">On Delivery</CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{busyCount}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Offline / Stop Work</CardTitle>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{offlineCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Riders Table */}
      <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white overflow-hidden rounded-[2rem]">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Active Personnel & Verified Earnings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {liveRiders.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                <Bike className="w-10 h-10" />
              </div>
              <p className="font-black text-xl text-slate-900 mb-2 tracking-tight">No riders found</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                Use the "Add Rider" button above or execute the STAFF-ROLE-MANAGEMENT.md SQL script to assign delivery personnel.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="pl-8 font-bold text-slate-700">Rider Name</TableHead>
                  <TableHead className="font-bold text-slate-700">Contact Phone</TableHead>
                  <TableHead className="font-bold text-slate-700">Assigned Hub</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Today's Verified Earnings</TableHead>
                  <TableHead className="text-center pr-8 font-bold text-slate-700">Last Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveRiders.map((rider) => {
                  const statusInfo = STATUS_MAP[rider.status] || STATUS_MAP.offline;
                  const verifiedEarnings = rider.daily_earnings || 0;

                  return (
                    <TableRow key={rider.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="pl-8 py-4 font-bold text-slate-900">
                        {rider.name}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-semibold">ID: {rider.id.slice(0, 8).toUpperCase()}</div>
                      </TableCell>
                      <TableCell className="py-4 font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" /> {rider.phone}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" /> {rider.warehouses?.name || 'Jowai Central Hub'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right font-black text-emerald-600 text-base">
                        ₹{verifiedEarnings.toFixed(2)}
                        {rider.pending_earnings > 0 && (
                          <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">
                            Pending: ₹{rider.pending_earnings.toFixed(2)} ({rider.active_token_id})
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-center pr-8 text-xs font-medium text-slate-500">
                        {rider.last_payout_date ? format(new Date(rider.last_payout_date), "dd MMM, hh:mm a") : "No payout yet"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
