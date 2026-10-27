// ============================================================
// MercadoRD — Consultas del Centro de operaciones (/admin)
// Ruta: src/lib/queries/adminOps.ts
// ============================================================
// Todo se lee con la sesión del propio admin (createServerClient): las
// políticas RLS y is_admin() siguen siendo la barrera real. Aquí no hay
// service-role ni ninguna política nueva.
//
// Regla de oro: si una consulta falla, la sección devuelve { ok: false } y la
// pantalla muestra un error. Un error NUNCA se convierte en 0 ni en lista vacía.
//
// Los contadores usan count exact + head (no traen filas). Las sumas leen
// páginas de 1000 filas con un tope; si el tope no alcanza para leer todo,
// el resultado se marca como parcial y la pantalla lo dice.
// ============================================================

import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { getVendorRealStatsBatch } from '@/lib/queries/vendorRealStatsBatch'
import {
  type Section,
  type AdminTask,
  type TaskKind,
  type DisputeFilter,
  DISPUTE_FILTER_STATUSES,
  DISPUTES_PAGE_SIZE,
  SALES_ORDER_STATUSES,
  PENDING_DISPUTE_STATUSES,
  SUMMARY_EXCLUDED_EVENT_TYPES,
  TASK_LIMIT,
  ageMinutesSince,
  priorityForAge,
  compareTasks,
  shortRef,
  auditHref,
  startOfMonthDR,
  sumCentavos,
} from '@/lib/admin/ops'

// ─── Utilidades internas ─────────────────────────────────────────────────────

type DbError = { message?: string } | null | undefined

async function section<T>(label: string, fn: () => Promise<T>): Promise<Section<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    console.error(`[admin/ops] ${label}`, err)
    return { ok: false, error: label }
  }
}

function fail(label: string, error: DbError): never {
  throw new Error(`${label}: ${error?.message ?? 'sin respuesta'}`)
}

/**
 * Un conteo válido es un entero finito ≥ 0. supabase-js devuelve NaN (no null) cuando la cabecera
 * Content-Range trae «*» (total desconocido): sin esta comprobación la pantalla mostraría «NaN».
 */
function isValidCount(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0
}

/** Cuenta filas. Si la base no devuelve un número válido, es un error: nunca se asume 0. */
async function countOf(
  label: string,
  query: PromiseLike<{ count: number | null; error: DbError }>,
): Promise<number> {
  const { count, error } = await query
  if (error || !isValidCount(count)) fail(label, error)
  return count
}

const PAGE_SIZE = 1000
const MAX_PAGES = 10

interface PagedResponse<Row> { data: Row[] | null; error: DbError; count: number | null }
interface PagedBuilder<Row> { range(from: number, to: number): PromiseLike<PagedResponse<Row>> }

/**
 * Lee todas las filas de una consulta de a 1000 (el límite de la API), hasta MAX_PAGES páginas.
 * `build(true)` debe pedir también el conteo exacto (solo se usa en la primera página).
 * `complete` es false si el tope se alcanzó antes de leer todo.
 */
async function readPaged<Row>(
  label: string,
  build: (withCount: boolean) => PagedBuilder<Row>,
): Promise<{ rows: Row[]; total: number; complete: boolean }> {
  const rows: Row[] = []
  let total = Number.POSITIVE_INFINITY
  for (let page = 0; page < MAX_PAGES && rows.length < total; page++) {
    const { data, error, count } = await build(page === 0).range(rows.length, rows.length + PAGE_SIZE - 1)
    if (error || !data) fail(label, error)
    if (page === 0) {
      if (!isValidCount(count)) fail(label, { message: 'sin conteo' })
      total = count
    }
    if (data.length === 0) break
    rows.push(...data)
  }
  return { rows, total: Number.isFinite(total) ? total : rows.length, complete: rows.length >= total }
}

// ─── Disputas, proveedores por revisar y contenido marcado ───────────────────

