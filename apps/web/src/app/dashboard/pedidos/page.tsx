'use client'
// ============================================================
// MercadoRD — Pedidos (vendor dashboard)
// Ruta: src/app/dashboard/pedidos/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { OrderStatusSelect } from '@/components/vendor/OrderStatusSelect'
import { TrackingForm } from '@/components/vendor/TrackingForm'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

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

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: '⏳ Pendiente' },
  { value: 'confirmed', label: '✅ Confirmado' },
  { value: 'preparing', label: '📦 Preparando' },
  { value: 'shipped', label: '🚚 Enviado' },
  { value: 'delivered', label: '✔️ Entregado' },
  { value: 'cancelled', label: '❌ Cancelado' },
]

export default function VendorOrdersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
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
        .select('id, status, delivery_address, payment_method, notes, created_at, tracking_number, courier, user_id, province:provinces_rd(name)')
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
          items: orderItems,
          vendor_subtotal_rdp: orderItems.reduce((acc: number, i: any) => acc + i.price_rdp * i.quantity, 0),
        }
      })

      setOrders(combined)
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const PAYMENT_LABELS: Record<string, string> = {
    azul: '💳 Azul', cardnet: '🏦 CardNet', transfer: '🏧 Transferencia', cash: '💵 Efectivo',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando pedidos...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', display: 'grid', gridTemplateColumns: '220px 1fr' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Pedidos</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            {orders.length} {orders.length === 1 ? 'pedido total' : 'pedidos totales'}
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${filter === f.value ? BRAND.blue : '#e0e0e0'}`,
                background: filter === f.value ? BRAND.blue : '#fff',
                color: filter === f.value ? '#fff' : '#666',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista de pedidos */}
        {filteredOrders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ color: '#999', fontSize: 14 }}>
              {filter === 'all' ? 'Aún no tienes pedidos.' : 'No hay pedidos con este estado.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredOrders.map(order => {
              const shortId = order.order_id.split('-')[0].toUpperCase()
              const isExpanded = expandedId === order.order_id
              const date = new Date(order.created_at).toLocaleDateString('es-DO', {
                day: 'numeric', month: 'short', year: 'numeric',
              })

              return (
                <div
                  key={order.order_id}
                  style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}
                >
                  {/* Header de la fila — clickeable para expandir */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ color: BRAND.blue, fontWeight: 700, fontSize: 14 }}>#RD-{shortId}</span>
                      <span style={{ fontSize: 13, color: '#666' }}>{order.buyer_name}</span>
                      <span style={{ fontSize: 12, color: '#999' }}>{date}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                        {formatPrice(order.vendor_subtotal_rdp)}
                      </span>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <OrderStatusSelect orderId={order.order_id} currentStatus={order.status} />
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 20px', background: '#fafafa' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Entrega</p>
                          <p style={{ fontSize: 13, color: '#333' }}>{order.delivery_address}</p>
                          <p style={{ fontSize: 12, color: '#999' }}>{order.province_name}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Contacto</p>
                          <p style={{ fontSize: 13, color: '#333' }}>{order.buyer_phone || 'No disponible'}</p>
                          <p style={{ fontSize: 12, color: '#999' }}>{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
                        </div>
                      </div>

                      {order.notes && (
                        <div style={{ marginBottom: 16, padding: 10, background: '#FFF8E1', borderRadius: 8, fontSize: 12, color: '#5D4037' }}>
                          📝 {order.notes}
                        </div>
                      )}

                      <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>
                        Productos ({order.items.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {order.items.map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', padding: 10, borderRadius: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 6, background: BRAND.bg, flexShrink: 0, overflow: 'hidden' }}>
                              {item.product_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : null}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{item.product_name}</p>
                              <p style={{ fontSize: 11, color: '#999' }}>
                                x{item.quantity}
                                {item.size && ` · ${item.size}`}
                                {item.color && ` · ${item.color}`}
                              </p>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
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
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
