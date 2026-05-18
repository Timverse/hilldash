'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettingsAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const logoFile = formData.get('logo') as File | null
  const emergencyEnabled = formData.get('emergency_delivery_enabled') as string
  const emergencyFee = formData.get('emergency_delivery_fee') as string

  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop()
    const fileName = `logo_${Math.random()}.${fileExt}`
    const filePath = `public/${fileName}`

    const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, logoFile)
    
    if (uploadError) {
      return { success: false, error: 'Failed to upload logo' }
    }

    const { data: publicUrlData } = supabase.storage.from('site-assets').getPublicUrl(filePath)
    const { error: upsertError } = await supabase.from('global_settings').upsert({ key: 'site_logo', value: publicUrlData.publicUrl }, { onConflict: 'key' })
    if (upsertError) {
      return { success: false, error: 'Failed to save logo URL to settings' }
    }
  }

  if (emergencyEnabled !== null) {
    await supabase.from('global_settings').upsert({ key: 'emergency_delivery_enabled', value: emergencyEnabled }, { onConflict: 'key' })
  }

  if (emergencyFee !== null && emergencyFee !== '') {
    await supabase.from('global_settings').upsert({ key: 'emergency_delivery_fee', value: emergencyFee }, { onConflict: 'key' })
  }

  revalidatePath('/', 'layout') // Revalidate everything to ensure settings updates propagate
  return { success: true }
}
