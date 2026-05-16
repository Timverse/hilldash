// /middleware.ts (ROOT)
import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // 1. Refresh the session and get the user
    const { supabase, response, user } = await updateSession(request)

    // 2. Protect Admin Routes
    if (request.nextUrl.pathname === '/admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check role - allow owner, superadmin, and warehouse_admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        console.log('User role check:', { userId: user.id, role: profile?.role })

        // Allow access for admin roles
        const allowedRoles = ['owner', 'superadmin', 'warehouse_admin']
        if (!profile || !allowedRoles.includes(profile.role)) {
            console.log('Access denied, redirecting to home')
            return NextResponse.redirect(new URL('/', request.url))
        }

        console.log('Access granted to dashboard')
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}