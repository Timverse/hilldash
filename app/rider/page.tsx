import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RiderClient } from './rider-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RiderPortalPage() {
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
  const now = new Date();
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
