import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Bike, MapPin, Phone, UserCheck, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { AddRiderDialog } from '@/components/admin/add-rider-dialog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  available:   { label: 'Available',   badge: 'bg-emerald-100 text-emerald-700' },
  on_delivery: { label: 'On Delivery', badge: 'bg-amber-100 text-amber-700' },
  offline:     { label: 'Offline',     badge: 'bg-slate-100 text-slate-700' },
};

export default async function AdminRidersPage() {
  const supabase = await createClient();

  // Fetch riders with warehouse info
  const { data: riders, error } = await supabase
    .from('riders')
    .select('*, warehouses(name)')
    .order('name');

  // Fetch active warehouses for the Add Rider dropdown
  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  const safeRiders = riders || [];
  const safeWarehouses = warehouses || [];

  const availableCount = safeRiders.filter(r => r.status === 'available').length;
  const busyCount = safeRiders.filter(r => r.status === 'on_delivery').length;
  const offlineCount = safeRiders.filter(r => r.status === 'offline').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Delivery Riders</h1>
          <p className="text-slate-500">Manage Jowai Central Hub delivery personnel and live dispatch status.</p>
        </div>
        <AddRiderDialog warehouses={safeWarehouses} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Total Fleet</CardTitle>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
              <Bike className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{safeRiders.length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Available</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{availableCount}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">On Delivery</CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{busyCount}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Offline</CardTitle>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{offlineCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Riders Table */}
      <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <CardTitle className="text-lg font-bold text-slate-900">Active Personnel</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {safeRiders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Bike className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-lg text-slate-700 mb-1">No riders found</p>
              <p className="text-sm text-slate-400">Run the FIX-RIDERS-SETUP.sql script to populate delivery personnel.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6">Rider Name</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>Assigned Hub</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRiders.map((rider) => {
                  const statusInfo = STATUS_MAP[rider.status] || STATUS_MAP.offline;

                  return (
                    <TableRow key={rider.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-6 font-bold text-slate-900">
                        {rider.name}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {rider.id.slice(0, 8).toUpperCase()}</div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {rider.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {rider.warehouses?.name || 'Jowai Central Hub'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        <Button variant="outline" size="sm" className="h-7 text-xs font-bold border-slate-200 hover:bg-slate-50">
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
