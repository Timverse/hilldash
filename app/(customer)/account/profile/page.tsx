import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, User, Mail, Phone, Shield, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  let { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Sawaïom Member'
    const phone = user.user_metadata?.phone || null
    
    const { data: newProfile } = await adminClient.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      phone: phone,
      role: 'customer',
      is_active: true,
      points: 100, // 100 Welcome Points
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' }).select().single()
    
    profile = newProfile
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 font-sans antialiased">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-12">
          <Link href="/account" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group mb-6">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Account
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            Profile & <span className="text-primary italic">Settings</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium mt-3">Manage your personal details and account preferences.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm space-y-8">
          <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shrink-0">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{profile?.full_name || 'Sawaïom Member'}</h2>
              <p className="text-slate-500 text-sm font-medium">{user.email}</p>
              <div className="mt-2 flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full w-fit border border-purple-200 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {profile?.points || 0} Sawaïom Points
              </div>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" /> Full Name
                </label>
                <Input defaultValue={profile?.full_name || ''} placeholder="John Doe" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary px-6 text-lg font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                </label>
                <Input defaultValue={profile?.phone || ''} placeholder="8974319494" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary px-6 text-lg font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" /> Email Address (Read Only)
              </label>
              <Input defaultValue={user.email} disabled className="h-14 rounded-2xl bg-slate-100 border-none text-slate-50 px-6 text-lg font-medium cursor-not-allowed" />
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Account Secured</h4>
                <p className="text-slate-500 text-xs font-medium mt-0.5">Your privacy and logistics data are protected with enterprise-grade encryption.</p>
              </div>
            </div>

            <Button type="button" className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
