'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=' + encodeURIComponent(error.message))
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

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      }
    }
  })

  if (error) {
    redirect('/login?tab=signup&message=' + encodeURIComponent(error.message))
  }

  // Ensure profile exists with customer role
  if (authData?.user) {
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name: fullName,
      phone: phone,
      role: 'customer',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  revalidatePath('/', 'layout')
  redirect('/?signup=success')
}

export async function verifyOtpLogin(formData: FormData) {
  const supabase = await createClient()
  const phone = formData.get('phone') as string
  const otp = formData.get('otp') as string

  if (otp !== '1234') {
    redirect('/login?tab=otp&message=' + encodeURIComponent('Invalid OTP. Please enter 1234 for verification.'))
  }

  // 1. Try native Supabase OTP verification if configured
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms',
  })

  // 2. If native SMS is not configured in Supabase, simulate successful OTP authentication by creating/finding the profile
  if (error) {
    console.log('Native OTP not configured, using simulated OTP authentication fallback for phone:', phone)
    
    const { data: existingProfiles } = await supabase.from('profiles').select('*').eq('phone', phone)
    let profile = existingProfiles?.[0]

    if (!profile) {
      const dummyEmail = `otp_${phone.replace(/[^0-9]/g, '')}@hilldash.com`
      const { data: newAuth } = await supabase.auth.signUp({
        email: dummyEmail,
        password: `OtpPass_${Date.now()}`,
      })

      if (newAuth?.user) {
        await supabase.from('profiles').upsert({
          id: newAuth.user.id,
          full_name: `Customer (${phone})`,
          phone: phone,
          role: 'customer',
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/?login=otp_success')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
