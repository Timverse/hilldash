import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && authData?.user) {
      const adminClient = createAdminClient()
      const user = authData.user
      
      // Ensure profile exists in public.profiles table
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id, points')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Sawaïom Member'
        const phone = user.user_metadata?.phone || null
        
        await adminClient.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          phone: phone,
          role: 'customer',
          is_active: true,
          points: 100, // 100 Welcome Points!
          updated_at: new Date().toISOString(),
        })
        console.log(`Created new profile for OAuth user ${user.id} with 100 welcome points`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    } else if (error) {
      console.error('OAuth exchangeCodeForSession error:', error)
      return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(error.message)}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent('Could not authenticate with OAuth provider')}`)
}
