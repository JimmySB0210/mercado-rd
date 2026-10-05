'use client'
// ============================================================
// MercadoRD — Tarjeta "Tu tienda" (compartida)
// Ruta: src/components/vendor/StoreSummaryCard.tsx
// ============================================================
// La usan el resumen (dashboard/page.tsx → DashboardContent) y Mis
// Productos, así las dos pantallas no pueden divergir. Solo muestra
// datos reales: vendor_real_stats (calificación, ventas, reseñas) y el
// porcentaje de completitud calculado por computeVendorCompleteness.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import type { VendorRealStats } from '@/lib/queries/vendor-dashboard'

interface Props {
  vendor: { id: string; businessName: string; logoUrl: string | null; provinceName: string | null }
  realStats: VendorRealStats
  completenessPercent: number
}

export function StoreSummaryCard({ vendor, realStats, completenessPercent }: Props) {
  const { t } = useTranslation('dashboard')

  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6', padding: 16 }}>
      <div style={{ fontSize: 'var(--text-h4)', fontWeight: 600, color: '#131A18', marginBottom: 12 }}>{t('storeCardTitle')}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary-subtle)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--dashboard-blue)', overflow: 'hidden',
        }}>
          {vendor.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.logoUrl} alt={vendor.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : vendor.businessName.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-ui)', color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vendor.businessName}
          </div>
          {vendor.provinceName && <div style={{ fontSize: 'var(--text-caption)', color: '#818F98' }}>{vendor.provinceName}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-caption)', color: '#3D5361', marginBottom: 12, flexWrap: 'wrap' }}>
        {realStats.realRatingAvg != null ? (
          <span>⭐ {realStats.realRatingAvg.toFixed(1)}{realStats.realRatingCount > 0 && ` · ${t('reviewsCountShort', { count: realStats.realRatingCount })}`}</span>
        ) : (
          <span>{t('noRatingYet')}</span>
        )}
        <span>{t('salesCountShort', { count: realStats.realTotalSales })}</span>
      </div>

      <div style={{ marginBottom: 4, fontSize: 'var(--text-caption)', color: '#818F98', display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('storeProfileLabel')}</span>
        <span style={{ fontWeight: 700, color: '#131A18' }}>{completenessPercent}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: '#EEF2F6', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${completenessPercent}%`, background: completenessPercent >= 100 ? 'var(--color-green)' : 'var(--dashboard-yellow)', borderRadius: 3 }} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a href={`/tienda/${vendor.id}`} style={{
          flex: 1, textAlign: 'center', fontSize: 'var(--text-ui)', fontWeight: 600, padding: '8px 10px', borderRadius: 8,
          border: '1px solid var(--dashboard-blue)', color: 'var(--dashboard-blue)', textDecoration: 'none',
        }}>
          {t('viewMyStoreCta')}
        </a>
        <a href="/dashboard/configuracion" style={{
          flex: 1, textAlign: 'center', fontSize: 'var(--text-ui)', fontWeight: 600, padding: '8px 10px', borderRadius: 8,
          background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none',
        }}>
          {t('editStoreCta')}
        </a>
      </div>
    </div>
  )
}
