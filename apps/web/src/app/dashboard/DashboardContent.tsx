'use client'
// ============================================================
// MercadoRD — Contenido traducido de /dashboard (resumen)
// Ruta: src/app/dashboard/DashboardContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe los datos ya
// resueltos como props y se encarga de todo el texto traducido.
//
// Rediseño 2026-10-01 (brief de Jimmy, referencia visual) — "centro de
// negocio del vendedor" en vez de panel administrativo genérico. Sin
// cambios de backend: todo dato nuevo viene de queries de SOLO LECTURA
// ya agregadas en vendor-dashboard.ts (vendor_real_stats, conteos
// reales de productos/pedidos/mensajes), nunca inventado.
// ============================================================

import { OrderStatusSelect } from '@/components/vendor/OrderStatusSelect'
import { RevenueChartLoader } from '@/components/vendor/RevenueChartLoader'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import type { CompletenessCheck } from '@/lib/vendorCompleteness'
import type { VendorRealStats } from '@/lib/queries/vendor-dashboard'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'

interface OrderRow {
  order_id: string
  status: string
  buyer_name: string | null
  province_name: string | null
  vendor_subtotal_rdp: number
  items: { product_name: string; quantity: number }[]
}

interface ProductRow {
  id: string
  name: string
  images: string[] | null
  price_rdp: number
  stock: number
  is_active: boolean
  sold_count: number | null
}

interface VendorSummary {
  id: string
  businessName: string
  logoUrl: string | null
  isVerified: boolean
  provinceName: string | null
}

interface Props {
  firstName: string
  vendor: VendorSummary
  realStats: VendorRealStats
  completeness: { percent: number; checks: CompletenessCheck[] }
  kpis: { monthlyRevenue: number; orderCount: number }
  productStats: { total: number; lowStock: number }
  monthlyRevenue: { month: string; revenue: number }[]
  allOrdersCount: number
  orders: OrderRow[]
  pendingShipmentCount: number
  lowStockCount: number
  unreadMessagesCount: number
  recentProducts: ProductRow[]
  topSelling: ProductRow[]
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
        style={{ background: 'var(--color-primary)' }}
        className="inline-block text-white px-6 py-3 rounded-xl font-medium no-underline"
      >
        {t('registerStoreCta')}
      </a>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6',
}

function SectionHeader({ title, href, suffix }: { title: string; href?: string; suffix?: string }) {
  const { t } = useTranslation('dashboard')
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F3F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#131A18' }}>
        {title} {suffix && <span style={{ color: '#818F98', fontWeight: 600 }}>{suffix}</span>}
      </div>
      {href && (
        <a href={href} style={{ fontSize: 12.5, color: 'var(--dashboard-blue)', textDecoration: 'none', fontWeight: 700 }}>
          {t('viewAllArrow')}
        </a>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor: string }) {
  return (
    <div style={{ ...cardStyle, padding: 14 }}>
      <div style={{ fontSize: 10.5, color: '#818F98', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 21, marginBottom: 4, color: '#131A18' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: subColor }}>{sub}</div>
    </div>
  )
}

function AttentionItem({ emoji, text, href }: { emoji: string; text: string; href: string }) {
  return (
    <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', textDecoration: 'none', color: '#131A18', fontSize: 13 }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{emoji}</span>
      <span style={{ flex: 1 }}>{text}</span>
      <span style={{ color: 'var(--dashboard-blue)', fontSize: 16 }}>→</span>
    </a>
  )
}

function ProductMiniCard({ product }: { product: ProductRow }) {
  const { t } = useTranslation('dashboard')
  const img = product.images?.[0]
  return (
    <a
      href={`/dashboard/productos/${product.id}/editar`}
      style={{ ...cardStyle, display: 'block', textDecoration: 'none', color: 'inherit', overflow: 'hidden', flexShrink: 0, width: 150 }}
    >
      <div style={{ width: '100%', aspectRatio: '1/1', background: '#F3F5F7', position: 'relative' }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
        )}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#131A18', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dashboard-blue)', marginBottom: 2 }}>{formatPrice(product.price_rdp)}</div>
        <div style={{ fontSize: 11, color: product.stock === 0 ? 'var(--brand-red)' : '#818F98' }}>
          {product.stock === 0 ? t('outOfStockShort') : t('unitsAvailable', { count: product.stock })}
        </div>
      </div>
    </a>
  )
}

