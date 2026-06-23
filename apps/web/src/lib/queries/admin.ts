// ============================================================
// MercadoRD — Queries del panel de administración
// Ruta: src/lib/queries/admin.ts
// ============================================================

import { createServerClient } from '@/lib/supabase/server'

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return data?.is_admin ?? false
}

export interface MarketplaceKPIs {
  totalVendors: number
  verifiedVendors: number
  totalProducts: number
  activeProducts: number
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  ordersThisMonth: number
  revenueThisMonth: number
}

export async function getMarketplaceKPIs(): Promise<MarketplaceKPIs> {
  const supabase = await createServerClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { count: totalVendors },
    { count: verifiedVendors },
    { count: totalProducts },
    { count: activeProducts },
    { count: totalUsers },
    { data: allOrders },
    { data: monthOrders },
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_rdp, status').neq('status', 'cancelled'),
    supabase.from('orders').select('total_rdp, status').neq('status', 'cancelled').gte('created_at', startOfMonth.toISOString()),
  ])

  const totalRevenue = (allOrders ?? []).reduce((acc, o) => acc + o.total_rdp, 0)
  const revenueThisMonth = (monthOrders ?? []).reduce((acc, o) => acc + o.total_rdp, 0)

  return {
    totalVendors: totalVendors ?? 0,
    verifiedVendors: verifiedVendors ?? 0,
    totalProducts: totalProducts ?? 0,
    activeProducts: activeProducts ?? 0,
    totalOrders: (allOrders ?? []).length,
    totalRevenue,
    totalUsers: totalUsers ?? 0,
    ordersThisMonth: (monthOrders ?? []).length,
    revenueThisMonth,
  }
}

export interface AdminVendorRow {
  id: string
  business_name: string
  is_verified: boolean
  plan: string
  rating_avg: number
  total_sales: number
  created_at: string
  province_name: string | null
  product_count: number
}

export async function getAllVendors(): Promise<AdminVendorRow[]> {
  const supabase = await createServerClient()

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, business_name, is_verified, plan, rating_avg, total_sales, created_at, province:provinces_rd(name)')
    .order('created_at', { ascending: false })

  if (error || !vendors) {
    console.error('[getAllVendors]', error)
    return []
  }

  // Contar productos por vendor
  const { data: productCounts } = await supabase
    .from('products')
    .select('vendor_id')

  const countMap = new Map<string, number>()
  ;(productCounts ?? []).forEach((p: any) => {
    countMap.set(p.vendor_id, (countMap.get(p.vendor_id) ?? 0) + 1)
  })

  return vendors.map((v: any) => ({
    id: v.id,
    business_name: v.business_name,
    is_verified: v.is_verified,
    plan: v.plan,
    rating_avg: v.rating_avg,
    total_sales: v.total_sales,
    created_at: v.created_at,
    province_name: v.province?.name ?? null,
    product_count: countMap.get(v.id) ?? 0,
  }))
}

export interface PaymentBreakdown {
  count: number
  amount: number
}

export interface PaymentMetrics {
  byMethod: Record<string, PaymentBreakdown>
  byStatus: Record<string, PaymentBreakdown>
  totalCount: number
  totalAmount: number
}

export async function getPaymentMetrics(): Promise<PaymentMetrics> {
  const supabase = await createServerClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select('method, status, amount_rdp')

  if (error || !payments) {
    console.error('[getPaymentMetrics]', error)
    return { byMethod: {}, byStatus: {}, totalCount: 0, totalAmount: 0 }
  }

  const byMethod: Record<string, PaymentBreakdown> = {}
  const byStatus: Record<string, PaymentBreakdown> = {}
  let totalAmount = 0

  for (const p of payments) {
    const method = byMethod[p.method] ?? { count: 0, amount: 0 }
    method.count += 1
    method.amount += p.amount_rdp
    byMethod[p.method] = method

    const status = byStatus[p.status] ?? { count: 0, amount: 0 }
    status.count += 1
    status.amount += p.amount_rdp
    byStatus[p.status] = status

    totalAmount += p.amount_rdp
  }

  return {
    byMethod,
    byStatus,
    totalCount: payments.length,
    totalAmount,
  }
}

export interface AdminDisputeRow {
  id: string
  order_id: string
  reason: string
  description: string
  status: string
  created_at: string
  buyer_name: string
  vendor_name: string
}

export async function getOpenDisputes(): Promise<AdminDisputeRow[]> {
  const supabase = await createServerClient()

  const { data: disputes, error } = await supabase
    .from('disputes')
    .select('id, order_id, buyer_id, reason, description, status, created_at, vendor:vendors(business_name)')
    .in('status', ['open', 'reviewing'])
    .order('created_at', { ascending: false })

  if (error || !disputes) {
    console.error('[getOpenDisputes]', error)
    return []
  }

  // Nombres de compradores — consulta separada (no embebida), users
  // tiene RLS restrictivo y el admin sí puede leer todo, pero seguimos
  // el mismo patrón seguro que el resto del panel.
  const buyerIds = [...new Set(disputes.map((d: any) => d.buyer_id))]
  const { data: buyers } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', buyerIds)

  const buyerMap = new Map((buyers ?? []).map((b: any) => [b.id, b.full_name]))

  return disputes.map((d: any) => ({
    id: d.id,
    order_id: d.order_id,
    reason: d.reason,
    description: d.description,
    status: d.status,
    created_at: d.created_at,
    buyer_name: buyerMap.get(d.buyer_id) ?? 'Cliente',
    vendor_name: d.vendor?.business_name ?? 'Vendedor',
  }))
}

export interface AdminOrderRow {
  id: string
  status: string
  total_rdp: number
  created_at: string
  buyer_name: string
  province_name: string | null
  item_count: number
}

export async function getRecentOrders(limit = 20): Promise<AdminOrderRow[]> {
  const supabase = await createServerClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, total_rdp, created_at, user_id, province:provinces_rd(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !orders) {
    console.error('[getRecentOrders]', error)
    return []
  }

  const buyerIds = [...new Set(orders.map((o: any) => o.user_id))]
  const { data: buyers } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', buyerIds)

  const buyerMap = new Map((buyers ?? []).map((b: any) => [b.id, b.full_name]))

  const orderIds = orders.map((o: any) => o.id)
  const { data: items } = await supabase
    .from('order_items')
    .select('order_id')
    .in('order_id', orderIds)

  const itemCountMap = new Map<string, number>()
  ;(items ?? []).forEach((i: any) => {
    itemCountMap.set(i.order_id, (itemCountMap.get(i.order_id) ?? 0) + 1)
  })

  return orders.map((o: any) => ({
    id: o.id,
    status: o.status,
    total_rdp: o.total_rdp,
    created_at: o.created_at,
    buyer_name: buyerMap.get(o.user_id) ?? 'Cliente',
    province_name: o.province?.name ?? null,
    item_count: itemCountMap.get(o.id) ?? 0,
  }))
}
