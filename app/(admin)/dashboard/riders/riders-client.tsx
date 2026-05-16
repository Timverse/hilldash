"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Bike, MapPin, Phone, UserCheck, Clock, Plus } from 'lucide-react';
import { AddRiderDialog } from '@/components/admin/add-rider-dialog';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  available:   { label: 'Available',   badge: 'bg-emerald-100 text-emerald-700' },
  on_delivery: { label: 'On Delivery', badge: 'bg-amber-100 text-amber-700' },
  offline:     { label: 'Offline',     badge: 'bg-slate-100 text-slate-700' },
};

export function RidersClient({ 
  initialRiders = [], warehouses = [] 
}: { 
  initialRiders: any[]; warehouses: any[] 
}) {
  const router = useRouter();
  const safeRiders = initialRiders || [];
  const safeWarehouses = warehouses || [];

  // SUPABASE REALTIME SUBSCRIPTION FOR LIVE RIDERS FLEET
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-riders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, (payload) => {
        console.log('Realtime rider update received:', payload);
        router.refresh();
        if (payload.eventType === 'INSERT') {
          toast.success('🏍️ New Rider Added! Delivery fleet updated.');
        } else if (payload.eventType === 'UPDATE') {
          toast.info('🔄 Rider dispatch status updated in real time.');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const availableCount = safeRiders.filter(r => r.status === 'available').length;
  const busyCount = safeRiders.filter(r => r.status === 'on_delivery').length;
  const offlineCount = safeRiders.filter(r => r.status === 'offline').length;

  return (
    <div className="space-y-8 font-sans antialiased">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Delivery Riders</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage Jowai Central Hub delivery personnel and live dispatch status.</p>
        </div>
        <AddRiderDialog warehouses={safeWarehouses} />
      </div>

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
            <div className="text-3xl font-black text-slate-900">{safeRiders.length}</div>
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
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Offline</CardTitle>
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
          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Active Personnel</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {safeRiders.length === 0 ? (
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
                  <TableHead className="text-center pr-8 font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRiders.map((rider) => {
                  const statusInfo = STATUS_MAP[rider.status] || STATUS_MAP.offline;

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
                      <TableCell className="py-4 text-center pr-8">
                        <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 shadow-sm active:scale-95 transition-all">
                          Assign Order
                        </Button>
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
