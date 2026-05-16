/**
 * RBAC-Protected Product Actions
 * Demonstrates how to implement warehouse-scoped operations with role-based access control
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  getCurrentUserProfile,
  requireAnyRole,
  requireWarehouseAccess,
  applyWarehouseFilter,
  logAuditAction
} from '@/lib/auth/rbac'

/**
 * Get all products accessible to the current user
 * - Owner: sees all products from all warehouses
 * - Superadmin: sees only products from assigned warehouses
 */
export async function getAccessibleProducts() {
  try {
    const supabase = await createClient()
    
    // Require owner or superadmin role
    const profile = await requireAnyRole(['owner', 'superadmin'])

    // Start with base query
    let query = supabase
      .from('products')
      .select(`
        *,
        categories!products_category_id_fkey(name),
        warehouses!products_warehouse_id_fkey(name)
      `)
      .order('created_at', { ascending: false })

    // Apply warehouse filter based on user role
    query = await applyWarehouseFilter(query)

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return { error: 'Failed to fetch products' }
    }

    return { success: true, products }
  } catch (error: any) {
    console.error('Authorization error:', error)
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Create a new product
 * - Owner: can create products in any warehouse
 * - Superadmin: can only create products in assigned warehouses
 */
export async function createProductWithRBAC(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Require owner or superadmin role
    const profile = await requireAnyRole(['owner', 'superadmin'])

    // Extract data
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category_id = formData.get('category_id') as string
    const warehouse_id = formData.get('warehouse_id') as string
    const price = parseFloat(formData.get('price') as string)
    const stock = parseInt(formData.get('stock') as string, 10)
    const is_active = formData.get('is_active') === 'on'

    // Validate warehouse access
    await requireWarehouseAccess(warehouse_id)

    // Handle image upload (if provided)
    let image_url = ''
    const imageFile = formData.get('image') as File | null
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `public/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile)

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)
        image_url = publicUrlData.publicUrl
      }
    }

    // Insert product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        name,
        description: description || null,
        category_id: category_id || null,
        warehouse_id,
        price,
        stock: isNaN(stock) ? 0 : stock,
        is_active,
        image_url
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return { error: `Failed to create product: ${insertError.message}` }
    }

    // Log audit action
    await logAuditAction(
      'CREATE',
      'product',
      product.id,
      warehouse_id,
      { name, price, stock }
    )

    revalidatePath('/dashboard/products', 'page')
    return { success: true, product }
  } catch (error: any) {
    console.error('Authorization error:', error)
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Update an existing product
 * - Owner: can update products in any warehouse
 * - Superadmin: can only update products in assigned warehouses
 */
export async function updateProductWithRBAC(productId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Require owner or superadmin role
    const profile = await requireAnyRole(['owner', 'superadmin'])

    // First, get the product to check warehouse access
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('warehouse_id')
      .eq('id', productId)
      .single()

    if (fetchError || !existingProduct) {
      return { error: 'Product not found' }
    }

    // Validate warehouse access
    await requireWarehouseAccess(existingProduct.warehouse_id)

    // Extract data
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category_id = formData.get('category_id') as string
    const price = parseFloat(formData.get('price') as string)
    const stock = parseInt(formData.get('stock') as string, 10)
    const is_active = formData.get('is_active') === 'on'

    const updateData: any = {
      name,
      description,
      category_id,
      price,
      stock,
      is_active
    }

    // Handle image upload (if provided)
    const imageFile = formData.get('image') as File | null
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `public/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile)

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)
        updateData.image_url = publicUrlData.publicUrl
      }
    }

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)

    if (updateError) {
      return { error: 'Failed to update product' }
    }

    // Log audit action
    await logAuditAction(
      'UPDATE',
      'product',
      productId,
      existingProduct.warehouse_id,
      { name, price, stock }
    )

    revalidatePath('/dashboard/products', 'page')
    return { success: true }
  } catch (error: any) {
    console.error('Authorization error:', error)
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Delete a product
 * - Owner: can delete products from any warehouse
 * - Superadmin: can only delete products from assigned warehouses
 */
export async function deleteProductWithRBAC(productId: string) {
  try {
    const supabase = await createClient()
    
    // Require owner or superadmin role
    const profile = await requireAnyRole(['owner', 'superadmin'])

    // First, get the product to check warehouse access
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('warehouse_id, name')
      .eq('id', productId)
      .single()

    if (fetchError || !existingProduct) {
      return { error: 'Product not found' }
    }

    // Validate warehouse access
    await requireWarehouseAccess(existingProduct.warehouse_id)

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      return { error: 'Failed to delete product' }
    }

    // Log audit action
    await logAuditAction(
      'DELETE',
      'product',
      productId,
      existingProduct.warehouse_id,
      { name: existingProduct.name }
    )

    revalidatePath('/dashboard/products', 'page')
    return { success: true }
  } catch (error: any) {
    console.error('Authorization error:', error)
    return { error: error.message || 'Unauthorized' }
  }
}

/**
 * Get products for a specific warehouse
 * Validates that user has access to the warehouse
 */
export async function getWarehouseProducts(warehouseId: string) {
  try {
    const supabase = await createClient()
    
    // Require owner or superadmin role
    await requireAnyRole(['owner', 'superadmin'])

    // Validate warehouse access
    await requireWarehouseAccess(warehouseId)

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!products_category_id_fkey(name)
      `)
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch products' }
    }

    return { success: true, products }
  } catch (error: any) {
    console.error('Authorization error:', error)
    return { error: error.message || 'Unauthorized' }
  }
}
