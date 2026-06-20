// ============================================================
// MercadoRD — Queries del dashboard de vendor (FIX)
// Ruta: src/lib/queries/vendor-dashboard.ts
// ============================================================
// Cambio: getVendorOrders ya no depende de la vista vendor_orders.
// En su lugar hace 2 consultas directas a order_items + orders,
// el mismo patrón que ya funciona en getVendorKPIs.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'

export interface VendorOrderRow {
  order_id: string
  status: string
  delivery_address: string
  payment_method: string
  tracking_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
  province_name: string | null
  buyer_name: string
  buyer_phone: string | null
  items: {
    id: string
    product_id: string
    product_name: string
    product_image: string | null
    quantity: number
    price_rdp: number
    size: string | null
    color: string | null
  }[]
  vendor_subtotal_rdp: number
}

// ─── Obtener el vendor del usuario logueado ────────────────────
export async function getCurrentVendor() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !vendor) return null
  return vendor
}

// ─── Órdenes del vendor — consulta directa, sin vista intermedia ───
export async function getVendorOrders(vendorId: string): Promise<VendorOrderRow[]> {
  const supabase = await createServerClient()

  // 1. Traer los items de este vendor (igual patrón que getVendorKPIs, que ya funciona)
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, quantity, price_rdp, size, color, product:products(name, images)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (itemsError || !items || items.length === 0) {
    if (itemsError) console.error('[getVendorOrders items]', itemsError)
    return []
  }

  const orderIds = [...new Set(items.map(i => i.order_id))]

  // 2. Traer las órdenes correspondientes a esos IDs
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status, delivery_address, payment_method, tracking_code, notes, created_at, updated_at, user_id, province:provinces_rd(name)')
    .in('id', orderIds)
    .order('created_at', { ascending: false })

  if (ordersError || !orders) {
    console.error('[getVendorOrders orders]', ordersError)
    return []
  }

  // 3. Traer los nombres/teléfonos de los compradores
  const buyerIds = [...new Set(orders.map(o => o.user_id))]
  const { data: buyers } = await supabase
    .from('users')
    .select('id, full_name, phone')
    .in('id', buyerIds)

  const buyerMap = new Map((buyers ?? []).map(b => [b.id, b]))

  // 4. Combinar todo
  return orders.map(order => {
    const orderItems = items
      .filter(i => i.order_id === order.id)
      .map(i => ({
        id: i.id,
        product_id: i.product_id,
        product_name: (i.product as any)?.name ?? 'Producto',
        product_image: (i.product as any)?.images?.[0] ?? null,
        quantity: i.quantity,
        price_rdp: i.price_rdp,
        size: i.size,
        color: i.color,
      }))

    const buyer = buyerMap.get(order.user_id)

    return {
      order_id: order.id,
      status: order.status,
      delivery_address: order.delivery_address,
      payment_method: order.payment_method,
      tracking_code: order.tracking_code,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      province_name: (order.province as any)?.name ?? null,
      buyer_name: buyer?.full_name ?? 'Cliente',
      buyer_phone: buyer?.phone ?? null,
      items: orderItems,
      vendor_subtotal_rdp: orderItems.reduce((acc, i) => acc + i.price_rdp * i.quantity, 0),
    }
  })
}

// ─── KPIs del mes actual ────────────────────────────────────────
export async function getVendorKPIs(vendorId: string) {
  const supabase = await createServerClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: items } = await supabase
    .from('order_items')
    .select('price_rdp, quantity, created_at, order_id')
    .eq('vendor_id', vendorId)
    .gte('created_at', startOfMonth.toISOString())

  const monthlyRevenue = (items ?? []).reduce(
    (acc, i) => acc + i.price_rdp * i.quantity, 0
  )

  const uniqueOrders = new Set((items ?? []).map(i => i.order_id))
  const orderCount = uniqueOrders.size
  const avgTicket = orderCount > 0 ? Math.round(monthlyRevenue / orderCount) : 0

  const { data: vendor } = await supabase
    .from('vendors')
    .select('rating_avg, total_sales')
    .eq('id', vendorId)
    .single()

  return {
    monthlyRevenue,
    orderCount,
    avgTicket,
    rating: vendor?.rating_avg ?? 0,
    totalSales: vendor?.total_sales ?? 0,
  }
}

// ─── Productos del vendor (para el tab "Mis Productos") ────────
export async function getVendorProducts(vendorId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getVendorProducts]', error)
    return []
  }
  return data ?? []
}
