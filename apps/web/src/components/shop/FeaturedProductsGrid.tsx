'use client'
// ============================================================
// MercadoRD — Productos destacados (contenido traducido)
// Ruta: src/components/shop/FeaturedProductsGrid.tsx
// ============================================================
// FeaturedProducts.tsx es un Server Component (fetch a Supabase) y
// no puede usar useTranslation. Este componente recibe los productos
// ya resueltos y se encarga del título traducido + grid.
// ============================================================

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useHasVariantsMap } from '@/lib/hooks/useHasVariantsMap'
import { ProductCard } from '@/components/product/ProductCard'
import { getBestSellerProductId } from '@/lib/utils'
import type { ProductWithVendor } from '@/types/database.types'

const SCROLL_STEP_PX = 640

export function FeaturedProductsGrid({ products }: { products: ProductWithVendor[] }) {
  const { t } = useTranslation('products')
  const variantsById = useHasVariantsMap(products.map(p => p.id))
  const bestSellerId = getBestSellerProductId(products)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' })

  return (
    // width:'100%' explícito — mismo bug que HeroBanner/PromoBannersRow:
    // este div es flex item de la columna raíz de page.tsx, y sin ancho
    // explícito el margin:auto desactiva el stretch. Acá el síntoma era
    // peor en mobile: los 220px fijos + flex-shrink:0 de cada tarjeta
    // forzaban el wrapper a ~1380px en CUALQUIER viewport (min-content
    // == max-content al no poder encogerse), dejando el carrusel con
    // apenas 28px de rango de scroll real e inalcanzables los productos
    // 3 a 6 en mobile.
    <div id="destacados" style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '20px 0 16px', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-blue-dark)', fontFamily: 'var(--font-heading)', margin: '0 0 4px' }}>
            {t('featuredProductsTitle')}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            {t('featuredProductsSubtitle')}
          </p>
        </div>

        {/* Controles de carrusel — la sección ya es una fila con scroll
            horizontal contenido (.scroll-hide-x), así que agregarlos no
            introduce ningún comportamiento nuevo, solo un atajo al mismo
            scroll que ya se puede hacer arrastrando. */}
        {products.length > 3 && (
          <div className="hidden md-860:flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => scrollBy(-SCROLL_STEP_PX)}
              aria-label="←"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <ChevronLeft size={16} color="var(--color-text-secondary)" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(SCROLL_STEP_PX)}
              aria-label="→"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <ChevronRight size={16} color="var(--color-text-secondary)" />
            </button>
          </div>
        )}
      </div>

      <div ref={scrollerRef} className="scroll-hide-x flex gap-3 md-860:gap-4 pb-1">
        {products.map(p => (
          <div key={p.id} className="flex-shrink-0" style={{ width: 220 }}>
            <ProductCard
              product={p}
              hasVariants={variantsById.get(p.id)}
              isBestSeller={p.id === bestSellerId}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
