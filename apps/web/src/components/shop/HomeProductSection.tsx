'use client'
// ============================================================
// MercadoRD — Sección genérica de productos en el home
// Ruta: src/components/shop/HomeProductSection.tsx
// ============================================================
// Presentación compartida por RecentlyPublished.tsx, BestSellers.tsx
// y LowStock.tsx — las 3 son idénticas visualmente (título + grid),
// solo cambia qué productos trae cada Server Component. Cada uno de
// esos ya decide devolver null si no califica ningún producto real,
// así que este componente asume que products siempre trae algo.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductWithVendor } from '@/types/database.types'

type TitleKey = 'recentlyPublishedTitle' | 'bestSellersTitle' | 'lowStockTitle' | 'trendingTitle' | 'popularTitle' | 'nearbyTitle'

interface Props {
  titleKey: TitleKey
  products: ProductWithVendor[]
}

export function HomeProductSection({ titleKey, products }: Props) {
  const { t } = useTranslation('products')

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {t(titleKey)}
        </h2>
      </div>
      <div className="grid-products">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
