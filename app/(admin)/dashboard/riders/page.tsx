import { createClient } from '@/lib/supabase/server';
import { RidersClient } from './riders-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminRidersPage() {
  const supabase = await createClient();

  // Fetch riders with warehouse info
  const { data: riders } = await supabase
    .from('riders')
    .select('*, warehouses(name)')
    .order('name');

  // Fetch active warehouses for the Add Rider dropdown
  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return (
    <RidersClient 
      initialRiders={riders || []} 
      warehouses={warehouses || []} 
    />
  );
}
