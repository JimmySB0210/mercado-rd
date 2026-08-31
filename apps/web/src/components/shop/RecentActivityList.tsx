'use client'
// ============================================================
// MercadoRD — "Actividad reciente" (contenido traducido)
// Ruta: src/components/shop/RecentActivityList.tsx
// ============================================================
// RecentActivity.tsx es un Server Component y no puede usar
// useTranslation. Lista compacta, no un grid de tarjetas — cada línea
// es una señal agregada ("🔥 23 gafas vendidas en las últimas horas"),
// nunca un evento individual.
// ============================================================

import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'

export interface ActivityViewModel {
  productId: string
  productName: string
  productImage: string | null
  quantity: number
}

export function RecentActivityList({ items }: { items: ActivityViewModel[] }) {
  const { t } = useTranslation('products')

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {t('recentActivityHeading')}
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <Link
            key={item.productId}
            href={`/producto/${item.productId}`}
            className="flex items-center gap-3 bg-[var(--color-card-bg)] hover:[box-shadow:var(--shadow-card-hover)]"
            style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 10, textDecoration: 'none' }}
          >
            <div className="relative flex-shrink-0 overflow-hidden bg-gray-50" style={{ width: 44, height: 44, borderRadius: 'var(--radius-control)' }}>
              <Image
                src={item.productImage ?? PLACEHOLDER_PRODUCT_IMAGE}
                alt={item.productName}
                fill
                className="object-cover"
                sizes="44px"
              />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {t('recentActivityLine', { quantity: item.quantity, productName: item.productName })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
