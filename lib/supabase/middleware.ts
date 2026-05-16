// lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  // 1. If environment variables are missing on Vercel Edge, return early without crashing
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables missing in Edge Middleware runtime')
    return { supabase: null, response: supabaseResponse, user: null }
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) { 
            return request.cookies.get(name)?.value 
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // 2. Refresh session inside try-catch to prevent Edge runtime crashes
    const { data: { user } } = await supabase.auth.getUser()

    return { supabase, response: supabaseResponse, user }
  } catch (error) {
    console.error('Supabase middleware getUser error:', error)
    return { supabase: null, response: supabaseResponse, user: null }
  }
}