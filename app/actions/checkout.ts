'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateDistanceKm, calculateDeliveryFee } from '@/lib/utils/distance'

export async function processCheckoutAction(formData: FormData) {
  const supabase = await createClient()

  console.log('=== processCheckoutAction called ===')

  // Get current user email if logged in
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email || null
  console.log('Current user email:', userEmail)

  // Fetch warehouse dynamically
  const { data: warehouses, error: warehouseError } = await supabase
    .from('warehouses')
    .select('id, lat, lng, radius_km')
    .eq('is_active', true)
    .limit(1)

  console.log('Warehouse fetch:', { warehouses, warehouseError })

  if (!warehouses || warehouses.length === 0) {
    return { error: 'No active delivery hub found' }
  }
  
  const warehouse = warehouses[0]
  const WAREHOUSE_ID = warehouse.id

  // Extract form data
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const notes = formData.get('notes') as string
  const paymentMethod = formData.get('payment_method') as string
  const lat = parseFloat(formData.get('latitude') as string)
  const lng = parseFloat(formData.get('longitude') as string)
  const cartData = JSON.parse(formData.get('cart') as string)

  console.log('Form data:', { name, phone, address, lat, lng, cartItemCount: cartData.length })

  if (!lat || !lng) {
    return { error: 'Location is required. Please verify delivery location.' }
  }

  // Calculate distance server-side
  const distance = calculateDistanceKm(lat, lng, warehouse.lat, warehouse.lng)
  console.log('Distance calculated:', distance, 'km, max allowed:', warehouse.radius_km, 'km')
  
  if (distance > warehouse.radius_km) {
    return { error: `Sorry, you are outside our delivery zone. Maximum radius is ${warehouse.radius_km}km, but you are ${distance.toFixed(1)}km away.` }
  }

  // Calculate delivery fee server-side to prevent tampering
  const deliveryFee = calculateDeliveryFee(distance)
  
  // Calculate subtotal from cart items directly
  const subtotal = cartData.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

  // LOYALTY POINTS SYSTEM: 1000 points = ₹1 discount
  let pointsApplied = parseInt(formData.get('points_applied') as string) || 0
  let pointsDiscount = 0

  if (user && pointsApplied > 0) {
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
    const currentPoints = profile?.points || 0
    if (pointsApplied > currentPoints) {
      pointsApplied = currentPoints
    }
    pointsDiscount = pointsApplied / 1000
    console.log(`Applying ${pointsApplied} points for ₹${pointsDiscount} discount`)
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee - pointsDiscount)

  // Combine Points Discount into notes so Admin sees it prominently
  let finalNotes = notes || ""
  if (pointsDiscount > 0) {
    finalNotes += `${finalNotes ? ' | ' : ''}Loyalty Discount: ₹${pointsDiscount.toFixed(2)} (${pointsApplied} Points Applied)`
  }

  // Create Order with correct column names
  const orderPayload = {
    customer_name: name,
    customer_phone: phone,
    customer_email: userEmail,
    delivery_address: address,
    delivery_lat: lat,
    delivery_lng: lng,
    distance_km: distance,
    delivery_fee: deliveryFee,
    subtotal: subtotal,
    total: finalTotal,
    status: 'pending',
    payment_method: paymentMethod || 'COD',
    notes: finalNotes,
    warehouse_id: WAREHOUSE_ID
  }

  console.log('Creating order with payload:', orderPayload)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select()
    .single()

  console.log('Order creation result:', { order, orderError })

  if (orderError || !order) {
    console.error('Order creation failed:', orderError)
    return { error: `Failed to create order: ${orderError?.message || 'Unknown error'}` }
  }

  // Insert Order Items
  const orderItems = cartData.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price
  }))

  console.log('Inserting order items:', orderItems)

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items insertion failed:', itemsError)
    // Rollback: delete the order
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: `Failed to save order items: ${itemsError.message}` }
  }

  // Deduct Stock
  console.log('Deducting stock for', cartData.length, 'items')
  for (const item of cartData) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()
    
    if (product && product.stock >= item.quantity) {
      await supabase
        .from('products')
        .update({ stock: product.stock - item.quantity })
        .eq('id', item.product_id)
      console.log(`Stock updated for product ${item.product_id}: ${product.stock} -> ${product.stock - item.quantity}`)
    }
  }

  // EARN RANDOM LOYALTY POINTS (1-100 with 0.001 probability of 100)
  let earnedPoints = 0
  if (user) {
    const isJackpot = Math.random() < 0.001
    earnedPoints = isJackpot ? 100 : Math.floor(Math.random() * 100) + 1

    const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
    const currentPoints = profile?.points || 0
    const newPoints = currentPoints - pointsApplied + earnedPoints
    
    await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id)
    console.log(`Updated points for user ${user.id}: ${currentPoints} - ${pointsApplied} + ${earnedPoints} = ${newPoints}`)
  }

  revalidatePath('/dashboard', 'page')
  revalidatePath('/dashboard/orders', 'page')
  revalidatePath('/account', 'page')
  
  console.log('Order created successfully:', order.id)
  return { success: true, orderId: order.id, earnedPoints }
}
