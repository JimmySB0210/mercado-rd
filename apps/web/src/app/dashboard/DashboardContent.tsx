'use client'
// ============================================================
// MercadoRD — Contenido traducido de /dashboard (resumen)
// Ruta: src/app/dashboard/DashboardContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe los datos ya
// resueltos como props y se encarga de todo el texto traducido.
// ============================================================

import { OrderStatusSelect } from '@/components/vendor/OrderStatusSelect'
import { RevenueChartLoader } from '@/components/vendor/RevenueChartLoader'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

interface OrderRow {
  order_id: string
  status: string
  buyer_name: string | null
  province_name: string | null
  vendor_subtotal_rdp: number
  items: { product_name: string; quantity: number }[]
}

interface Props {
  firstName: string
  kpis: {
    monthlyRevenue: number
    orderCount: number
    avgTicket: number
    rating: number
    totalSales: number
  }
  monthlyRevenue: { month: string; revenue: number }[]
  allOrdersCount: number
  orders: OrderRow[]
}

// Caso vendor === null — texto traducido aparte porque page.tsx
// retorna temprano antes de armar los props de DashboardContent.
export function NoStoreNotice() {
  const { t } = useTranslation('dashboard')
  return (
    <div className="text-center max-w-md">
      <div className="text-5xl mb-4">🏪</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{t('noStoreTitle')}</h1>
      <p className="text-gray-500 text-sm mb-6">{t('noStoreSub')}</p>
      <a
        href="/vendor/register"
        style={{ background: BRAND.blue }}
        className="inline-block text-white px-6 py-3 rounded-xl font-medium no-underline"
      >
        {t('registerStoreCta')}
      </a>
    </div>
  )
}

export function DashboardContent({ firstName, kpis, monthlyRevenue, allOrdersCount, orders }: Props) {
  const { t } = useTranslation('dashboard')

  const KPI_CARDS = [
    { label: t('kpiRevenueMonth'), val: formatPrice(kpis.monthlyRevenue), color: BRAND.green },
    { label: t('kpiOrdersMonth'), val: String(kpis.orderCount), color: BRAND.blue },
    { label: t('kpiAvgTicket'), val: formatPrice(kpis.avgTicket), color: '#F5A200' },
    { label: t('kpiRating'), val: kpis.rating > 0 ? `${kpis.rating.toFixed(1)} ⭐` : t('noReviewsYet'), color: BRAND.red },
  ]

  return (
    <div style={{ padding: 28, background: '#f5f5f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t('greeting', { name: firstName })}</h1>
          <p style={{ color: '#666', fontSize: 14 }}>{t('summarySubtitle')}</p>
        </div>
        <a
          href="/dashboard/productos/nuevo"
          style={{ background: '#111', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          {t('newProductCta')}
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {KPI_CARDS.map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6, color: '#111' }}>{s.val}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>
              {kpis.totalSales > 0 ? t('totalSalesCount', { count: kpis.totalSales }) : t('noSalesHistory')}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
          {t('revenueLast6Months')}
        </div>
        <RevenueChartLoader data={monthlyRevenue} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            {t('recentOrdersTitle')} {allOrdersCount > 0 && t('recentOrdersTotal', { count: allOrdersCount })}
          </div>
          {allOrdersCount > 0 && (
            <a href="/dashboard/pedidos" style={{ fontSize: 13, color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}>
              {t('viewAllArrow')}
            </a>
          )}
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ color: '#999', fontSize: 14 }}>{t('noOrdersYet')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  {[t('tableOrder'), t('tableClient'), t('tableProducts'), t('tableProvince'), t('tableAmount'), t('tableStatus')].map(h => (
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
                    : `${o.items[0].product_name} ${t('productSummaryMore', { count: o.items.length - 1 })}`

                  return (
                    <tr key={o.order_id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      <td style={{ padding: '12px 14px', color: BRAND.blue, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                        #RD-{shortId}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        {o.buyer_name || t('defaultClientName')}
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
  )
}
