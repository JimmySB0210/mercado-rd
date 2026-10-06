'use client'
// ============================================================
// MercadoRD — Ingresos (vendor dashboard)
// Ruta: src/app/dashboard/ingresos/page.tsx
// ============================================================
// Solo lectura de order_items del vendedor (con producto y estado del
// pedido) y, para el nombre del comprador, una consulta aparte a users
// (RLS solo deja verlo con conversación; si no, "Cliente").
// Definiciones (las mismas que ya usaba la página):
//   - Ventas sin cancelaciones: suma de price_rdp x quantity de pedidos
//     que no están cancelados.
//   - Cancelaciones: lo mismo, de pedidos cancelados.
//   - Ventas brutas = ventas sin cancelaciones + cancelaciones.
// No hay comisiones, neto ni exportación: no existen en el sistema.
// Los porcentajes "vs. período anterior" aparecen solo si el periodo
// anterior tiene ventas. El filtro de tiempo recalcula sobre los pedidos
// ya cargados.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownRight, ArrowUpRight, BarChart3, Minus, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { RevenueChartLoader } from '@/components/vendor/RevenueChartLoader'
import { formatPrice } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPctChange } from '@/lib/formatPctChange'

const DAY_MS = 86_400_000
const RECENT_ACTIVITY_LIMIT = 8
const TOP_PRODUCTS_LIMIT = 5

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6',
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FEF9C3', color: '#713F12' },
  confirmed: { bg: '#DBEAFE', color: '#1E3A8A' },
  preparing: { bg: '#FFEDD5', color: '#9A3412' },
  shipped: { bg: '#EDE9FE', color: '#5B21B6' },
  delivered: { bg: '#DCFCE7', color: '#166534' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
}

type StatusKey = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
const STATUS_LABEL_KEY = {
  pending: 'incomeStatusPending',
  confirmed: 'incomeStatusConfirmed',
  preparing: 'incomeStatusPreparing',
  shipped: 'incomeStatusShipped',
  delivered: 'incomeStatusDelivered',
  cancelled: 'incomeStatusCancelled',
} as const

const RANGES = [
  { days: 7, labelKey: 'incomeRange7' },
  { days: 30, labelKey: 'incomeRange30' },
  { days: 90, labelKey: 'incomeRange90' },
  { days: 180, labelKey: 'incomeRange180' },
  { days: 365, labelKey: 'incomeRange365' },
] as const

type RangeDays = (typeof RANGES)[number]['days']