export interface DisputeCounts {
  open: number
  reviewing: number
  resolved: number
  closed: number
  /** open + reviewing: lo que todavía pide actuación. */
  pending: number
  oldestPendingAt: string | null
}

/** Se usa en varias secciones de la misma pantalla: cache() evita repetir las consultas. */
export const getDisputeCounts = cache(async (): Promise<Section<DisputeCounts>> =>
  section('disputas', async () => {
    const supabase = await createServerClient()
    const byStatus = (status: string) =>
      countOf(`disputes.${status}`, supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', status))
    const [open, reviewing, resolved, closed, oldest] = await Promise.all([
      byStatus('open'),
      byStatus('reviewing'),
      byStatus('resolved'),
      byStatus('closed'),
      supabase
        .from('disputes')
        .select('created_at')
        .in('status', [...PENDING_DISPUTE_STATUSES])
        .order('created_at', { ascending: true })
        .limit(1),
    ])
    if (oldest.error) fail('disputes.oldest', oldest.error)
    return {
      open,
      reviewing,
      resolved,
      closed,
      pending: open + reviewing,
      oldestPendingAt: (oldest.data?.[0]?.created_at as string | undefined) ?? null,
    }
  }),
)

/**
 * «Proveedores por revisar»: registro completo (onboarding_completed) y todavía en nivel 1 (cuenta básica).
 * No existe una solicitud de verificación de proveedor: el admin sube el nivel a mano en /admin/proveedores.
 */
export const getVendorsToReviewCount = cache(async (): Promise<Section<number>> =>
  section('proveedores', async () => {
    const supabase = await createServerClient()
    return countOf(
      'vendors.review',
      supabase
        .rpc('admin_list_vendors', undefined, { count: 'exact', head: true })
        .eq('onboarding_completed', true)
        .eq('verification_level', 1),
    )
  }),
)

/** Contenido marcado por los términos de moderación y todavía sin revisar. */
export const getFlaggedUnreviewedCount = cache(async (): Promise<Section<number>> =>
  section('moderacion', async () => {
    const supabase = await createServerClient()
    return countOf(
      'flagged_content',
      supabase.from('flagged_content').select('id', { count: 'exact', head: true }).eq('reviewed', false),
    )
  }),
)

export interface AttentionData {
  vendors: Section<number>
  content: Section<number>
  disputes: Section<DisputeCounts>
}

export async function getAttentionData(): Promise<AttentionData> {
  const [vendors, content, disputes] = await Promise.all([
    getVendorsToReviewCount(),
    getFlaggedUnreviewedCount(),
    getDisputeCounts(),
  ])
  return { vendors, content, disputes }
}

// ─── Tareas pendientes ───────────────────────────────────────────────────────

export interface TasksData {
  items: AdminTask[]
  /** Fuentes que no se pudieron leer (la lista puede estar incompleta). */
  failed: TaskKind[]
  /** Total de registros pendientes en las tres fuentes, o null si algún contador falló. */
  totalPending: number | null
}

export async function getTasks(nowMs: number = Date.now()): Promise<TasksData> {
  const supabase = await createServerClient()

  const [disputes, vendors, flagged, attention] = await Promise.all([
    section('tareas.disputas', async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select('id, order_id, reason, status, created_at, vendor:vendors(business_name)')
        .in('status', [...PENDING_DISPUTE_STATUSES])
        .order('created_at', { ascending: true })
        .limit(TASK_LIMIT)
      if (error || !data) fail('tareas.disputas', error)
      return data as any[]
    }),
    section('tareas.proveedores', async () => {
      const { data, error } = await supabase
        .rpc('admin_list_vendors')
        .select('id, business_name, created_at')
        .eq('onboarding_completed', true)
        .eq('verification_level', 1)
        .order('created_at', { ascending: true })
        .limit(TASK_LIMIT)
      if (error || !data) fail('tareas.proveedores', error)
      return data as unknown as any[]
    }),
    section('tareas.moderacion', async () => {
      const { data, error } = await supabase
        .from('flagged_content')
        .select('id, content_type, created_at')
        .eq('reviewed', false)
        .order('created_at', { ascending: true })
        .limit(TASK_LIMIT)
      if (error || !data) fail('tareas.moderacion', error)
      return data as any[]
    }),
    getAttentionData(),
  ])

  const items: AdminTask[] = []
  const failed: TaskKind[] = []

  const push = (t: Omit<AdminTask, 'key' | 'ageMinutes' | 'priority'>) => {
    const ageMinutes = ageMinutesSince(t.createdAt, nowMs)
    items.push({ ...t, key: `${t.kind}:${t.id}`, ageMinutes, priority: priorityForAge(ageMinutes) })
  }

  if (disputes.ok) {
    for (const d of disputes.data) {
      push({
        kind: 'dispute',
        id: d.id,
        label: shortRef(d.order_id),
        detailKey: `disputeReason.${d.reason}`,
        detailText: d.vendor?.business_name ?? null,
        createdAt: d.created_at,
        stateKey: d.status === 'reviewing' ? 'reviewing' : 'open',
        href: `/admin/disputas?caso=${d.id}`,
      })
    }
  } else failed.push('dispute')

  if (vendors.ok) {
    for (const v of vendors.data) {
      push({
        kind: 'vendor_review',
        id: v.id,
        label: v.business_name,
        detailKey: null,
        detailText: null,
        createdAt: v.created_at,
        stateKey: 'vendor_level1',
        href: `/admin/proveedores?estado=por_revisar&vendor=${v.id}`,
      })
    }
  } else failed.push('vendor_review')

  if (flagged.ok) {
    for (const f of flagged.data) {
      push({
        kind: 'flagged_content',
        id: f.id,
        label: shortRef(f.id),
        detailKey: f.content_type === 'chat_message' ? 'flaggedTypeMessage' : 'flaggedTypeProduct',
        detailText: null,
        createdAt: f.created_at,
        stateKey: 'unreviewed',
        href: '/admin/moderacion',
      })
    }
  } else failed.push('flagged_content')

  items.sort(compareTasks)

  const totalPending =
    attention.vendors.ok && attention.content.ok && attention.disputes.ok
      ? attention.vendors.data + attention.content.data + attention.disputes.data.pending
      : null

  return { items: items.slice(0, TASK_LIMIT), failed, totalPending }
}

