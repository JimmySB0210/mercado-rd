'use client'
// ============================================================
// MercadoRD — Pedidos (vendor dashboard)
// Ruta: src/app/dashboard/pedidos/page.tsx
// ============================================================
// La carga de datos (order_items → orders → users) no cambió: sin
// .limit() ni paginación, así que los contadores son el total real.
// Búsqueda, chips y orden operan sobre el arreglo ya cargado.
// ============================================================

import { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { OrderStatusSelect } from '@/components/vendor/OrderStatusSelect'
import { TrackingForm } from '@/components/vendor/TrackingForm'
import { DeliveryOtpForm } from '@/components/vendor/DeliveryOtpForm'
import { formatPrice } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'

interface OrderRow {
  order_id: string
  status: string
  delivery_address: string
  payment_method: string
  notes: string | null
  created_at: string
  tracking_number: string | null
  courier: string | null
  province_name: string | null
  buyer_name: string
  buyer_phone: string | null
  recipient_name: string | null
  recipient_phone: string | null
  items: {
    id: string
    product_name: string
    product_image: string | null
    quantity: number
    price_rdp: number
    size: string | null
    color: string | null
  }[]
  vendor_subtotal_rdp: number
}

const STATUS_CHIPS: { value: string; labelKey: keyof DashboardDict }[] = [
  { value: 'all', labelKey: 'orderChipAll' },
  { value: 'pending', labelKey: 'orderChipPending' },
  { value: 'confirmed', labelKey: 'orderChipConfirmed' },
  { value: 'preparing', labelKey: 'orderChipPreparing' },
  { value: 'shipped', labelKey: 'orderChipShipped' },
  { value: 'delivered', labelKey: 'orderChipDelivered' },
  { value: 'cancelled', labelKey: 'orderChipCancelled' },
]

export default function VendorOrdersPage() {
  const { t, language } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/pedidos')
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

      // Mismo patrón de 3 consultas que ya sabemos que funciona en getVendorOrders
      const { data: items } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, price_rdp, size, color, product:products(name, images)')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      if (!items || items.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      const orderIds = [...new Set(items.map((i: any) => i.order_id))]

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, status, delivery_address, payment_method, notes, created_at, tracking_number, courier, user_id, recipient_name, recipient_phone, province:provinces_rd(name)')
        .in('id', orderIds)
        .order('created_at', { ascending: false })

      if (!ordersData) {
        setOrders([])
        setLoading(false)
        return
      }

      const buyerIds = [...new Set(ordersData.map((o: any) => o.user_id))]
      const { data: buyers } = await supabase
        .from('users')
        .select('id, full_name, phone')
        .in('id', buyerIds)

      const buyerMap = new Map((buyers ?? []).map((b: any) => [b.id, b]))

      const combined: OrderRow[] = ordersData.map((order: any) => {
        const orderItems = items
          .filter((i: any) => i.order_id === order.id)
          .map((i: any) => ({
            id: i.id,
            product_name: i.product?.name ?? 'Producto',
            product_image: i.product?.images?.[0] ?? null,
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
          notes: order.notes,
          created_at: order.created_at,
          tracking_number: order.tracking_number,
          courier: order.courier,
          province_name: order.province?.name ?? null,
          buyer_name: buyer?.full_name ?? 'Cliente',
          buyer_phone: buyer?.phone ?? null,
          recipient_name: order.recipient_name ?? null,
          recipient_phone: order.recipient_phone ?? null,
          items: orderItems,
          vendor_subtotal_rdp: orderItems.reduce((acc: number, i: any) => acc + i.price_rdp * i.quantity, 0),
        }
      })

      setOrders(combined)
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const countByStatus = (status: string) => status === 'all' ? orders.length : orders.filter(o => o.status === status).length

  const q = search.trim().toLowerCase()
  const filteredOrders = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (!q) return true
      const shortId = o.order_id.split('-')[0].toLowerCase()
      return shortId.includes(q.replace(/^#?rd-?/, ''))
        || o.buyer_name.toLowerCase().includes(q)
        || o.items.some(i => i.product_name.toLowerCase().includes(q))
    })

  const PAYMENT_LABELS: Record<string, string> = {
    azul: t('paymentAzul'), cardnet: t('paymentCardnet'), transfer: t('paymentTransfer'), cash: t('paymentCash'),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t('loadingOrders')}</div>
      </div>
    )
  }

  const renderDetail = (order: OrderRow) => (
    <div style={{ borderTop: '1px solid #EEF2F6', padding: '14px 16px', background: '#FAFBFC' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', marginBottom: 4 }}>{t('deliveryLabel')}</p>
          <p style={{ fontSize: 'var(--text-small)', color: '#333' }}>{order.delivery_address}</p>
          <p style={{ fontSize: 'var(--text-caption)', color: '#818F98' }}>{order.province_name}</p>
        </div>
        <div>
          <p style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', marginBottom: 4 }}>{t('contactLabel')}</p>
          <p style={{ fontSize: 'var(--text-small)', color: '#333' }}>{order.buyer_phone || t('notAvailable')}</p>
          <p style={{ fontSize: 'var(--text-caption)', color: '#818F98' }}>{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
        </div>
      </div>

      {order.recipient_name && (
        <div style={{ marginBottom: 12, padding: 10, background: '#EFF6FF', borderRadius: 8, fontSize: 'var(--text-caption)', color: '#1e3a8a' }}>
          👤 {t('recipientBanner', { buyer: order.buyer_name, recipient: order.recipient_name, phone: order.recipient_phone ?? t('notAvailable') })}
        </div>
      )}

      {order.notes && (
        <div style={{ marginBottom: 12, padding: 10, background: '#FFF8E1', borderRadius: 8, fontSize: 'var(--text-caption)', color: '#5D4037' }}>
          📝 {order.notes}
        </div>
      )}

      <p style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', marginBottom: 8 }}>
        {t('orderProductsCount', { count: order.items.length })}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {order.items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', padding: 8, borderRadius: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 6, background: BRAND.bg, flexShrink: 0, overflow: 'hidden' }}>
              {item.product_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#111' }}>{item.product_name}</p>
              <p style={{ fontSize: 'var(--text-caption)', color: '#818F98' }}>
                x{item.quantity}
                {item.size && ` · ${item.size}`}
                {item.color && ` · ${item.color}`}
              </p>
            </div>
            <span style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#111' }}>
              {formatPrice(item.price_rdp * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {order.status === 'confirmed' && (
        <TrackingForm
          orderId={order.order_id}
          initialTracking={order.tracking_number}
          initialCourier={order.courier}
        />
      )}

      {order.status === 'shipped' && (
        <DeliveryOtpForm orderId={order.order_id} />
      )}
    </div>
  )

  const productsSummary = (order: OrderRow) => {
    const first = order.items[0]
    if (!first) return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: BRAND.bg, flexShrink: 0, overflow: 'hidden' }}>
          {first.product_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={first.product_image} alt={first.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {first.product_name} <span style={{ color: '#818F98', fontWeight: 500 }}>x{first.quantity}</span>
          </p>
          {order.items.length > 1 && (
            <p style={{ fontSize: 'var(--text-caption)', color: '#818F98' }}>{t('productSummaryMore', { count: order.items.length - 1 })}</p>
          )}
        </div>
      </div>
    )
  }

  const shortIdOf = (order: OrderRow) => order.order_id.split('-')[0].toUpperCase()

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <div style={{ padding: 24, background: '#f5f5f5', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, marginBottom: 2, color: '#131A18', lineHeight: 'var(--leading-h1)' }}>{t('ordersPageTitle')}</h1>
            <p style={{ color: '#818F98', fontSize: 'var(--text-body)' }}>
              {orders.length === 1 ? t('orderCountOne', { count: orders.length }) : t('orderCountOther', { count: orders.length })}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('ordersSearchPlaceholder')}
          style={{ width: '100%', border: '1px solid #E0E4E9', borderRadius: 8, padding: '9px 12px', fontSize: 'var(--text-ui)', background: '#fff', color: '#131A18', marginBottom: 12, boxSizing: 'border-box' }}
        />

        {/* Chips de estado con contadores reales */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {STATUS_CHIPS.map(f => {
            const active = filter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: '6px 12px', borderRadius: 999, fontSize: 'var(--text-ui)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                  border: `1px solid ${active ? 'var(--dashboard-blue)' : '#E0E4E9'}`,
                  background: active ? 'var(--dashboard-blue)' : '#fff',
                  color: active ? '#fff' : '#3D5361', cursor: 'pointer',
                }}
              >
                {t(f.labelKey)} <span style={{ opacity: 0.8, marginLeft: 4 }}>{countByStatus(f.value)}</span>
              </button>
            )
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid #EEF2F6' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <p style={{ color: '#818F98', fontSize: 'var(--text-small)' }}>
              {orders.length === 0
                ? t('ordersEmptyAll')
                : q
                  ? t('noOrdersMatchSearch')
                  : t('ordersEmptyFiltered')}
            </p>
          </div>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden md:block" style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF2F6', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-small)' }}>
                <thead>
                  <tr style={{ background: '#FAFBFC' }}>
                    {[t('tableOrder'), t('tableClient'), t('tableProducts'), t('tableDate'), t('tableProvince'), t('tableAmount'), t('tableStatus'), t('tableActions')].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 500, borderBottom: '1px solid #EEF2F6', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const isExpanded = expandedId === order.order_id
                    const date = formatDate(order.created_at, language, { day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <Fragment key={order.order_id}>
                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #F3F5F7', verticalAlign: 'middle' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--dashboard-blue)', fontWeight: 700, whiteSpace: 'nowrap' }}>#RD-{shortIdOf(order)}</td>
                          <td style={{ padding: '10px 12px', color: '#3D5361', whiteSpace: 'nowrap' }}>{order.buyer_name}</td>
                          <td style={{ padding: '10px 12px', maxWidth: 260 }}>{productsSummary(order)}</td>
                          <td style={{ padding: '10px 12px', color: '#3D5361', whiteSpace: 'nowrap' }}>{date}</td>
                          <td style={{ padding: '10px 12px', color: '#3D5361', whiteSpace: 'nowrap' }}>{order.province_name ?? '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#131A18', whiteSpace: 'nowrap' }}>{formatPrice(order.vendor_subtotal_rdp)}</td>
                          <td style={{ padding: '10px 12px' }}><OrderStatusSelect orderId={order.order_id} currentStatus={order.status} /></td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                              style={{ background: 'none', border: 'none', color: 'var(--dashboard-blue)', fontWeight: 600, fontSize: 'var(--text-ui)', cursor: 'pointer', padding: 0 }}
                            >
                              {t('viewOrderCta')}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ borderBottom: '1px solid #F3F5F7' }}>
                            <td colSpan={8} style={{ padding: 0 }}>{renderDetail(order)}</td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <div className="md:hidden flex flex-col gap-2.5">
              {filteredOrders.map(order => {
                const isExpanded = expandedId === order.order_id
                const date = formatDate(order.created_at, language, { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <div key={order.order_id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF2F6', overflow: 'hidden' }}>
                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--dashboard-blue)', fontWeight: 700, fontSize: 'var(--text-small)' }}>#RD-{shortIdOf(order)}</span>
                        <span style={{ fontSize: 'var(--text-caption)', color: '#818F98' }}>{date}</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-small)', color: '#3D5361' }}>{order.buyer_name}{order.province_name ? ` · ${order.province_name}` : ''}</div>
                      {productsSummary(order)}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-ui)', color: '#131A18' }}>{formatPrice(order.vendor_subtotal_rdp)}</span>
                        <OrderStatusSelect orderId={order.order_id} currentStatus={order.status} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--dashboard-blue)', fontWeight: 600, fontSize: 'var(--text-ui)', cursor: 'pointer', padding: 0 }}
                      >
                        {t('viewOrderCta')}
                      </button>
                    </div>
                    {isExpanded && renderDetail(order)}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
