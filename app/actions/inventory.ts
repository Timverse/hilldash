'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProductAction(formData: FormData) {
  const supabase = await createClient()

  // Log all incoming data
  console.log('=== createProductAction called ===')
  console.log('name:', formData.get('name'))
  console.log('category_id:', formData.get('category_id'))
  console.log('price:', formData.get('price'))
  console.log('stock:', formData.get('stock'))
  console.log('is_active:', formData.get('is_active'))
  console.log('batch_number:', formData.get('batch_number'))
  console.log('expiry_date:', formData.get('expiry_date'))

  // Dynamically fetch the first available warehouse
  const { data: warehouses, error: warehouseError } = await supabase
    .from('warehouses')
    .select('id')
    .eq('is_active', true)
    .limit(1)

  console.log('Warehouse fetch result:', { warehouses, warehouseError })

  if (!warehouses || warehouses.length === 0) {
    return { error: `No active warehouse found. Please create a Hub first. (DB error: ${warehouseError?.message || 'No warehouses in database'})` }
  }
  const warehouseId = warehouses[0].id

  // Extract Data
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category_id = formData.get('category_id') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string, 10)
  const is_active = formData.get('is_active') === 'on'
  const batch_number = formData.get('batch_number') as string || null
  const expiry_date = formData.get('expiry_date') as string || null
  const imageFile = formData.get('image') as File | null

  let image_url = ''

  // Upload Image to Storage if exists
  if (imageFile && imageFile.size > 0) {
    console.log('Uploading image:', imageFile.name, imageFile.size)
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `public/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      console.log('Continuing without image due to upload error')
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      image_url = publicUrlData.publicUrl
      console.log('Image uploaded:', image_url)
    }
  }

  const insertPayload = {
    name,
    description: description || null,
    category_id: category_id || null,
    price,
    stock: isNaN(stock) ? 0 : stock,
    is_active,
    batch_number,
    expiry_date: expiry_date ? new Date(expiry_date).toISOString() : null,
    image_url,
    warehouse_id: warehouseId
  }

  console.log('Inserting product:', insertPayload)

  // Insert Product
  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(insertPayload)
    .select()
    .single()

  console.log('Insert result:', { inserted, insertError })

  if (insertError) {
    console.error('Insert error:', insertError)
    return { error: `DB error: ${insertError.message}` }
  }

  revalidatePath('/dashboard/products', 'page')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/', 'layout')
  return { success: true }
}


export async function editProductAction(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category_id = formData.get('category_id') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string, 10)
  const is_active = formData.get('is_active') === 'on'
  const batch_number = formData.get('batch_number') as string || null
  const expiry_date = formData.get('expiry_date') as string || null
  const imageFile = formData.get('image') as File | null

  const updateData: any = { 
    name, 
    description, 
    category_id, 
    price, 
    stock, 
    is_active,
    batch_number,
    expiry_date: expiry_date ? new Date(expiry_date).toISOString() : null
  }

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `public/${fileName}`

    const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile)
    if (!uploadError) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      updateData.image_url = data.publicUrl
    }
  }

  const { error } = await supabase.from('products').update(updateData).eq('id', id)
  if (error) return { error: 'Failed to update product' }

  revalidatePath('/dashboard/products', 'page')
  revalidatePath('/dashboard', 'page')
  return { success: true }
}

export async function toggleProductAvailability(productId: string, currentStatus: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_active: !currentStatus })
    .eq('id', productId)

  if (error) {
    return { error: 'Failed to update availability' }
  }

  revalidatePath('/dashboard/products', 'page')
  return { success: true }
}

export async function createCategoryAction(name: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .insert({ name })

  if (error) {
    return { error: 'Failed to create category' }
  }

  revalidatePath('/dashboard/categories')
  return { success: true }
}

export async function createWarehouseAction(data: {
  name: string, address: string, lat: number, lng: number, radius_km: number
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('warehouses')
    .insert(data)

  if (error) return { error: 'Failed to create warehouse' }

  revalidatePath('/dashboard/warehouses')
  return { success: true }
}

export async function toggleWarehouseAction(id: string, currentStatus: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('warehouses')
    .update({ is_active: !currentStatus })
    .eq('id', id)

  if (error) return { error: 'Failed to update warehouse' }

  revalidatePath('/dashboard/warehouses')
  return { success: true }
}
