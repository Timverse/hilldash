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
    return { error: 'Please fill in all required fields including User ID' };
  }

  // 1. Insert or update the riders table with id = user_id
  const { data, error } = await adminClient
    .from('riders')
    .upsert({
      id: user_id.trim(),
      name: name.trim(),
      phone: phone.trim(),
      warehouse_id,
      status: status || 'available'
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Failed to upsert rider:', error);
    return { error: `Database error: ${error.message}. Please verify the User ID is a valid registered account UUID.` };
  }

  // 2. Automatically update the profiles table role to 'rider'
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ role: 'rider', is_active: true, updated_at: new Date().toISOString() })
    .eq('id', user_id.trim());

  if (profileError) {
    console.error('Failed to update profile role to rider:', profileError);
  } else {
    console.log(`Successfully updated profile ${user_id} to role rider.`);
  }

  revalidatePath('/dashboard/riders', 'page');
  return { success: true };
}
