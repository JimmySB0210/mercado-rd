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

import { Star } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { Vendor } from '@/types/database.types'

export function FeaturedProvidersGrid({ providers }: { providers: Vendor[] }) {
  const { t } = useTranslation('products')

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, margin: 0 }}>
          {t('featuredProvidersTitle')}
        </h2>
        <a href="/proveedores" style={{ color: BRAND.blue, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          {t('viewAll')}
        </a>
      </div>

      <div className="grid-stores">
        {providers.map(v => (
          <a
            key={v.id}
            href={`/tienda/${v.id}`}
            className="hover:shadow-md transition-shadow"
            style={{ background: '#fff', border: '1px solid #EEE', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 10, background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden' }}>
              {v.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.logo_url} alt={v.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '🏪'
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: BRAND.dark }}>{v.business_name}</div>
              {v.is_verified && (
                <div style={{ fontSize: 11, color: BRAND.blue, fontWeight: 600 }}>{t('verifiedBadge')}</div>
              )}
            </div>
            {Number(v.rating_avg) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: BRAND.gray }}>
                <Star size={12} fill="#F5A623" color="#F5A623" />
                {Number(v.rating_avg).toFixed(1)} · {v.total_sales ?? 0} {t('salesSuffix')}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
