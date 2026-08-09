'use client'
// ============================================================
// MercadoRD — Productos destacados (contenido traducido)
// Ruta: src/components/shop/FeaturedProductsGrid.tsx
// ============================================================
// FeaturedProducts.tsx es un Server Component (fetch a Supabase) y
// no puede usar useTranslation. Este componente recibe los productos
// ya resueltos y se encarga del título traducido + grid.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ProductCard } from '@/components/product/ProductCard'
import { BRAND } from '@/lib/colors'
import type { ProductWithVendor } from '@/types/database.types'

export function FeaturedProductsGrid({ products }: { products: ProductWithVendor[] }) {
  const { t } = useTranslation('products')

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, margin: 0 }}>
          {t('featuredProductsTitle')}
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
