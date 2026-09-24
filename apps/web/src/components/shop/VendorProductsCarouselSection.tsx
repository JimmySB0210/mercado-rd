'use client'
// ============================================================
// MercadoRD — "Productos de este vendedor" (contenido traducido)
// Ruta: src/components/shop/VendorProductsCarouselSection.tsx
// ============================================================
// VendorProductsCarousel.tsx es un Server Component (fetch a Supabase)
// y no puede usar useTranslation. Este componente recibe los productos
// ya resueltos y se encarga del título traducido + carrusel.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ProductCarouselSection } from '@/components/shop/ProductCarouselSection'
import type { ProductWithVendor } from '@/types/database.types'

export function VendorProductsCarouselSection({ products }: { products: ProductWithVendor[] }) {
  const { t } = useTranslation('products')
  return <ProductCarouselSection title={t('vendorProductsTitle')} products={products} />
}
