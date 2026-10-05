'use client'
// ============================================================
// MercadoRD — Proveedores destacados (contenido traducido)
// Ruta: src/components/shop/FeaturedProvidersGrid.tsx
// ============================================================
// FeaturedProviders.tsx es un Server Component (fetch a Supabase) y
// no puede usar useTranslation. Este componente recibe los vendors ya
// resueltos y se encarga del título traducido + grid. Mismo estilo de
// tarjeta que "Tiendas populares" (grid-stores en HomeProductGrid.tsx)
// a propósito, para que ambas franjas se vean como un mismo par.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { VendorRealStatsLine } from '@/components/shop/VendorRealStatsLine'
import type { VendorRealStatsMap } from '@/lib/queries/vendorRealStatsBatch'
import type { Vendor } from '@/types/database.types'

export function FeaturedProvidersGrid({ providers, realStats }: { providers: Vendor[]; realStats: VendorRealStatsMap }) {
  const { t } = useTranslation('products')

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px' }}>
        <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 700, color: 'var(--color-blue-dark)', fontFamily: 'var(--font-heading)', margin: 0 }}>
          {t('featuredProvidersTitle')}
        </h2>
        <a href="/proveedores" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-ui)', fontWeight: 600, textDecoration: 'none' }}>
          {t('viewAll')}
        </a>
      </div>

      <div className="grid-stores">
        {providers.map(v => (
          <a
            key={v.id}
            href={`/tienda/${v.id}`}
            className="hover:[box-shadow:var(--shadow-card-hover)]"
            style={{ background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-card)', borderRadius: 'var(--radius-card)', padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer', transition: 'box-shadow var(--transition-base)' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-control)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden' }}>
              {v.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.logo_url} alt={v.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '🏪'
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-small)', color: 'var(--color-text-primary)' }}>{v.business_name}</div>
              {v.is_verified && (
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--color-primary)', fontWeight: 600 }}>{t('verifiedBadge')}</div>
              )}
            </div>
            <VendorRealStatsLine stats={realStats[v.id]} salesLabel={t('salesSuffix')} />
          </a>
        ))}
      </div>
    </div>
  )
}
