// ============================================================
// MercadoRD — Queries del panel de administración
// Ruta: src/lib/queries/admin.ts
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { Vendor, BusinessType, VendorService, CustomerType } from '@/types/database.types'

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
  verification_level: number
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
    .select('id, business_name, is_verified, verification_level, plan, rating_avg, total_sales, created_at, province:provinces_rd(name)')
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
    verification_level: v.verification_level,
    plan: v.plan,
    rating_avg: v.rating_avg,
    total_sales: v.total_sales,
    created_at: v.created_at,
    province_name: v.province?.name ?? null,
    product_count: countMap.get(v.id) ?? 0,
  }))
}

// ─── Gestión de verificación de vendors (/admin/proveedores) ────────────────

export interface AdminVendorVerificationRow {
  id: string
  business_name: string
  logo_url: string | null
  verification_level: number
  onboarding_completed: boolean
  province_name: string | null
  business_types: BusinessType[]
  created_at: string
}

export async function getAllVendorsForVerification(): Promise<AdminVendorVerificationRow[]> {
  const supabase = await createServerClient()

  const [{ data: vendors, error }, { data: businessTypeRows }] = await Promise.all([
    supabase
      .from('vendors')
      .select('id, business_name, logo_url, verification_level, onboarding_completed, created_at, province:provinces_rd(name)')
      .order('created_at', { ascending: false }),
    supabase.from('vendor_business_types').select('vendor_id, business_type'),
  ])

  if (error || !vendors) {
    console.error('[getAllVendorsForVerification]', error)
    return []
  }

  const businessTypesMap = new Map<string, BusinessType[]>()
  ;(businessTypeRows ?? []).forEach((r: any) => {
    const list = businessTypesMap.get(r.vendor_id) ?? []
    list.push(r.business_type)
    businessTypesMap.set(r.vendor_id, list)
  })

  return vendors.map((v: any) => ({
    id: v.id,
    business_name: v.business_name,
    logo_url: v.logo_url,
    verification_level: v.verification_level,
    onboarding_completed: v.onboarding_completed,
    province_name: v.province?.name ?? null,
    business_types: businessTypesMap.get(v.id) ?? [],
    created_at: v.created_at,
  }))
}

export interface AdminVendorDetail extends Vendor {
  province_name: string | null
  business_types: BusinessType[]
  categories: { id: number; name: string; emoji: string; slug: string }[]
  services: VendorService[]
  target_customers: CustomerType[]
  product_count: number
}

