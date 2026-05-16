import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = 'superadmin' // default fallback
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      role = profile.role
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans antialiased">
      {/* Dynamic Role-Based Sidebar */}
      <AdminSidebar role={role} />

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm shrink-0">
          <span className="text-slate-500 font-bold text-sm tracking-tight">
            HillDash Admin Console
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 uppercase tracking-wider">
              Role: {role}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-8 flex-1">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
