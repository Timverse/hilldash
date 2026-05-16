import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch Global Settings
  const { data: settings } = await supabase
    .from('global_settings')
    .select('*')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-slate-500">Configure global platform configurations like site logo and branding.</p>
      </div>

      <SettingsForm initialSettings={settings || []} />
    </div>
  )
}
