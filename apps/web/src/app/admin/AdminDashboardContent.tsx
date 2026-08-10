'use client'
// ============================================================
// MercadoRD — Contenido traducido de /admin
// Ruta: src/app/admin/AdminDashboardContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe los datos ya
// resueltos como props y se encarga de todo el texto traducido.
// ============================================================

import { DisputeAdminRow } from '@/components/admin/DisputeAdminRow'
import { VerificationBadge } from '@/components/vendor/VerificationBadge'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

interface Props {
  kpis: {
    totalRevenue: number
    revenueThisMonth: number
    totalOrders: number
    ordersThisMonth: number
    totalVendors: number
    verifiedVendors: number
    totalProducts: number
    activeProducts: number
    totalUsers: number
  }
  vendors: any[]
  orders: any[]
  paymentMetrics: {
    totalCount: number
    totalAmount: number
    byMethod: Record<string, { amount: number; count: number }>
    byStatus: Record<string, { amount: number; count: number }>
  }
  openDisputes: any[]
  abandonedCarts: {
    totalUnrecovered: number
    totalPotentialValueRdp: number
    recent: { id: string; buyer_name: string; total_rdp: number }[]
  }
}

const PAYMENT_METHOD_EMOJI: Record<string, string> = {
  azul: '💳', cardnet: '🏦', transfer: '🏧', cash: '💵',
}
const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:  { bg: '#FEF9C3', text: '#713f12' },
  approved: { bg: '#DCFCE7', text: '#166534' },
  declined: { bg: '#FEE2E2', text: '#991B1B' },
  refunded: { bg: '#E0E7FF', text: '#3730a3' },
}
const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF9C3', text: '#713f12' },
  confirmed: { bg: '#DBEAFE', text: '#1e3a8a' },
  preparing: { bg: '#E0E7FF', text: '#3730a3' },
  shipped:   { bg: '#DBEAFE', text: '#1e3a8a' },
  delivered: { bg: '#DCFCE7', text: '#166534' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
}

export function AdminDashboardContent({ kpis, vendors, orders, paymentMetrics, openDisputes, abandonedCarts }: Props) {
  const { t } = useTranslation('admin')

  const KPI_CARDS = [
    { label: t('kpiRevenue'), val: formatPrice(kpis.totalRevenue), sub: t('kpiRevenueSub', { amount: formatPrice(kpis.revenueThisMonth) }), color: BRAND.green },
    { label: t('kpiOrders'), val: String(kpis.totalOrders), sub: t('kpiOrdersSub', { count: kpis.ordersThisMonth }), color: BRAND.blue },
    { label: t('kpiVendors'), val: String(kpis.totalVendors), sub: t('kpiVendorsSub', { count: kpis.verifiedVendors }), color: '#F5A200' },
    { label: t('kpiProducts'), val: String(kpis.totalProducts), sub: t('kpiProductsSub', { count: kpis.activeProducts }), color: BRAND.red },
    { label: t('kpiUsers'), val: String(kpis.totalUsers), sub: t('kpiUsersSub'), color: '#7C3AED' },
  ]

  return (
    <div style={{ padding: 28, background: '#f5f5f5' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t('dashboardTitle')}</h1>
        <p style={{ color: '#666', fontSize: 14 }}>{t('dashboardSubtitle')}</p>
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
            {t('paymentsByMethodTitle', { count: paymentMetrics.totalCount })}
          </div>
          {paymentMetrics.totalCount === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
              {t('noPaymentsYet')}
            </div>
          ) : (
            <div>
              {Object.entries(paymentMetrics.byMethod).map(([method, data], i, arr) => {
                const emoji = PAYMENT_METHOD_EMOJI[method] ?? '💰'
                const label = method in PAYMENT_METHOD_EMOJI ? t(`paymentMethod.${method}` as 'paymentMethod.azul') : method
                const pct = paymentMetrics.totalAmount > 0 ? (data.amount / paymentMetrics.totalAmount) * 100 : 0
                return (
                  <div key={method} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f8f8f8' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#333' }}>{emoji} {label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(data.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: BRAND.blue }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>
                        {data.count} {data.count === 1 ? t('paymentSingular') : t('paymentPlural')}
                      </span>
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
            {t('paymentsByStatusTitle')}
          </div>
          {paymentMetrics.totalCount === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
              {t('noPaymentsYet')}
            </div>
          ) : (
            <div>
              {Object.entries(paymentMetrics.byStatus).map(([status, data], i, arr) => {
                const colors = PAYMENT_STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#666' }
                const label = status in PAYMENT_STATUS_COLORS ? t(`paymentStatus.${status}` as 'paymentStatus.pending') : status
                return (
                  <div key={status} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f8f8f8' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: colors.bg, color: colors.text, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>
                      {label}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(data.amount)}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {data.count} {data.count === 1 ? t('paymentSingular') : t('paymentPlural')}
                      </div>
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
          {t('openDisputesTitle', { count: openDisputes.length })}
        </div>
        {openDisputes.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
            {t('noOpenDisputes')}
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
          {t('abandonedCartsTitle')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, padding: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('unrecoveredLabel')}</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#111' }}>{abandonedCarts.totalUnrecovered}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{t('potentialLostValueLabel')}</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: BRAND.red }}>{formatPrice(abandonedCarts.totalPotentialValueRdp)}</div>
          </div>
        </div>

        {abandonedCarts.recent.length === 0 ? (
          <div style={{ padding: '0 18px 18px', fontSize: 13, color: '#999' }}>
            {t('noAbandonedCarts')}
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
            {t('vendorsTableTitle', { count: vendors.length })}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  {[t('tableHeaderStore'), t('tableHeaderProvince'), t('tableHeaderProducts'), t('tableHeaderPlan'), t('tableHeaderSales'), t('tableHeaderVerified'), ''].map((h, i) => (
                    <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
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
                      {v.verification_level >= 2
                        ? <VerificationBadge level={v.verification_level} />
                        : <span style={{ fontSize: 11, color: '#999' }}>{t('levelOneFallback')}</span>}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <a href={`/admin/proveedores?vendor=${v.id}`} style={{ fontSize: 12, color: BRAND.blue, fontWeight: 600, textDecoration: 'none' }}>
                        {t('viewDetailLink')}
                      </a>
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
            {t('recentOrdersTitle')}
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {orders.map(o => {
              const shortId = o.id.split('-')[0].toUpperCase()
              const knownStatus = o.status in ORDER_STATUS_COLORS ? o.status : 'pending'
              const colors = ORDER_STATUS_COLORS[knownStatus]
              const label = t(`orderStatus.${knownStatus}` as 'orderStatus.pending')
              const date = new Date(o.created_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
              return (
                <div key={o.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f8f8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue }}>#RD-{shortId}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{o.buyer_name} · {date} · {o.item_count} items</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(o.total_rdp)}</div>
                    <span style={{ background: colors.bg, color: colors.text, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>
                      {label}
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
  )
}
