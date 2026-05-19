import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RiderClient } from './rider-client';

import { Clock } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RiderPortalPage() {
  // Check daily refresh window (7:30 AM - 7:50 AM)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isRefreshWindow = currentHour === 7 && currentMinute >= 30 && currentMinute < 50;

  if (isRefreshWindow) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center selection:bg-emerald-500 selection:text-slate-900 font-sans">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center text-amber-400 mb-6 shadow-lg animate-pulse">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">System Refresh in Progress</h1>
        <span className="bg-amber-500 text-slate-950 font-extrabold uppercase tracking-widest px-3 py-1 text-[10px] mb-6 rounded-full">
          7:30 AM – 7:50 AM Daily Maintenance
        </span>
        <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed mb-8">
          We are currently auditing yesterday's delivery receipts and resetting active logs for the new shift. Please check back at 7:50 AM to access your portal.
        </p>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-xs w-full text-xs text-slate-500 font-mono mx-auto">
          System Time: {format(now, "hh:mm a")}
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  let riderWarehouseId: string | null = null;
  let riderProfile: any = null;

  if (user) {
    const { data: rider } = await adminClient
      .from('riders')
      .select('*')
      .eq('id', user.id)
      .single();
    if (rider) {
      // Fetch associated warehouse name dynamically to bypass lack of foreign key constraint
      const { data: whData } = await adminClient
        .from('warehouses')
        .select('name')
        .eq('id', rider.warehouse_id)
        .single();

      riderProfile = {
        ...rider,
        warehouses: whData ? { name: whData.name } : null
      };
      riderWarehouseId = rider.warehouse_id;
    }
  }

  // Fetch orders that are packed or out_for_delivery for this rider's warehouse
  let ordersQuery = adminClient
    .from('orders')
    .select('*')
    .in('status', ['packed', 'out_for_delivery'])
    .order('created_at', { ascending: false });

  if (riderWarehouseId) {
    ordersQuery = ordersQuery.eq('warehouse_id', riderWarehouseId);
  }

  const { data: orders } = await ordersQuery;

  // Calculate active window start time
  // "instead of Daily Window, we say like you can generate a receipt for yesterday's work till 7:30AM tomorrow, because by 8 AM - we will refresh the riders earnings and it will be zero again"
  let activeWindowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 50, 0);
  if (now.getTime() < activeWindowStart.getTime()) {
    // If it's before 7:50 AM today, the active window started at 7:50 AM yesterday
    activeWindowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 7, 50, 0);
  }

  // Fetch completed orders today for rider earnings/stats within the active window
  let completedQuery = adminClient
    .from('orders')
    .select('id, total, created_at')
    .eq('status', 'delivered')
    .gte('created_at', activeWindowStart.toISOString());

  if (riderWarehouseId) {
    completedQuery = completedQuery.eq('warehouse_id', riderWarehouseId);
  }

  const { data: completedOrders } = await completedQuery;

  const safeOrders = orders || [];
  const safeCompleted = completedOrders || [];

  // If rider has already generated a receipt for this window, effective completed count is 0
  const hasGeneratedReceipt = !!riderProfile?.active_token_id;
  const effectiveCompletedCount = hasGeneratedReceipt ? 0 : safeCompleted.length;
  const totalEarnings = effectiveCompletedCount * 40; // ₹40 per delivery commission

  return (
    <RiderClient 
      initialOrders={safeOrders} 
      initialCompleted={safeCompleted} 
      totalEarnings={totalEarnings} 
      initialRiderProfile={riderProfile}
    />
  );
}