interface IncomeItem {
  id: string
  order_id: string
  created_at: string
  price_rdp: number
  quantity: number
  product_id: string
  product_name: string
  product_image: string | null
  status: string
  user_id: string | null
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function buildSeries(items: IncomeItem[], start: number, now: number, days: number, locale: string) {
  const step = days <= 30 ? DAY_MS : days <= 90 ? 7 * DAY_MS : 30 * DAY_MS
  const count = Math.ceil((now - start) / step)
  const totals = new Array<number>(count).fill(0)
  items.forEach(i => {
    const ts = Date.parse(i.created_at)
    if (ts < start || ts > now) return
    const idx = Math.min(count - 1, Math.floor((ts - start) / step))
    totals[idx] += i.price_rdp * i.quantity
  })
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  return totals.map((revenue, idx) => ({ month: fmt.format(new Date(start + idx * step)), revenue }))
}

export default function VendorIncomePage() {
  const { t, language } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<IncomeItem[]>([])
  const [buyerNames, setBuyerNames] = useState<Record<string, string>>({})
  const [rangeDays, setRangeDays] = useState<RangeDays>(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/ingresos')
        return
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, order_id, created_at, price_rdp, quantity, product_id, product:products(id, name, images), order:orders(status, user_id)')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      const mapped: IncomeItem[] = (orderItems ?? []).map((i: any) => ({
        id: i.id,
        order_id: i.order_id,
        created_at: i.created_at,
        price_rdp: i.price_rdp,
        quantity: i.quantity,
        product_id: i.product_id,
        product_name: i.product?.name ?? 'Producto',
        product_image: i.product?.images?.[0] ?? null,
        status: i.order?.status ?? 'pending',
        user_id: i.order?.user_id ?? null,
      }))

      const userIds = [...new Set(mapped.map(i => i.user_id).filter((id): id is string => !!id))]
      if (userIds.length > 0) {
        const { data: buyers } = await supabase.from('users').select('id, full_name').in('id', userIds)
        setBuyerNames(Object.fromEntries((buyers ?? []).map(b => [b.id, b.full_name])))
      }

      setItems(mapped)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const now = Date.now()
  const start = now - rangeDays * DAY_MS
  const prevStart = now - 2 * rangeDays * DAY_MS

  const valid = useMemo(() => items.filter(i => i.status !== 'cancelled'), [items])
  const cancelled = useMemo(() => items.filter(i => i.status === 'cancelled'), [items])

  const inRange = (list: IncomeItem[], from: number, to: number) =>
    list.filter(i => { const ts = Date.parse(i.created_at); return ts >= from && ts <= to })

  const cur = useMemo(() => {
    const v = inRange(valid, start, now)
    const c = inRange(cancelled, start, now)
    const sales = v.reduce((acc, i) => acc + i.price_rdp * i.quantity, 0)
    const units = v.reduce((acc, i) => acc + i.quantity, 0)
    const orders = new Set(v.map(i => i.order_id)).size
    const lost = c.reduce((acc, i) => acc + i.price_rdp * i.quantity, 0)
    const cancelledOrders = new Set(c.map(i => i.order_id)).size
    return { sales, units, orders, lost, cancelledOrders, ticket: orders > 0 ? Math.round(sales / orders) : null }
  }, [valid, cancelled, start, now])

  const prev = useMemo(() => {
    const v = inRange(valid, prevStart, start)
    const sales = v.reduce((acc, i) => acc + i.price_rdp * i.quantity, 0)
    const units = v.reduce((acc, i) => acc + i.quantity, 0)
    const orders = new Set(v.map(i => i.order_id)).size
    return { sales, units, ticket: orders > 0 ? Math.round(sales / orders) : null }
  }, [valid, prevStart, start])

  const series = useMemo(() => buildSeries(valid, start, now, rangeDays, language), [valid, start, now, rangeDays, language])

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; image: string | null; units: number; revenue: number }>()
    inRange(valid, start, now).forEach(i => {
      const row = map.get(i.product_id) ?? { name: i.product_name, image: i.product_image, units: 0, revenue: 0 }
      row.units += i.quantity
      row.revenue += i.price_rdp * i.quantity
      map.set(i.product_id, row)
    })
    // Mismo criterio que el resumen del dashboard: unidades vendidas, con
    // el ingreso como desempate.
    return [...map.values()]
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, TOP_PRODUCTS_LIMIT)
  }, [valid, start, now])

  const recentOrders = useMemo(() => {
    const map = new Map<string, { order_id: string; latest: string; status: string; user_id: string | null; names: string[]; amount: number }>()
    items.forEach(i => {
      const row = map.get(i.order_id) ?? { order_id: i.order_id, latest: i.created_at, status: i.status, user_id: i.user_id, names: [], amount: 0 }
      if (!row.names.includes(i.product_name)) row.names.push(i.product_name)
      row.amount += i.price_rdp * i.quantity
      if (i.created_at > row.latest) row.latest = i.created_at
      map.set(i.order_id, row)
    })
    return [...map.values()].sort((a, b) => b.latest.localeCompare(a.latest)).slice(0, RECENT_ACTIVITY_LIMIT)
  }, [items])

  const hasPeriodSales = cur.sales > 0
  const salesDelta = pctChange(cur.sales, prev.sales)
  const unitsDelta = pctChange(cur.units, prev.units)
  const ticketDelta = cur.ticket != null && prev.ticket != null ? pctChange(cur.ticket, prev.ticket) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t('loadingGeneric')}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <main style={{ padding: 24, background: '#F7F9FB', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', color: '#131A18', margin: 0 }}>{t('incomePageTitle')}</h1>
            <p style={{ color: '#667085', fontSize: 'var(--text-ui)', margin: '4px 0 0' }}>{t('incomePageSub')}</p>
          </div>
          <div role="group" aria-label={t('incomeRangeLabel')} className="scroll-hide-x" style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 999, padding: 3, maxWidth: '100%', overflowX: 'auto' }}>
            {RANGES.map(r => {
              const active = rangeDays === r.days
              return (
                <button
                  key={r.days}
                  type="button"
                  onClick={() => setRangeDays(r.days)}
                  aria-pressed={active}
                  style={{
                    flexShrink: 0, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    padding: '6px 12px', borderRadius: 999, fontSize: 'var(--text-caption)', fontWeight: 600,
                    background: active ? 'var(--dashboard-blue)' : 'transparent', color: active ? '#fff' : '#475467',
                  }}
                >
                  {t(r.labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ ...cardStyle, padding: 28, maxWidth: 560, margin: '0 auto', display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 999, background: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={24} color="var(--dashboard-blue)" />
            </div>
            <p style={{ color: '#131A18', fontSize: 'var(--text-body)', fontWeight: 700, margin: 0 }}>{t('incomeEmptyTitle')}</p>
            <p style={{ color: '#667085', fontSize: 'var(--text-small)', maxWidth: 420, margin: 0 }}>{t('incomeEmptyText')}</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
              <KpiCard
                label={t('incomeKpiSales')}
                value={formatPrice(cur.sales)}
                delta={salesDelta}
                deltaLabel={t('incomeVsPrevious')}
              />
              <KpiCard
                label={t('unitsSoldLabel')}
                value={String(cur.units)}
                delta={unitsDelta}
                deltaLabel={t('incomeVsPrevious')}
              />
              <KpiCard
                label={t('incomeKpiTicket')}
                value={cur.ticket != null ? formatPrice(cur.ticket) : '—'}
                delta={ticketDelta}
                deltaLabel={t('incomeVsPrevious')}
              />
              <KpiCard
                label={t('incomeKpiCancelled')}
                value={formatPrice(cur.lost)}
                sub={cur.cancelledOrders === 1 ? t('incomeOrderOne') : t('incomeOrdersCount', { count: cur.cancelledOrders })}
                tone="red"
              />
            </div>

            {/* Gráfico y productos */}
            <div className="income-row-top" style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              <div style={{ ...cardStyle, padding: 16, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18', marginBottom: 8 }}>{t('incomeChartTitle')}</div>
                {hasPeriodSales ? (
                  <RevenueChartLoader data={series} height={230} />
                ) : (
                  <div style={{ height: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', padding: 12 }}>
                    <BarChart3 size={22} color="#98A2B3" />
                    <p style={{ color: '#344054', fontSize: 'var(--text-small)', fontWeight: 600, margin: 0 }}>{t('incomeChartEmptyTitle')}</p>
                    <p style={{ color: '#667085', fontSize: 'var(--text-caption)', maxWidth: 380, margin: 0 }}>{t('incomeChartEmptyText')}</p>
                  </div>
                )}
              </div>

              <div style={{ ...cardStyle, padding: 16, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18' }}>{t('incomeTopProductsTitle')}</div>
                </div>
                {topProducts.length === 0 ? (
                  <div style={{ padding: '24px 4px', textAlign: 'center', color: '#667085', fontSize: 'var(--text-caption)' }}>{t('incomeTopProductsEmpty')}</div>
                ) : (
                  <div style={{ display: 'grid', gap: 2 }}>
                    {topProducts.map((p, idx) => (
                      <div key={`${p.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: idx > 0 ? '1px solid #F2F4F7' : 'none' }}>
                        <span style={{ width: 20, fontSize: 'var(--text-caption)', fontWeight: 700, color: '#667085' }}>{idx + 1}</span>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EEF2F6', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : <Package size={16} color="#98A2B3" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: '#344054' }}>{t('soldCountLabel', { count: p.units })}</div>
                        </div>
                        <span style={{ fontSize: 'var(--text-caption)', color: '#667085', whiteSpace: 'nowrap' }}>{formatPrice(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen y actividad */}
            <div className="income-row-bottom" style={{ display: 'grid', gap: 12 }}>
              <div style={{ ...cardStyle, padding: 16, alignSelf: 'start' }}>
                <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18', marginBottom: 10 }}>{t('incomeSummaryTitle')}</div>
                <SummaryRow label={t('incomeSummaryGross')} value={formatPrice(cur.sales + cur.lost)} />
                <SummaryRow label={t('incomeSummaryCancelled')} value={`-${formatPrice(cur.lost)}`} tone="red" />
                <div style={{ borderTop: '1px solid #EEF2F6', marginTop: 8, paddingTop: 8 }}>
                  <SummaryRow label={t('incomeSummaryNet')} value={formatPrice(cur.sales)} bold />
                </div>
                <p style={{ color: '#98A2B3', fontSize: 'var(--text-badge)', margin: '10px 0 0' }}>{t('incomeSummaryNote')}</p>
              </div>

              <div style={{ ...cardStyle, padding: 16, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18', marginBottom: 10 }}>{t('incomeActivityTitle')}</div>
                {recentOrders.length === 0 ? (
                  <div style={{ padding: '24px 4px', textAlign: 'center', color: '#667085', fontSize: 'var(--text-caption)' }}>{t('incomeActivityEmpty')}</div>
                ) : (
                  <>
                    <div className="income-activity-table" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#F9FAFB' }}>
                            {[t('tableDate'), t('tableOrder'), t('tableClient'), t('tableProducts'), t('tableAmount'), t('tableStatus')].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 'var(--text-badge)', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600, borderBottom: '1px solid #EEF2F6', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map(o => <ActivityRow key={o.order_id} o={o} buyerNames={buyerNames} language={language} t={t} />)}
                        </tbody>
                      </table>
                    </div>
                    <div className="income-activity-cards" style={{ display: 'none', gap: 8 }}>
                      {recentOrders.map(o => (
                        <div key={o.order_id} style={{ border: '1px solid #EEF2F6', borderRadius: 10, padding: 10, display: 'grid', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: 'var(--dashboard-blue)' }}>#RD-{o.order_id.split('-')[0].toUpperCase()}</span>
                            <StatusBadge status={o.status} t={t} />
                          </div>
                          <div style={{ fontSize: 'var(--text-caption)', color: '#667085' }}>{formatDate(o.latest, language, { day: 'numeric', month: 'short', year: 'numeric' })} · {o.user_id && buyerNames[o.user_id] ? buyerNames[o.user_id] : t('reviewsClientFallback')}</div>
                          <div style={{ fontSize: 'var(--text-caption)', color: '#344054', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.names.join(', ')}</div>
                          <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18' }}>{formatPrice(o.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <style>{`
          .income-row-top { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
          .income-row-bottom { grid-template-columns: minmax(240px, 300px) minmax(0, 1fr); }
          @media (max-width: 900px) {
            .income-row-top, .income-row-bottom { grid-template-columns: minmax(0, 1fr) !important; }
          }
          @media (max-width: 760px) {
            .income-activity-table { display: none !important; }
            .income-activity-cards { display: grid !important; }
          }
        `}</style>
      </main>
    </div>
  )
}

function KpiCard({ label, value, delta, deltaLabel, sub, tone }: {
  label: string
  value: string
  delta?: number | null
  deltaLabel?: string
  sub?: string
  tone?: 'red'
}) {
  const change = delta != null ? formatPctChange(delta) : null
  const colorByDirection = { up: '#0B7A4B', down: '#B42318', flat: '#667085' } as const
  return (
    <div style={{ ...cardStyle, padding: 14 }}>
      <div style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, lineHeight: 'var(--leading-price)', color: tone === 'red' ? '#B42318' : '#131A18' }}>{value}</div>
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption)', fontWeight: 600, color: colorByDirection[change.direction], marginTop: 4, flexWrap: 'wrap' }}>
          {change.direction === 'up' && <ArrowUpRight size={14} />}
          {change.direction === 'down' && <ArrowDownRight size={14} />}
          {change.direction === 'flat' && <Minus size={14} />}
          {change.text}
          <span style={{ color: '#667085', fontWeight: 500 }}>{deltaLabel}</span>
        </div>
      )}
      {sub && <div style={{ fontSize: 'var(--text-caption)', color: '#667085', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SummaryRow({ label, value, tone, bold }: { label: string; value: string; tone?: 'red'; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <span style={{ fontSize: 'var(--text-caption)', color: '#475467', fontWeight: bold ? 700 : 500 }}>{label}</span>
      <span style={{ fontSize: bold ? 'var(--text-small)' : 'var(--text-caption)', fontWeight: 700, color: tone === 'red' ? '#B42318' : '#131A18', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function StatusBadge({ status, t }: { status: string; t: (key: any) => string }) {
  const key = (status in STATUS_LABEL_KEY ? status : 'pending') as StatusKey
  const style = STATUS_STYLE[key]
  return (
    <span style={{ background: style.bg, color: style.color, fontSize: 'var(--text-badge)', fontWeight: 600, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {t(STATUS_LABEL_KEY[key])}
    </span>
  )
}

function ActivityRow({ o, buyerNames, language, t }: {
  o: { order_id: string; latest: string; status: string; user_id: string | null; names: string[]; amount: number }
  buyerNames: Record<string, string>
  language: string
  t: (key: any, params?: Record<string, string | number>) => string
}) {
  const buyer = o.user_id && buyerNames[o.user_id] ? buyerNames[o.user_id] : t('reviewsClientFallback')
  return (
    <tr style={{ borderBottom: '1px solid #F2F4F7' }}>
      <td style={{ padding: '9px 10px', fontSize: 'var(--text-caption)', color: '#475467', whiteSpace: 'nowrap' }}>{formatDate(o.latest, language as any, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
      <td style={{ padding: '9px 10px', fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--dashboard-blue)', whiteSpace: 'nowrap' }}>#RD-{o.order_id.split('-')[0].toUpperCase()}</td>
      <td style={{ padding: '9px 10px', fontSize: 'var(--text-caption)', color: '#344054', whiteSpace: 'nowrap' }}>{buyer}</td>
      <td style={{ padding: '9px 10px', fontSize: 'var(--text-caption)', color: '#344054', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.names.join(', ')}</td>
      <td style={{ padding: '9px 10px', fontSize: 'var(--text-caption)', fontWeight: 700, color: '#131A18', whiteSpace: 'nowrap' }}>{formatPrice(o.amount)}</td>
      <td style={{ padding: '9px 10px' }}><StatusBadge status={o.status} t={t} /></td>
    </tr>
  )
}
