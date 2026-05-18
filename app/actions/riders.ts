'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function addRiderAction(formData: FormData) {
  const adminClient = createAdminClient();

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const user_id = formData.get('user_id') as string;
  const warehouse_id = formData.get('warehouse_id') as string;
  const status = formData.get('status') as string;

  if (!name || !phone || !user_id || !warehouse_id) {
    return { error: 'Please fill in all required fields including User ID and Warehouse Hub.' };
  }

  const cleanUserId = user_id.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(cleanUserId)) {
    return { error: 'Invalid User ID format. Please enter a valid 36-character UUID (e.g. 123e4567-e89b-12d3-a456-426614174000).' };
  }

  // 1. Ensure profile exists first to prevent foreign key violation on riders table
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: cleanUserId,
      full_name: name.trim(),
      phone: phone.trim(),
      role: 'rider',
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Failed to upsert profile for rider:', profileError);
    return { error: `Profile creation error: ${profileError.message}. Please verify database permissions.` };
  }

  // 2. Insert or update the riders table with id = user_id
  const { data, error } = await adminClient
    .from('riders')
    .upsert({
      id: cleanUserId,
      name: name.trim(),
      phone: phone.trim(),
      warehouse_id,
      status: status || 'available'
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Failed to upsert rider:', error);
    return { error: `Database error on riders table: ${error.message}.` };
  }

  revalidatePath('/dashboard/riders', 'page');
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}
