// ============================================================
// MercadoRD — Dashboard del vendor
// Ruta: src/app/dashboard/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor, getVendorOrders, getVendorKPIs, getVendorMonthlyRevenue } from '@/lib/queries/vendor-dashboard'
import { OrderStatusSelect } from '@/components/vendor/OrderStatusSelect'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { RevenueChartLoader } from '@/components/vendor/RevenueChartLoader'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard')

  const vendor = await getCurrentVendor()

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Aún no tienes una tienda</h1>
          <p className="text-gray-500 text-sm mb-6">
            Regístrate como vendor para empezar a vender en MercadoRD y acceder a tu panel.
          </p>
          <a
            href="/vendor/register"
            style={{ background: BRAND.blue }}
            className="inline-block text-white px-6 py-3 rounded-xl font-medium no-underline"
          >
            Registrar mi tienda
          </a>
        </div>
      </div>
    )
  }

  const [allOrders, kpis, monthlyRevenue] = await Promise.all([
    getVendorOrders(vendor.id),
    getVendorKPIs(vendor.id),
    getVendorMonthlyRevenue(vendor.id),
  ])

  // Solo los 5 más recientes en el resumen — el resto vive en /dashboard/pedidos
  const orders = allOrders.slice(0, 5)

  const firstName = vendor.business_name.split(' ')[0]

  const KPI_CARDS = [
    { label: 'Ingresos — este mes', val: formatPrice(kpis.monthlyRevenue), color: BRAND.green },
    { label: 'Pedidos — este mes', val: String(kpis.orderCount), color: BRAND.blue },
    { label: 'Ticket promedio', val: formatPrice(kpis.avgTicket), color: '#F5A200' },
    { label: 'Calificación', val: kpis.rating > 0 ? `${kpis.rating.toFixed(1)} ⭐` : 'Sin reseñas', color: BRAND.red },
  ]

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', display: 'grid', gridTemplateColumns: '220px 1fr' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>¡Buen día, {firstName}! 👋</h1>
            <p style={{ color: '#666', fontSize: 14 }}>Aquí está el resumen de tu negocio</p>
          </div>
          <a
            href="/dashboard/productos/nuevo"
            style={{ background: '#111', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            + Nuevo producto
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {KPI_CARDS.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6, color: '#111' }}>{s.val}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>
                {kpis.totalSales > 0 ? `${kpis.totalSales} ventas totales` : 'Aún sin historial'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
            Ingresos últimos 6 meses
          </div>
          <RevenueChartLoader data={monthlyRevenue} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              Pedidos recientes {allOrders.length > 0 && `(${allOrders.length} en total)`}
            </div>
            {allOrders.length > 0 && (
              <a href="/dashboard/pedidos" style={{ fontSize: 13, color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}>
                Ver todos →
              </a>
            )}
          </div>

          {orders.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ color: '#999', fontSize: 14 }}>Aún no tienes pedidos. ¡Cuando alguien compre aparecerán aquí!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    {['Pedido', 'Cliente', 'Producto(s)', 'Provincia', 'Monto', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const shortId = o.order_id.split('-')[0].toUpperCase()
                    const productSummary = o.items.length === 1
                      ? `${o.items[0].product_name} x${o.items[0].quantity}`
                      : `${o.items[0].product_name} +${o.items.length - 1} más`

                    return (
                      <tr key={o.order_id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                        <td style={{ padding: '12px 14px', color: BRAND.blue, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                          #RD-{shortId}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13 }}>
                          {o.buyer_name || 'Cliente'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, maxWidth: 200 }}>
                          {productSummary}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>
                          {o.province_name ?? '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {formatPrice(o.vendor_subtotal_rdp)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <OrderStatusSelect orderId={o.order_id} currentStatus={o.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
