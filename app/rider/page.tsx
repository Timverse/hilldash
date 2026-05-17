import { createClient } from '@/lib/supabase/server';
import { RiderClient } from './rider-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RiderPortalPage() {
  const supabase = await createClient();

  // Fetch orders that are packed or out_for_delivery
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['packed', 'out_for_delivery'])
    .order('created_at', { ascending: false });

  // Fetch completed orders today for rider earnings/stats
  const { data: completedOrders } = await supabase
    .from('orders')
    .select('id, total')
    .eq('status', 'delivered');

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
