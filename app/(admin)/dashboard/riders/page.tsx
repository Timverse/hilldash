import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RidersClient } from './riders-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AdminRidersPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  let assignedWarehouseId: string | null = null;
  let userRole = 'admin';

  if (user) {
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
    userRole = profile?.role || 'admin';

    // Superadmins and warehouse_admins can only view their assigned hub riders info
    if (userRole === 'superadmin' || userRole === 'warehouse_admin') {
      const { data: assignment } = await adminClient
        .from('user_warehouse_assignments')
        .select('warehouse_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      if (assignment) {
        assignedWarehouseId = assignment.warehouse_id;
      }
    }
  }

  // Fetch active warehouses for the Add Rider dropdown and Hub filter
  const { data: warehouses } = await adminClient
    .from('warehouses')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  // Fetch riders using adminClient
  // Owner sees all hubs; Superadmins see only assigned hub
  let query = adminClient.from('riders').select('*').order('name');
  if (assignedWarehouseId) {
    query = query.eq('warehouse_id', assignedWarehouseId);
  }

  const { data: ridersData } = await query;

  // Map warehouses to riders defensively in memory
  const riders = (ridersData || []).map(rider => ({
    ...rider,
    warehouses: warehouses?.find(w => w.id === rider.warehouse_id) || null
  }));

  return (
    <RidersClient 
      initialRiders={riders} 
      warehouses={warehouses || []} 
      userRole={userRole}
      assignedWarehouseId={assignedWarehouseId}
    />
  );
}
