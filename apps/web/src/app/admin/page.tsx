// ============================================================
// MercadoRD — Panel de administración
// Ruta: src/app/admin/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin, getMarketplaceKPIs, getAllVendors, getRecentOrders, getPaymentMetrics, getOpenDisputes, getAbandonedCarts } from '@/lib/queries/admin'
import { VerifyVendorButton } from '@/components/admin/VerifyVendorButton'
import { DisputeAdminRow } from '@/components/admin/DisputeAdminRow'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: '⏳ Pendiente',  bg: '#FEF9C3', text: '#713f12' },
  confirmed: { label: '✅ Confirmado',  bg: '#DBEAFE', text: '#1e3a8a' },
  preparing: { label: '📦 Preparando', bg: '#E0E7FF', text: '#3730a3' },
  shipped:   { label: '🚚 Enviado',    bg: '#DBEAFE', text: '#1e3a8a' },
  delivered: { label: '✔️ Entregado',   bg: '#DCFCE7', text: '#166534' },
  cancelled: { label: '❌ Cancelado',   bg: '#FEE2E2', text: '#991B1B' },
}

const PAYMENT_METHOD_LABELS: Record<string, { label: string; emoji: string }> = {
  azul:     { label: 'Azul',          emoji: '💳' },
  cardnet:  { label: 'CardNet',       emoji: '🏦' },
  transfer: { label: 'Transferencia', emoji: '🏧' },
  cash:     { label: 'Efectivo',      emoji: '💵' },
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: 'Pendiente', bg: '#FEF9C3', text: '#713f12' },
  approved: { label: 'Aprobado',  bg: '#DCFCE7', text: '#166534' },
  declined: { label: 'Rechazado', bg: '#FEE2E2', text: '#991B1B' },
  refunded: { label: 'Reembolsado', bg: '#E0E7FF', text: '#3730a3' },
}

export default async function AdminPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h1>
          <p className="text-gray-500 text-sm mb-6">
            Esta sección es solo para administradores de MercadoRD.
          </p>
          <a href="/" className="text-blue-600 underline text-sm">Volver al inicio</a>
        </div>
      </div>
    )
  }

  const [kpis, vendors, orders, paymentMetrics, openDisputes, abandonedCarts] = await Promise.all([
    getMarketplaceKPIs(),
    getAllVendors(),
    getRecentOrders(15),
    getPaymentMetrics(),
    getOpenDisputes(),
    getAbandonedCarts(),
  ])

  const KPI_CARDS = [
    { label: 'Ingresos totales', val: formatPrice(kpis.totalRevenue), sub: `${formatPrice(kpis.revenueThisMonth)} este mes`, color: BRAND.green },
    { label: 'Pedidos totales', val: String(kpis.totalOrders), sub: `${kpis.ordersThisMonth} este mes`, color: BRAND.blue },
    { label: 'Vendors activos', val: String(kpis.totalVendors), sub: `${kpis.verifiedVendors} verificados`, color: '#F5A200' },
    { label: 'Productos', val: String(kpis.totalProducts), sub: `${kpis.activeProducts} activos`, color: BRAND.red },
    { label: 'Usuarios registrados', val: String(kpis.totalUsers), sub: 'compradores + vendors', color: '#7C3AED' },
  ]

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <AdminSidebar />

      {/* Contenido */}
      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Vista general del marketplace</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Métricas globales de MercadoRD</p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          {KPI_CARDS.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6, color: '#111' }}>{s.val}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Métricas de pagos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }} className="admin-grid">

          {/* Por método */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
              Pagos por método ({paymentMetrics.totalCount})
            </div>
            {paymentMetrics.totalCount === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
                Aún no hay pagos registrados.
              </div>
            ) : (
              <div>
                {Object.entries(paymentMetrics.byMethod).map(([method, data], i, arr) => {
                  const info = PAYMENT_METHOD_LABELS[method] ?? { label: method, emoji: '💰' }
                  const pct = paymentMetrics.totalAmount > 0 ? (data.amount / paymentMetrics.totalAmount) * 100 : 0
                  return (
                    <div key={method} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f8f8f8' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#333' }}>{info.emoji} {info.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(data.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: BRAND.blue }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>{data.count} pago{data.count === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Por estado */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
              Pagos por estado
            </div>
            {paymentMetrics.totalCount === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
                Aún no hay pagos registrados.
              </div>
            ) : (
              <div>
                {Object.entries(paymentMetrics.byStatus).map(([status, data], i, arr) => {
                  const info = PAYMENT_STATUS_LABELS[status] ?? { label: status, bg: '#F3F4F6', text: '#666' }
                  return (
                    <div key={status} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f8f8f8' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: info.bg, color: info.text, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>
                        {info.label}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(data.amount)}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{data.count} pago{data.count === 1 ? '' : 's'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Disputas abiertas */}
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
            Disputas abiertas ({openDisputes.length})
          </div>
          {openDisputes.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
              No hay disputas abiertas ni en revisión. 🎉
            </div>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {openDisputes.map(d => (
                <DisputeAdminRow
                  key={d.id}
                  disputeId={d.id}
                  orderId={d.order_id}
                  reason={d.reason}
                  description={d.description}
                  status={d.status}
                  buyerName={d.buyer_name}
                  vendorName={d.vendor_name}
                  createdAt={d.created_at}
                />
              ))}
            </div>
          )}
        </div>

        {/* Carritos abandonados */}
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
            Carritos abandonados 🛒
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, padding: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Sin recuperar</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#111' }}>{abandonedCarts.totalUnrecovered}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Valor potencial perdido</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: BRAND.red }}>{formatPrice(abandonedCarts.totalPotentialValueRdp)}</div>
            </div>
          </div>

          {abandonedCarts.recent.length === 0 ? (
            <div style={{ padding: '0 18px 18px', fontSize: 13, color: '#999' }}>
              No hay carritos abandonados sin recuperar. 🎉
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #f0f0f0' }}>
              {abandonedCarts.recent.map((c, i, arr) => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < arr.length - 1 ? '1px solid #f8f8f8' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#333' }}>{c.buyer_name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(c.total_rdp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }} className="admin-grid">

          {/* Vendors */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
              Vendors ({vendors.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    {['Tienda', 'Provincia', 'Productos', 'Plan', 'Ventas', 'Verificado'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#111' }}>{v.business_name}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>{v.province_name ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#666' }}>{v.product_count}</td>
                      <td style={{ padding: '10px 12px', fontSize: 11 }}>
                        <span style={{ background: v.plan === 'pro' ? '#E0E7FF' : '#F3F4F6', color: v.plan === 'pro' ? '#3730a3' : '#666', padding: '2px 8px', borderRadius: 10, fontWeight: 700, textTransform: 'capitalize' }}>
                          {v.plan}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>{v.total_sales}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <VerifyVendorButton vendorId={v.id} isVerified={v.is_verified} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Órdenes recientes */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
              Órdenes recientes
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {orders.map(o => {
                const shortId = o.id.split('-')[0].toUpperCase()
                const status = STATUS_LABELS[o.status] ?? STATUS_LABELS.pending
                const date = new Date(o.created_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
                return (
                  <div key={o.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f8f8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue }}>#RD-{shortId}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{o.buyer_name} · {date} · {o.item_count} items</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(o.total_rdp)}</div>
                      <span style={{ background: status.bg, color: status.text, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <style>{`
          @media (max-width: 900px) {
            .admin-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