// ─── Indicadores (KPIs) ──────────────────────────────────────────────────────

export interface OrdersKpi {
  total: number
  pending: number
  delivered: number
  cancelled: number
  /** Pedidos en estado de venta (ver SALES_ORDER_STATUSES) leídos para sumar. */
  salesCount: number
  salesMonthCount: number
  /** Centavos. */
  salesAll: number
  salesMonth: number
  /** false si no se pudieron leer todos los pedidos de venta (tope de lectura): las sumas son parciales. */
  salesComplete: boolean
  salesTotalExpected: number
}

export interface VendorsKpi { total: number; onboardingComplete: number; level2Plus: number }
export interface ProductsKpi { published: number; total: number }
export interface UsersKpi { active: number }

export interface KpiData {
  generatedAt: string
  orders: Section<OrdersKpi>
  vendors: Section<VendorsKpi>
  products: Section<ProductsKpi>
  users: Section<UsersKpi>
}

export async function getKpis(nowMs: number = Date.now()): Promise<KpiData> {
  const supabase = await createServerClient()
  const monthStartMs = Date.parse(startOfMonthDR(nowMs))

  const ordersCount = (status?: string) => {
    const q = supabase.from('orders').select('id', { count: 'exact', head: true })
    return status ? q.eq('status', status) : q
  }
  const vendorsCount = () => supabase.rpc('admin_list_vendors', undefined, { count: 'exact', head: true })

  const [orders, vendors, products, users] = await Promise.all([
    section('indicadores.pedidos', async () => {
      const [total, pending, delivered, cancelled, sales] = await Promise.all([
        countOf('orders.total', ordersCount()),
        countOf('orders.pending', ordersCount('pending')),
        countOf('orders.delivered', ordersCount('delivered')),
        countOf('orders.cancelled', ordersCount('cancelled')),
        readPaged<{ total_rdp: number | null; created_at: string }>('orders.sales', withCount =>
          supabase
            .from('orders')
            .select('total_rdp, created_at', withCount ? { count: 'exact' } : undefined)
            .in('status', [...SALES_ORDER_STATUSES])
            .order('created_at', { ascending: false })
            .order('id', { ascending: true }) as unknown as PagedBuilder<{ total_rdp: number | null; created_at: string }>,
        ),
      ])
      const monthRows = sales.rows.filter(r => Date.parse(r.created_at) >= monthStartMs)
      return {
        total,
        pending,
        delivered,
        cancelled,
        salesCount: sales.rows.length,
        salesMonthCount: monthRows.length,
        salesAll: sumCentavos(sales.rows.map(r => r.total_rdp)),
        salesMonth: sumCentavos(monthRows.map(r => r.total_rdp)),
        salesComplete: sales.complete,
        salesTotalExpected: sales.total,
      } satisfies OrdersKpi
    }),
    section('indicadores.proveedores', async () => {
      const [total, onboardingComplete, level2Plus] = await Promise.all([
        countOf('vendors.total', vendorsCount()),
        countOf('vendors.onboarding', vendorsCount().eq('onboarding_completed', true)),
        countOf('vendors.level2', vendorsCount().gte('verification_level', 2)),
      ])
      return { total, onboardingComplete, level2Plus } satisfies VendorsKpi
    }),
    section('indicadores.productos', async () => {
      const [published, total] = await Promise.all([
        countOf('products.published', supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'published')),
        countOf('products.total', supabase.from('products').select('id', { count: 'exact', head: true })),
      ])
      return { published, total } satisfies ProductsKpi
    }),
    section('indicadores.usuarios', async () => {
      const active = await countOf(
        'users.active',
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      )
      return { active } satisfies UsersKpi
    }),
  ])

  return { generatedAt: new Date(nowMs).toISOString(), orders, vendors, products, users }
}

