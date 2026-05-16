'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?tab=signin&message=' + encodeURIComponent(error.message))
  }

  // Check user role
  if (authData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    revalidatePath('/', 'layout')

    const allowedAdminRoles = ['owner', 'superadmin', 'warehouse_admin']
    if (profile && allowedAdminRoles.includes(profile.role)) {
      redirect('/dashboard')
    } else {
      redirect('/') // Redirect customers to storefront
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithOAuthAction(provider: 'google' | 'apple') {
  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message))
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function verifyOtpLogin(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const phone = formData.get('phone') as string
  const otp = formData.get('otp') as string

  if (otp !== '1234') {
    redirect('/login?tab=otp&phone=' + encodeURIComponent(phone) + '&message=' + encodeURIComponent('Invalid OTP. Please enter 1234 for verification.'))
  }

  const cleanPhoneNum = phone.replace(/[^0-9]/g, '')
  const dummyEmail = `otp_${cleanPhoneNum}@hilldash.com`
  const dummyPass = `OtpPass_${cleanPhoneNum}`

  // 1. Try native Supabase OTP verification if configured
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms',
  })

  // 2. Check if profile exists
  const { data: existingProfiles } = await adminClient.from('profiles').select('*').eq('phone', phone)
  let profile = existingProfiles?.[0]

  if (!profile) {
    // NEW USER! Redirect to Name Capture onboarding screen
    redirect('/login?tab=onboarding&phone=' + encodeURIComponent(phone))
  }

  // EXISTING USER! If native SMS failed (simulation mode), ensure auth session exists
  if (error && profile) {
    console.log('Simulation mode: logging in existing user for phone:', phone)
    await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: dummyPass,
    })
  }

  revalidatePath('/', 'layout')
  redirect('/?login=otp_success')
}

export async function completePhoneOnboarding(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const phone = formData.get('phone') as string
  const fullName = formData.get('full_name') as string

  if (!phone || !fullName) {
    redirect('/login?tab=onboarding&phone=' + encodeURIComponent(phone) + '&message=' + encodeURIComponent('Full Name is required.'))
  }

  const cleanPhoneNum = phone.replace(/[^0-9]/g, '')
  const dummyEmail = `otp_${cleanPhoneNum}@hilldash.com`
  const dummyPass = `OtpPass_${cleanPhoneNum}`

  // 1. Create auth user
  const { data: newAuth, error: signUpError } = await supabase.auth.signUp({
    email: dummyEmail,
    password: dummyPass,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      }
    }
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      await supabase.auth.signInWithPassword({ email: dummyEmail, password: dummyPass })
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await adminClient.from('profiles').upsert({
          id: user.id,
          email: dummyEmail,
          full_name: fullName,
          phone: phone,
          role: 'customer',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }
    } else {
      redirect('/login?tab=onboarding&phone=' + encodeURIComponent(phone) + '&message=' + encodeURIComponent(signUpError.message))
    }
  }

  if (newAuth?.user) {
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: newAuth.user.id,
      email: dummyEmail,
      full_name: fullName,
      phone: phone,
      role: 'customer',
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile creation error on onboarding:', profileError)
      redirect('/login?tab=onboarding&phone=' + encodeURIComponent(phone) + '&message=' + encodeURIComponent('Failed to create profile: ' + profileError.message))
    }
  }

  revalidatePath('/', 'layout')
  redirect('/?signup=success')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
