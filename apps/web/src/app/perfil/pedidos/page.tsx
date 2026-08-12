'use client'
// ============================================================
// MercadoRD — Mis Pedidos (comprador)
// Ruta: src/app/perfil/pedidos/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { ReviewModal } from '@/components/product/ReviewModal'
import { DisputeModal } from '@/components/order/DisputeModal'
import { OrderTimeline } from '@/components/shop/OrderTimeline'
import { formatPrice } from '@/types/database.types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'

interface OrderItem {
  id: string
  product_id: string
  vendor_id: string
  product_name: string
  product_image: string | null
  vendor_name: string
  quantity: number
  price_rdp: number
  size: string | null
  color: string | null
  category_id: number | null
  hasReview: boolean
}

interface Order {
  id: string
  status: string
  created_at: string
  total_rdp: number
  tracking_number: string | null
  courier: string | null
  items: OrderItem[]
  disputeId: string | null
  diasDesdeEntrega: number | null
  tieneProductoAlimento: boolean
}

const FOOD_CATEGORY_ID = 3 // Alimentos & Bebidas
const REFUND_WINDOW_DAYS = 7

// El texto del label se resuelve en render vía t('orderStatus.<status>') —
// aquí solo quedan los colores, que no dependen del idioma.
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF9C3', text: '#713f12' },
  confirmed: { bg: '#DBEAFE', text: '#1e3a8a' },
  preparing: { bg: '#E0E7FF', text: '#3730a3' },
  shipped:   { bg: '#DBEAFE', text: '#1e3a8a' },
  delivered: { bg: '#DCFCE7', text: '#166534' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
}

