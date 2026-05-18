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
      .select('*, warehouses(name)')
      .eq('id', user.id)
      .single();
    if (rider) {
      riderProfile = rider;
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

  // Fetch completed orders today for rider earnings/stats
  let completedQuery = adminClient
    .from('orders')
    .select('id, total')
    .eq('status', 'delivered');

  if (riderWarehouseId) {
    completedQuery = completedQuery.eq('warehouse_id', riderWarehouseId);
  }

  const { data: completedOrders } = await completedQuery;

  const safeOrders = orders || [];
  const safeCompleted = completedOrders || [];

  const totalEarnings = safeCompleted.length * 40; // ₹40 per delivery commission

  return (
    <RiderClient 
      initialOrders={safeOrders} 
      initialCompleted={safeCompleted} 
      totalEarnings={totalEarnings} 
    />
  );
}
