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

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
