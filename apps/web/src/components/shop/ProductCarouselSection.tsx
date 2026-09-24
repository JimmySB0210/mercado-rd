'use client'
// ============================================================
// MercadoRD — Carrusel de productos genérico (página de producto)
// Ruta: src/components/shop/ProductCarouselSection.tsx
// ============================================================
// Mismo patrón visual que FeaturedProductsGrid.tsx (home) — extraído
// para que RelatedProductsSection.tsx ("También te puede interesar") y
// VendorProductsCarouselSection.tsx ("Productos de este vendedor") no
// dupliquen el mismo carrusel con flechas dos veces. A diferencia de
// FeaturedProductsGrid, no necesita el fix de width:100% (este vive
// dentro de max-w-7xl mx-auto en producto/[id]/page.tsx, no es un flex
// item de una columna raíz).
// ============================================================

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useHasVariantsMap } from '@/lib/hooks/useHasVariantsMap'
import { ProductCard } from '@/components/product/ProductCard'
import { getBestSellerProductId } from '@/lib/utils'
import type { ProductWithVendor } from '@/types/database.types'

const SCROLL_STEP_PX = 640

interface Props {
  title: string
  products: ProductWithVendor[]
}

export function ProductCarouselSection({ title, products }: Props) {
  const variantsById = useHasVariantsMap(products.map(p => p.id))
  const bestSellerId = getBestSellerProductId(products)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' })

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-blue-dark)', fontFamily: 'var(--font-heading)', margin: 0 }}>
          {title}
        </h2>
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
          <div key={p.id} className="flex-shrink-0" style={{ width: 200 }}>
            <ProductCard
              product={p}
              hasVariants={variantsById.get(p.id)}
              isBestSeller={p.id === bestSellerId}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
