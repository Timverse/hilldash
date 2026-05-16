import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminSidebar } from "@/components/admin/sidebar"
import { redirect } from "next/navigation"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Use adminClient to bypass RLS and guarantee we get the user's true role from the database
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const allowedAdminRoles = ['owner', 'superadmin', 'warehouse_admin', 'admin']
  const userRole = profile?.role || 'customer'

  if (!allowedAdminRoles.includes(userRole)) {
    // If the user is a customer or unauthorized, instantly redirect them to the storefront!
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans antialiased">
      {/* Dynamic Role-Based Sidebar */}
      <AdminSidebar role={userRole} />

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
              Role: {userRole}
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
