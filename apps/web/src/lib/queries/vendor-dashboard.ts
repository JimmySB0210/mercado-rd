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

  // province embebida (provinces_rd(name)) -- mismo patrón que ya usa
  // getVendorOrders más abajo -- para "Tu tienda" (ciudad/provincia real).
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, province:provinces_rd(name)')
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
// rating/totalSales YA NO viven acá -- vendors.rating_avg/total_sales
// están confirmados sembrados (auditoría de seguridad, 2026-10-01);
// ver getVendorRealStats más abajo, que usa vendor_real_stats (la
// vista real, ya aplicada). avgTicket tampoco -- la referencia visual
// reemplaza esa tarjeta por "Productos" (ver getVendorProducts).
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

  return { monthlyRevenue, orderCount }
}

// ─── Estadísticas reales del vendedor (vendor_real_stats) ───────
// Reemplaza vendors.rating_avg/total_sales (sembrados, nunca
// actualizados) por el cálculo real: SUM(products.sold_count) +
// AVG(reviews.rating) -- la vista ya está aplicada en la BD real
// (confirmado en vivo, 2026-10-01). realRatingAvg es null cuando el
// vendedor todavía no tiene ninguna reseña real -- nunca se debe
// mostrar como 0, es un estado distinto ("sin calificación todavía").
export interface VendorRealStats {
  realTotalSales: number
  realRatingAvg: number | null
  realRatingCount: number
}

export async function getVendorRealStats(vendorId: string): Promise<VendorRealStats> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('vendor_real_stats')
    .select('real_total_sales, real_rating_avg, real_rating_count')
    .eq('vendor_id', vendorId)
    .maybeSingle()

  if (error) console.error('[getVendorRealStats]', error)

  return {
    realTotalSales: data?.real_total_sales ?? 0,
    realRatingAvg: data?.real_rating_avg ?? null,
    realRatingCount: data?.real_rating_count ?? 0,
  }
}

// ─── Insumos reales para la fórmula de completitud de tienda ────
// Ver lib/vendorCompleteness.ts para la fórmula en sí -- acá solo se
// resuelven los 8 booleanos reales contra la BD. 3 consultas en
// paralelo (existencia de fila, no el contenido) + los campos que ya
// trae el propio `vendor` (logo_url, description, whatsapp/instagram,
// bank_name/bank_account).
export async function getVendorCompletenessFlags(vendorId: string, userId: string) {
  const supabase = await createServerClient()

  const [{ count: categoriesCount }, { count: businessTypesCount }, { count: servicesCount }, { data: kyc }] =
    await Promise.all([
      supabase.from('vendor_categories').select('vendor_id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
      supabase.from('vendor_business_types').select('vendor_id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
      supabase.from('vendor_services').select('vendor_id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
      supabase
        .from('external_verifications')
        .select('id')
        .eq('verification_type', 'identity_kyc')
        .eq('target_type', 'user')
        .eq('target_id', userId)
        .limit(1)
        .maybeSingle(),
    ])

  return {
    hasCategories: (categoriesCount ?? 0) > 0,
    hasBusinessType: (businessTypesCount ?? 0) > 0,
    hasServices: (servicesCount ?? 0) > 0,
    hasIdentitySubmitted: !!kyc,
  }
}

// ─── Mensajes sin responder (conversations.vendor_unread, real) ──
export async function getVendorUnreadMessagesCount(vendorId: string): Promise<number> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('vendor_unread')
    .eq('vendor_id', vendorId)
    .gt('vendor_unread', 0)

  if (error) { console.error('[getVendorUnreadMessagesCount]', error); return 0 }
  return (data ?? []).reduce((acc, c) => acc + (c.vendor_unread ?? 0), 0)
}

// ─── Ingresos de los últimos 6 meses (incluye el mes actual) ───
export interface MonthlyRevenuePoint {
  month: string
  revenue: number
}

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function buildMonths(reference: Date, revenueByMonth: Map<string, number>): MonthlyRevenuePoint[] {
  const points: MonthlyRevenuePoint[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    points.push({
      month: MONTH_ABBR[d.getMonth()],
      revenue: revenueByMonth.get(key) ?? 0,
    })
  }
  return points
}

export async function getVendorMonthlyRevenue(vendorId: string): Promise<MonthlyRevenuePoint[]> {
  const supabase = await createServerClient()
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('price_rdp, quantity, created_at, order_id')
    .eq('vendor_id', vendorId)
    .gte('created_at', startDate.toISOString())

  if (itemsError) console.error('[getVendorMonthlyRevenue items]', itemsError)
  if (itemsError || !items || items.length === 0) {
    return buildMonths(now, new Map())
  }

  // Excluir órdenes canceladas — order_items no tiene status propio
  const orderIds = [...new Set(items.map(i => i.order_id))]
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status')
    .in('id', orderIds)

  const statusMap = new Map((orders ?? []).map(o => [o.id, o.status]))

  const revenueByMonth = new Map<string, number>()
  for (const item of items) {
    if (statusMap.get(item.order_id) === 'cancelled') continue
    const date = new Date(item.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + item.price_rdp * item.quantity)
  }

  return buildMonths(now, revenueByMonth)
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
