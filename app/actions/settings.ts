'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettingsAction(formData: FormData) {
  const supabase = await createClient()

  const logoFile = formData.get('logo') as File | null

  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop()
    const fileName = `logo_${Math.random()}.${fileExt}`
    const filePath = `public/${fileName}`

    // Upload to site-assets
    const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, logoFile)
    
    if (uploadError) {
      return { error: 'Failed to upload logo' }
    }

    const { data: publicUrlData } = supabase.storage.from('site-assets').getPublicUrl(filePath)
    
    // Upsert into global_settings
    const { error: upsertError } = await supabase
      .from('global_settings')
      .upsert({ key: 'site_logo', value: publicUrlData.publicUrl }, { onConflict: 'key' })

    if (upsertError) {
      return { error: 'Failed to save logo URL to settings' }
    }
  }

  revalidatePath('/', 'layout') // Revalidate everything to ensure logo updates
  return { success: true }
}
