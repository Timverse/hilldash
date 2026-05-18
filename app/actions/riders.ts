'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function addRiderAction(formData: FormData) {
  const adminClient = createAdminClient();

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const warehouse_id = formData.get('warehouse_id') as string;
  const status = formData.get('status') as string;

  if (!name || !phone || !warehouse_id) {
    return { error: 'Please fill in all required fields' };
  }

  const { data, error } = await adminClient
    .from('riders')
    .insert({
      name,
      phone,
      warehouse_id,
      status: status || 'available'
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/riders');
  return { success: true };
}