export async function getVendorDetailForAdmin(vendorId: string): Promise<AdminVendorDetail | null> {
  const supabase = await createServerClient()

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, province:provinces_rd(name)')
    .eq('id', vendorId)
    .single()

  if (error || !vendor) {
    console.error('[getVendorDetailForAdmin]', error)
    return null
  }

  const [
    { data: businessTypesRaw }, { data: categoriesRaw }, { data: servicesRaw }, { data: targetCustomersRaw }, { count: productCount },
  ] = await Promise.all([
    supabase.from('vendor_business_types').select('business_type').eq('vendor_id', vendorId),
    supabase.from('vendor_categories').select('category_id, category:categories(id, name, emoji, slug)').eq('vendor_id', vendorId),
    supabase.from('vendor_services').select('service').eq('vendor_id', vendorId),
    supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', vendorId),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
  ])

  return {
    ...(vendor as any),
    province_name: (vendor as any).province?.name ?? null,
    business_types: (businessTypesRaw ?? []).map((r: any) => r.business_type),
    categories: (categoriesRaw ?? [])
      .map((r: any) => r.category)
      .filter((c: any): c is { id: number; name: string; emoji: string; slug: string } => !!c),
    services: (servicesRaw ?? []).map((r: any) => r.service),
    target_customers: (targetCustomersRaw ?? []).map((r: any) => r.customer_type),
    product_count: productCount ?? 0,
  }
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

// ─── Bitácora de auditoría (/admin/auditoria) ────────────────────────────────

export interface AuditLogRow {
  id: string
  event_type: string
  actor_id: string | null
  actor_name: string | null
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogFilters {
  eventType?: string
  dateFrom?: string // fecha (YYYY-MM-DD), inclusive desde las 00:00
  dateTo?: string   // fecha (YYYY-MM-DD), inclusive hasta las 23:59:59
}

export async function getAuditLogs(filters: AuditLogFilters = {}, limit = 200): Promise<AuditLogRow[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('audit_logs')
    .select('id, event_type, actor_id, target_type, target_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.eventType) query = query.eq('event_type', filters.eventType)
  if (filters.dateFrom) query = query.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`)
  if (filters.dateTo) query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`)

  const { data: logs, error } = await query

  if (error || !logs) {
    console.error('[getAuditLogs]', error)
    return []
  }

  // Nombre del actor — consulta separada (no embebida), mismo patrón
  // seguro usado en el resto del panel admin para evitar problemas de
  // RLS-embedding contra la tabla users.
  const actorIds = [...new Set(logs.map(l => l.actor_id).filter((id): id is string => !!id))]
  const { data: actors } = actorIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', actorIds)
    : { data: [] as { id: string; full_name: string }[] }

  const actorMap = new Map((actors ?? []).map(a => [a.id, a.full_name]))

  return logs.map(l => ({
    id: l.id,
    event_type: l.event_type,
    actor_id: l.actor_id,
    actor_name: l.actor_id ? (actorMap.get(l.actor_id) ?? null) : null,
    target_type: l.target_type,
    target_id: l.target_id,
    metadata: l.metadata as Record<string, unknown> | null,
    created_at: l.created_at,
  }))
}

// Valores distintos de event_type ya presentes en la tabla — para poblar
// el dropdown de filtro. Sin RPC de "distinct": se trae la tabla completa
// (aceptable para un log de auditoría interno de bajo volumen) y se
// deduplica en memoria, mismo criterio pragmático que ya usa el resto
// de este archivo (ej. getAllVendors contando productos en memoria).
export async function getDistinctAuditEventTypes(): Promise<string[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from('audit_logs').select('event_type')

  if (error || !data) {
    console.error('[getDistinctAuditEventTypes]', error)
    return []
  }

  return [...new Set(data.map(d => d.event_type))].sort()
}

export interface AbandonedCartRow {
  id: string
  user_id: string
  buyer_name: string
  total_rdp: number
  updated_at: string
}

export interface AbandonedCartsSummary {
  totalUnrecovered: number
  totalPotentialValueRdp: number
  recent: AbandonedCartRow[]
}

export async function getAbandonedCarts(): Promise<AbandonedCartsSummary> {
  const supabase = await createServerClient()

  const { data: carts, error } = await supabase
    .from('abandoned_carts')
    .select('id, user_id, total_rdp, updated_at')
    .is('recovered_at', null)
    .order('updated_at', { ascending: false })

  if (error || !carts) {
    console.error('[getAbandonedCarts]', error)
    return { totalUnrecovered: 0, totalPotentialValueRdp: 0, recent: [] }
  }

  const totalUnrecovered = carts.length
  const totalPotentialValueRdp = carts.reduce((acc, c) => acc + c.total_rdp, 0)
  const recentRaw = carts.slice(0, 5)

  // Nombre del comprador — consulta separada (no embebida), mismo
  // patrón seguro usado en el resto del panel admin
  const buyerIds = [...new Set(recentRaw.map(c => c.user_id))]
  const { data: buyers } = buyerIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', buyerIds)
    : { data: [] as { id: string; full_name: string }[] }

  const buyerMap = new Map((buyers ?? []).map(b => [b.id, b.full_name]))

  const recent: AbandonedCartRow[] = recentRaw.map(c => ({
    id: c.id,
    user_id: c.user_id,
    buyer_name: buyerMap.get(c.user_id) ?? 'Cliente',
    total_rdp: c.total_rdp,
    updated_at: c.updated_at,
  }))

  return { totalUnrecovered, totalPotentialValueRdp, recent }
}