export default function MyOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useTranslation('profile')

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewTarget, setReviewTarget] = useState<{ orderId: string; item: OrderItem } | null>(null)
  const [disputeTarget, setDisputeTarget] = useState<{
    orderId: string
    vendorId: string
    refundEligible: boolean
    refundIneligibleReason: string | null
  } | null>(null)
  const [expandedTimelines, setExpandedTimelines] = useState<Set<string>>(new Set())

  const toggleTimeline = (orderId: string) => {
    setExpandedTimelines(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/perfil/pedidos')
      return
    }

    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, status, created_at, total_rdp, tracking_number, courier')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!ordersData || ordersData.length === 0) {
      setOrders([])
      setLoading(false)
      return
    }

    const orderIds = ordersData.map(o => o.id)

    const { data: items } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, vendor_id, quantity, price_rdp, size, color, product:products(name, images, category_id), vendor:vendors(business_name)')
      .in('order_id', orderIds)

    // Fecha en que cada pedido pasó a 'delivered' — usada para la ventana
    // de 7 días de devolución (mismo criterio que el trigger de Postgres)
    const { data: deliveredHistory } = await supabase
      .from('order_status_history')
      .select('order_id, created_at')
      .in('order_id', orderIds)
      .eq('status', 'delivered')
      .order('created_at', { ascending: true })

    const deliveredAtMap = new Map<string, string>()
    for (const row of deliveredHistory ?? []) {
      if (!deliveredAtMap.has(row.order_id)) deliveredAtMap.set(row.order_id, row.created_at)
    }

    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('product_id, order_id')
      .eq('user_id', user.id)

    const reviewKey = (orderId: string, productId: string) => `${orderId}-${productId}`
    const reviewedSet = new Set(
      (existingReviews ?? []).map(r => reviewKey(r.order_id, r.product_id))
    )

    const { data: existingDisputes } = await supabase
      .from('disputes')
      .select('id, order_id')
      .eq('buyer_id', user.id)
      .in('order_id', orderIds)

    const disputeMap = new Map((existingDisputes ?? []).map(d => [d.order_id, d.id]))

    const combined: Order[] = ordersData.map(order => {
      const orderItems = (items ?? [])
        .filter((i: any) => i.order_id === order.id)
        .map((i: any) => ({
          id: i.id,
          product_id: i.product_id,
          vendor_id: i.vendor_id,
          product_name: i.product?.name ?? 'Producto',
          product_image: i.product?.images?.[0] ?? null,
          vendor_name: i.vendor?.business_name ?? 'Vendedor',
          quantity: i.quantity,
          price_rdp: i.price_rdp,
          size: i.size,
          color: i.color,
          category_id: i.product?.category_id ?? null,
          hasReview: reviewedSet.has(reviewKey(order.id, i.product_id)),
        }))

      const deliveredAt = deliveredAtMap.get(order.id)
      const diasDesdeEntrega = deliveredAt
        ? Math.floor((Date.now() - new Date(deliveredAt).getTime()) / (24 * 60 * 60 * 1000))
        : null

      return {
        id: order.id,
        status: order.status,
        created_at: order.created_at,
        total_rdp: order.total_rdp,
        tracking_number: order.tracking_number,
        courier: order.courier,
        disputeId: disputeMap.get(order.id) ?? null,
        items: orderItems,
        diasDesdeEntrega,
        tieneProductoAlimento: orderItems.some(i => i.category_id === FOOD_CATEGORY_ID),
      }
    })

    setOrders(combined)
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">{t('loadingOrders')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('ordersPageTitle')}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {orders.length} {orders.length === 1 ? t('orderSingular') : t('orderPlural')}
        </p>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 mb-4">{t('emptyOrdersMessage')}</p>
            <a href="/" className="text-blue-600 underline text-sm">{t('exploreProductsLink')}</a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const shortId = order.id.split('-')[0].toUpperCase()
              const knownStatus = order.status in STATUS_COLORS ? order.status : 'pending'
              const statusColors = STATUS_COLORS[knownStatus]
              const statusLabel = t(`orderStatus.${knownStatus}` as 'orderStatus.pending')
              const date = formatDate(order.created_at, language, { day: 'numeric', month: 'long', year: 'numeric' })

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 flex-wrap gap-2">
                    <div>
                      <span style={{ color: BRAND.blue }} className="font-bold text-sm">#RD-{shortId}</span>
                      <span className="text-xs text-gray-400 ml-3">{date}</span>
                    </div>
                    <span
                      style={{ background: statusColors.bg, color: statusColors.text }}
                      className="text-xs font-bold px-3 py-1 rounded-full"
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden">
                          {item.product_image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-400">
                            {item.vendor_name} · x{item.quantity}
                            {item.size && ` · ${item.size}`}
                            {item.color && ` · ${item.color}`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900 mb-1">
                            {formatPrice(item.price_rdp * item.quantity)}
                          </p>
                          {order.status === 'delivered' && (
                            item.hasReview ? (
                              <span className="text-xs text-green-600">{t('reviewedLabel')}</span>
                            ) : (
                              <button
                                onClick={() => setReviewTarget({ orderId: order.id, item })}
                                style={{ color: BRAND.blue }}
                                className="text-xs font-semibold underline bg-transparent border-none cursor-pointer"
                              >
                                {t('leaveReviewButton')}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(order.status === 'shipped' || order.status === 'delivered') && order.tracking_number && (
                    <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
                      <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>
                        {t('trackingNumberLabel', { number: order.tracking_number })}
                      </p>
                      {order.courier && (
                        <p className="text-xs text-gray-500 mt-0.5">{order.courier}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {t('trackingHint')}
                      </p>
                    </div>
                  )}

                  {order.status === 'shipped' && (
                    <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                      <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>
                        {t('deliveryOtpSentTitle')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('deliveryOtpSentHint')}
                      </p>
                    </div>
                  )}

                  <div className="px-5 border-t border-gray-50">
                    <button
                      onClick={() => toggleTimeline(order.id)}
                      style={{ color: BRAND.gray }}
                      className="text-xs font-semibold bg-transparent border-none cursor-pointer py-2.5"
                    >
                      {expandedTimelines.has(order.id) ? t('hideTimelineButton') : t('showTimelineButton')}
                    </button>
                    {expandedTimelines.has(order.id) && <OrderTimeline orderId={order.id} />}
                  </div>

                  <div className="px-5 py-3 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs text-gray-500">{t('orderTotalLabel')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{formatPrice(order.total_rdp)}</span>
                      {(order.status === 'delivered' || order.status === 'shipped') && (
                        order.disputeId ? (
                          <a
                            href={`/perfil/disputas/${order.disputeId}`}
                            className="text-xs font-semibold underline"
                            style={{ color: BRAND.gray }}
                          >
                            {t('viewDisputeLink')}
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              // Prioridad: alimentos no elegibles es una restricción
                              // permanente, la de 7 días es solo temporal
                              const refundIneligibleReason = order.tieneProductoAlimento
                                ? t('refundIneligibleFood')
                                : !(order.status === 'delivered' && order.diasDesdeEntrega !== null && order.diasDesdeEntrega <= REFUND_WINDOW_DAYS)
                                  ? t('refundIneligibleWindowExpired')
                                  : null

                              setDisputeTarget({
                                orderId: order.id,
                                vendorId: order.items[0]?.vendor_id,
                                refundEligible: refundIneligibleReason === null,
                                refundIneligibleReason,
                              })
                            }}
                            style={{ color: BRAND.red }}
                            className="text-xs font-semibold underline bg-transparent border-none cursor-pointer"
                          >
                            {t('openDisputeButton')}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {reviewTarget && (
        <ReviewModal
          orderId={reviewTarget.orderId}
          productId={reviewTarget.item.product_id}
          vendorId={reviewTarget.item.vendor_id}
          productName={reviewTarget.item.product_name}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            setReviewTarget(null)
            loadOrders()
          }}
        />
      )}

      {disputeTarget && (
        <DisputeModal
          orderId={disputeTarget.orderId}
          vendorId={disputeTarget.vendorId}
          refundEligible={disputeTarget.refundEligible}
          refundIneligibleReason={disputeTarget.refundIneligibleReason}
          onClose={() => setDisputeTarget(null)}
          onSuccess={() => {
            setDisputeTarget(null)
            loadOrders()
          }}
        />
      )}
    </div>
  )
}