export function DashboardContent({
  firstName, vendor, realStats, completeness, kpis, productStats, monthlyRevenue,
  allOrdersCount, orders, pendingShipmentCount, lowStockCount, unreadMessagesCount,
  recentProducts, topSelling,
}: Props) {
  const { t } = useTranslation('dashboard')

  const attentionItems: { emoji: string; text: string; href: string }[] = []
  if (pendingShipmentCount > 0) {
    attentionItems.push({ emoji: '🟠', text: t('attentionPendingShipment', { count: pendingShipmentCount }), href: '/dashboard/pedidos' })
  }
  if (lowStockCount > 0) {
    attentionItems.push({ emoji: '🔴', text: t('attentionLowStock', { count: lowStockCount }), href: '/dashboard/productos' })
  }
  if (unreadMessagesCount > 0) {
    attentionItems.push({ emoji: '💬', text: t('attentionUnreadMessages', { count: unreadMessagesCount }), href: '/dashboard/mensajes' })
  }
  if (completeness.percent < 100) {
    attentionItems.push({ emoji: '🟡', text: t('attentionIncompleteProfile'), href: '/dashboard/configuracion' })
  }

  return (
    <div style={{ padding: 20, background: '#F7F9FB' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 900, marginBottom: 2, color: '#131A18' }}>{t('greeting', { name: firstName })}</h1>
          <p style={{ color: '#818F98', fontSize: 13 }}>{t('summarySubtitle')}</p>
        </div>
        <a
          href="/dashboard/productos/nuevo"
          style={{
            background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none', padding: '10px 18px',
            borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13.5, boxShadow: '0 2px 10px rgba(4,88,180,0.25)',
          }}
        >
          {t('newProductCta')}
        </a>
      </div>

      {/* KPIs + Tu tienda */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 mb-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label={t('kpiRevenueMonth')}
            value={formatPrice(kpis.monthlyRevenue)}
            sub={kpis.orderCount > 0 ? t('kpiRevenueSub', { count: kpis.orderCount }) : t('noSalesHistory')}
            subColor="var(--color-green)"
          />
          <KpiCard
            label={t('kpiOrdersMonth')}
            value={String(kpis.orderCount)}
            sub={allOrdersCount > 0 ? t('kpiOrdersSub', { count: allOrdersCount }) : t('noOrdersYet')}
            subColor="var(--dashboard-blue)"
          />
          <KpiCard
            label={t('kpiProducts')}
            value={String(productStats.total)}
            sub={productStats.lowStock > 0 ? t('kpiProductsLowStock', { count: productStats.lowStock }) : t('kpiProductsAllGood')}
            subColor={productStats.lowStock > 0 ? 'var(--brand-red)' : 'var(--color-green)'}
          />
          <KpiCard
            label={t('kpiRating')}
            value={realStats.realRatingAvg != null ? `${realStats.realRatingAvg.toFixed(1)} ⭐` : '—'}
            sub={realStats.realRatingAvg != null ? t('kpiRatingSub', { count: realStats.realRatingCount }) : t('noRatingYet')}
            subColor="var(--dashboard-yellow)"
          />
        </div>

        {/* Tu tienda */}
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary-subtle)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--dashboard-blue)', overflow: 'hidden',
            }}>
              {vendor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logoUrl} alt={vendor.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : vendor.businessName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {vendor.businessName}
              </div>
              {vendor.provinceName && <div style={{ fontSize: 11.5, color: '#818F98' }}>{vendor.provinceName}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#3D5361', marginBottom: 12, flexWrap: 'wrap' }}>
            {realStats.realRatingAvg != null && <span>⭐ {realStats.realRatingAvg.toFixed(1)}</span>}
            <span>{t('salesCountShort', { count: realStats.realTotalSales })}</span>
            {realStats.realRatingCount > 0 && <span>{t('reviewsCountShort', { count: realStats.realRatingCount })}</span>}
          </div>

          <div style={{ marginBottom: 4, fontSize: 11, color: '#818F98', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('storeProfileLabel')}</span>
            <span style={{ fontWeight: 700, color: '#131A18' }}>{completeness.percent}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#EEF2F6', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', width: `${completeness.percent}%`, background: completeness.percent >= 100 ? 'var(--color-green)' : 'var(--dashboard-yellow)', borderRadius: 3 }} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`/tienda/${vendor.id}`} style={{
              flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 700, padding: '8px 10px', borderRadius: 8,
              border: '1px solid var(--dashboard-blue)', color: 'var(--dashboard-blue)', textDecoration: 'none',
            }}>
              {t('viewMyStoreCta')}
            </a>
            <a href="/dashboard/configuracion" style={{
              flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 700, padding: '8px 10px', borderRadius: 8,
              background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none',
            }}>
              {t('editStoreCta')}
            </a>
          </div>
        </div>
      </div>

      {/* Necesita tu atención */}
      {attentionItems.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ padding: '12px 16px 8px', fontWeight: 800, fontSize: 13.5, color: '#131A18' }}>
            {t('attentionSectionTitle')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            {attentionItems.map((item, i) => <AttentionItem key={i} {...item} />)}
          </div>
        </div>
      )}

      {/* Ingresos + Más vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 mb-3">
        <div style={cardStyle}>
          <SectionHeader title={t('revenueLast6Months')} />
          <RevenueChartLoader data={monthlyRevenue} height={190} />
        </div>

        {topSelling.length > 0 && (
          <div style={cardStyle}>
            <SectionHeader title={t('topSellingTitle')} />
            <div style={{ padding: '6px 0' }}>
              {topSelling.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', background: i === 0 ? 'var(--dashboard-yellow)' : '#EEF2F6',
                    color: i === 0 ? '#131A18' : '#818F98', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#818F98' }}>{t('salesCountShort', { count: p.sold_count ?? 0 })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tus productos */}
      {recentProducts.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <SectionHeader title={t('myProductsTitle')} href="/dashboard/productos" />
          <div style={{ display: 'flex', gap: 10, padding: 14, overflowX: 'auto' }}>
            {recentProducts.map(p => <ProductMiniCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Pedidos recientes */}
      <div style={cardStyle}>
        <SectionHeader
          title={t('recentOrdersTitle')}
          href={allOrdersCount > 0 ? '/dashboard/pedidos' : undefined}
          suffix={allOrdersCount > 0 ? t('recentOrdersTotal', { count: allOrdersCount }) : undefined}
        />

        {orders.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <p style={{ color: '#818F98', fontSize: 13.5 }}>{t('noOrdersYet')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFBFC' }}>
                  {[t('tableOrder'), t('tableClient'), t('tableProducts'), t('tableProvince'), t('tableAmount'), t('tableStatus')].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, color: '#818F98', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, borderBottom: '1px solid #F0F3F6', whiteSpace: 'nowrap' }}>
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
                    <tr key={o.order_id} style={{ borderBottom: '1px solid #F7F9FB' }}>
                      <td style={{ padding: '11px 14px', color: 'var(--dashboard-blue)', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        #RD-{shortId}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5 }}>
                        {o.buyer_name || t('defaultClientName')}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, maxWidth: 200 }}>
                        {productSummary}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        {o.province_name ?? '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatPrice(o.vendor_subtotal_rdp)}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
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
