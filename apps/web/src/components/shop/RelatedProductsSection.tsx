'use client'
// ============================================================
// MercadoRD — "También te puede interesar" (contenido traducido)
// Ruta: src/components/shop/RelatedProductsSection.tsx
// ============================================================
// RelatedProducts.tsx es un Server Component (fetch a Supabase) y
// no puede usar useTranslation. Este componente recibe los productos
// ya resueltos y se encarga del título traducido + grid.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductWithVendor } from '@/types/database.types'

export function RelatedProductsSection({ products }: { products: ProductWithVendor[] }) {
  const { t } = useTranslation('products')

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('relatedProductsTitle')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
