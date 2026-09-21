'use client'
// ============================================================
// MercadoRD — Sección genérica de productos en el home
// Ruta: src/components/shop/HomeProductSection.tsx
// ============================================================
// Presentación compartida por RecentlyPublished.tsx, BestSellers.tsx,
// LowStock.tsx y RecommendedProducts.tsx — idénticas visualmente
// (título + grid), solo cambia qué productos trae cada una. Cada una ya
// decide devolver null si no califica ningún producto real, así que este
// componente asume que products siempre trae algo.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { useHasVariantsMap } from '@/lib/hooks/useHasVariantsMap'
import { ProductCard } from '@/components/product/ProductCard'
import { getBestSellerProductId } from '@/lib/utils'
import type { ProductWithVendor } from '@/types/database.types'

type TitleKey = 'recentlyPublishedTitle' | 'bestSellersTitle' | 'lowStockTitle' | 'trendingTitle' | 'popularTitle' | 'nearbyTitle' | 'recommendedTitle'

interface Props {
  titleKey: TitleKey
  products: ProductWithVendor[]
}

export function HomeProductSection({ titleKey, products }: Props) {
  const { t } = useTranslation('products')
  const variantsById = useHasVariantsMap(products.map(p => p.id))
  const bestSellerId = getBestSellerProductId(products)

  return (
    // width:'100%' explícito — mismo bug que HeroBanner/PromoBannersRow:
    // este div es flex item de la columna raíz de page.tsx, y sin ancho
    // explícito el margin:auto desactiva el stretch. Acá afectaba a las
    // 6 secciones que comparten este componente (recién publicados, más
    // vendidos, últimas unidades, tendencias, populares, cerca de ti):
    // en mobile, .grid-products (2 columnas vía column-count) calculaba
    // sus columnas sobre un contenedor más ancho que el viewport real,
    // dejando toda la segunda columna cortada fuera de pantalla.
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-blue-dark)', fontFamily: 'var(--font-heading)', margin: 0 }}>
          {t(titleKey)}
        </h2>
      </div>
      <div className="grid-products">
        {products.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            hasVariants={variantsById.get(p.id)}
            isBestSeller={p.id === bestSellerId}
          />
        ))}
      </div>
    </div>
  )
}