// ─── Actividad reciente (audit_logs) ─────────────────────────────────────────

export interface ActivityItem {
  id: string
  eventType: string
  createdAt: string
  ageMinutes: number
  actorName: string | null
  /** Referencia corta del pedido relacionado (#RD-XXXXXXXX) cuando el evento es de un pedido. */
  relatedRef: string | null
  href: string
}

export const ACTIVITY_LIMIT = 8

export async function getRecentActivity(nowMs: number = Date.now()): Promise<Section<ActivityItem[]>> {
  return section('actividad', async () => {
    const supabase = await createServerClient()
    // No se pide `metadata`: puede traer datos sensibles y el resumen no los necesita.
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, event_type, actor_id, target_type, target_id, created_at')
      .not('event_type', 'in', `(${SUMMARY_EXCLUDED_EVENT_TYPES.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(ACTIVITY_LIMIT)
    if (error || !data) fail('audit_logs', error)

    const actorIds = [...new Set(data.map((l: any) => l.actor_id).filter((id: unknown): id is string => typeof id === 'string'))]
    const actorNames = new Map<string, string>()
    if (actorIds.length > 0) {
      const { data: actors, error: actorsError } = await supabase.from('users').select('id, full_name').in('id', actorIds)
      // Sin nombres el evento sigue siendo útil: solo se omite el actor.
      if (actorsError) console.error('[admin/ops] actividad.actores', actorsError)
      for (const a of actors ?? []) actorNames.set(a.id, a.full_name)
    }

    return data.map((l: any): ActivityItem => ({
      id: l.id,
      eventType: l.event_type,
      createdAt: l.created_at,
      ageMinutes: ageMinutesSince(l.created_at, nowMs),
      actorName: l.actor_id ? (actorNames.get(l.actor_id) ?? null) : null,
      relatedRef: l.target_type === 'order' && l.target_id ? shortRef(l.target_id) : null,
      href: auditHref(l.event_type, l.created_at),
    }))
  })
}

// ─── Estado técnico ──────────────────────────────────────────────────────────

export interface TechnicalStatusData {
  /** Solicitudes de verificación externa (KYC, RNC, IMEI, VIN) que quedaron en estado «unavailable» por no haber proveedor. */
  externalVerificationsWithoutProvider: number
}

export async function getTechnicalStatus(): Promise<Section<TechnicalStatusData>> {
  return section('estado-tecnico', async () => {
    const supabase = await createServerClient()
    const externalVerificationsWithoutProvider = await countOf(
      'external_verifications',
      supabase.from('external_verifications').select('id', { count: 'exact', head: true }).eq('status', 'unavailable'),
    )
    return { externalVerificationsWithoutProvider }
  })
}

// ─── Pedidos recientes ───────────────────────────────────────────────────────

export interface RecentOrder {
  id: string
  status: string
  total_rdp: number
  created_at: string
  buyer_name: string | null
  item_count: number | null
}

export const RECENT_ORDERS_LIMIT = 8

export async function getRecentOrdersChecked(): Promise<Section<RecentOrder[]>> {
  return section('pedidos-recientes', async () => {
    const supabase = await createServerClient()
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, total_rdp, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(RECENT_ORDERS_LIMIT)
    if (error || !orders) fail('orders.recent', error)

    const buyerIds = [...new Set(orders.map((o: any) => o.user_id))]
    const orderIds = orders.map((o: any) => o.id)
    const [buyersRes, itemsRes] = orders.length === 0
      ? [{ data: [], error: null }, { data: [], error: null }]
      : await Promise.all([
          supabase.from('users').select('id, full_name').in('id', buyerIds),
          supabase.from('order_items').select('order_id').in('order_id', orderIds),
        ])
    if (buyersRes.error) console.error('[admin/ops] pedidos.compradores', buyersRes.error)
    if (itemsRes.error) console.error('[admin/ops] pedidos.items', itemsRes.error)

    const buyerMap = new Map<string, string>((buyersRes.data ?? []).map((b: any) => [b.id, b.full_name]))
    const itemCount = new Map<string, number>()
    for (const i of itemsRes.data ?? []) itemCount.set((i as any).order_id, (itemCount.get((i as any).order_id) ?? 0) + 1)

    return orders.map((o: any): RecentOrder => ({
      id: o.id,
      status: o.status,
      total_rdp: o.total_rdp,
      created_at: o.created_at,
      buyer_name: buyerMap.get(o.user_id) ?? null,
      // Si no se pudo contar (error) se omite el dato en vez de mostrar 0 artículos.
      item_count: itemsRes.error ? null : (itemCount.get(o.id) ?? 0),
    }))
  })
}

// ─── Pagos registrados ───────────────────────────────────────────────────────

export interface PaymentsSummary {
  totalCount: number
  /** Centavos. */
  totalAmount: number
  byMethod: Record<string, { count: number; amount: number }>
  byStatus: Record<string, { count: number; amount: number }>
  complete: boolean
}

export async function getPaymentsSummary(): Promise<Section<PaymentsSummary>> {
  return section('pagos', async () => {
    const supabase = await createServerClient()
    const { rows, complete } = await readPaged<{ method: string; status: string; amount_rdp: number }>('payments', withCount =>
      supabase
        .from('payments')
        .select('method, status, amount_rdp', withCount ? { count: 'exact' } : undefined)
        .order('created_at', { ascending: false })
        .order('id', { ascending: true }) as unknown as PagedBuilder<{ method: string; status: string; amount_rdp: number }>,
    )
    const byMethod: PaymentsSummary['byMethod'] = {}
    const byStatus: PaymentsSummary['byStatus'] = {}
    for (const p of rows) {
      const m = (byMethod[p.method] ??= { count: 0, amount: 0 })
      m.count += 1
      m.amount += p.amount_rdp ?? 0
      const s = (byStatus[p.status] ??= { count: 0, amount: 0 })
      s.count += 1
      s.amount += p.amount_rdp ?? 0
    }
    return { totalCount: rows.length, totalAmount: sumCentavos(rows.map(r => r.amount_rdp)), byMethod, byStatus, complete }
  })
}

// ─── Carritos abandonados ────────────────────────────────────────────────────

export interface AbandonedCartsData {
  totalUnrecovered: number
  /** Centavos. */
  totalPotentialValue: number
  recent: { id: string; buyer_name: string | null; total_rdp: number }[]
  complete: boolean
}

export async function getAbandonedCartsChecked(): Promise<Section<AbandonedCartsData>> {
  return section('carritos', async () => {
    const supabase = await createServerClient()
    const { rows, total, complete } = await readPaged<{ id: string; user_id: string; total_rdp: number }>('abandoned_carts', withCount =>
      supabase
        .from('abandoned_carts')
        .select('id, user_id, total_rdp', withCount ? { count: 'exact' } : undefined)
        .is('recovered_at', null)
        .order('updated_at', { ascending: false })
        .order('id', { ascending: true }) as unknown as PagedBuilder<{ id: string; user_id: string; total_rdp: number }>,
    )
    const recentRaw = rows.slice(0, 5)
    const buyerIds = [...new Set(recentRaw.map(c => c.user_id))]
    const buyerMap = new Map<string, string>()
    if (buyerIds.length > 0) {
      const { data: buyers, error } = await supabase.from('users').select('id, full_name').in('id', buyerIds)
      if (error) console.error('[admin/ops] carritos.compradores', error)
      for (const b of buyers ?? []) buyerMap.set(b.id, b.full_name)
    }
    return {
      totalUnrecovered: total,
      totalPotentialValue: sumCentavos(rows.map(r => r.total_rdp)),
      recent: recentRaw.map(c => ({ id: c.id, buyer_name: buyerMap.get(c.user_id) ?? null, total_rdp: c.total_rdp })),
      complete,
    }
  })
}

// ─── Proveedores recientes ───────────────────────────────────────────────────

export interface RecentVendor {
  id: string
  business_name: string
  plan: string
  verification_level: number
  onboarding_completed: boolean
  created_at: string
  province_name: string | null
  /** null = no se pudo contar (error o tope de lectura): se muestra «—», nunca 0. */
  product_count: number | null
  /** null = sin dato de ventas reales (vendor_real_stats). */
  real_total_sales: number | null
}

export const RECENT_VENDORS_LIMIT = 6

export async function getRecentVendorsChecked(): Promise<Section<RecentVendor[]>> {
  return section('proveedores-recientes', async () => {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .rpc('admin_list_vendors')
      .select('id, business_name, plan, verification_level, onboarding_completed, created_at, province:provinces_rd(name)')
      .order('created_at', { ascending: false })
      .limit(RECENT_VENDORS_LIMIT)
    if (error || !data) fail('vendors.recent', error)
    const vendors = data as unknown as any[]
    const ids = vendors.map(v => v.id)

    let counts: Map<string, number> | null = null
    let stats: Awaited<ReturnType<typeof getVendorRealStatsBatch>> = {}
    if (ids.length > 0) {
      const [productsRes, statsRes] = await Promise.all([
        supabase.from('products').select('vendor_id').in('vendor_id', ids),
        getVendorRealStatsBatch(ids),
      ])
      stats = statsRes
      // Una sola consulta cubre todos los proveedores. Si llega al límite de 1000 filas, los conteos
      // podrían estar cortados: es mejor «—» que un número equivocado.
      if (!productsRes.error && productsRes.data && productsRes.data.length < PAGE_SIZE) {
        counts = new Map()
        for (const p of productsRes.data as any[]) counts.set(p.vendor_id, (counts.get(p.vendor_id) ?? 0) + 1)
      } else if (productsRes.error) {
        console.error('[admin/ops] proveedores.productos', productsRes.error)
      }
    }

    return vendors.map((v): RecentVendor => ({
      id: v.id,
      business_name: v.business_name,
      plan: v.plan,
      verification_level: v.verification_level,
      onboarding_completed: v.onboarding_completed,
      created_at: v.created_at,
      province_name: v.province?.name ?? null,
      product_count: counts ? (counts.get(v.id) ?? 0) : null,
      real_total_sales: stats[v.id]?.realTotalSales ?? null,
    }))
  })
}

// ─── Disputas (/admin/disputas) ──────────────────────────────────────────────

export interface DisputeListRow {
  id: string
  order_id: string
  vendor_id: string
  reason: string
  description: string
  status: string
  created_at: string
  buyer_name: string
  vendor_name: string
}

export interface DisputesPageData {
  rows: DisputeListRow[]
  total: number
  page: number
  pageCount: number
}

/**
 * Lista de disputas con filtro por estado y paginación (10 por página).
 * Los pendientes salen del más antiguo al más reciente (el más urgente primero); el resto, del más reciente al más antiguo.
 * Con `caseId` se devuelve solo ese caso.
 */
export async function getDisputesPage(opts: { filter: DisputeFilter; page: number; caseId?: string }): Promise<Section<DisputesPageData>> {
  return section('disputas-lista', async () => {
    const supabase = await createServerClient()
    const statuses = DISPUTE_FILTER_STATUSES[opts.filter]
    const pendingFirst = opts.filter === 'pendientes' || opts.filter === 'abiertas' || opts.filter === 'en_revision'
    // Un caso concreto es un único registro: siempre se lee desde el principio (con ?pagina=3 el rango lo saltaría).
    const page = opts.caseId ? 1 : Math.max(1, Math.floor(opts.page) || 1)
    const from = (page - 1) * DISPUTES_PAGE_SIZE

    let query = supabase
      .from('disputes')
      .select('id, order_id, buyer_id, vendor_id, reason, description, status, created_at, vendor:vendors(business_name)', { count: 'exact' })
    if (opts.caseId) query = query.eq('id', opts.caseId)
    else if (statuses) query = query.in('status', [...statuses])
    query = query.order('created_at', { ascending: pendingFirst }).order('id', { ascending: true })
    const { data, error, count } = await query.range(from, from + DISPUTES_PAGE_SIZE - 1)
    if (error || !data || !isValidCount(count)) fail('disputes.page', error)

    const buyerIds = [...new Set(data.map((d: any) => d.buyer_id))]
    const buyerMap = new Map<string, string>()
    if (buyerIds.length > 0) {
      const { data: buyers, error: buyersError } = await supabase.from('users').select('id, full_name').in('id', buyerIds)
      if (buyersError) console.error('[admin/ops] disputas.compradores', buyersError)
      for (const b of buyers ?? []) buyerMap.set(b.id, b.full_name)
    }

    return {
      rows: data.map((d: any): DisputeListRow => ({
        id: d.id,
        order_id: d.order_id,
        vendor_id: d.vendor_id,
        reason: d.reason,
        description: d.description,
        status: d.status,
        created_at: d.created_at,
        buyer_name: buyerMap.get(d.buyer_id) ?? 'Cliente',
        vendor_name: d.vendor?.business_name ?? 'Vendedor',
      })),
      total: count,
      page,
      pageCount: Math.max(1, Math.ceil(count / DISPUTES_PAGE_SIZE)),
    }
  })
}
