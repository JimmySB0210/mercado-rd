// ============================================================
// MercadoRD — Homepage
// Ruta: src/app/page.tsx
// ============================================================
// Server Component — trae productos reales de Supabase
// y los pasa a ProductGrid. HeroBanner no cambia.
// ============================================================

import { Navbar } from '../components/shop/Navbar'
import { HeroBanner } from '../components/shop/HeroBanner'
import { ProductGrid } from '../components/shop/ProductGrid'
import { FeaturedProducts } from '../components/shop/FeaturedProducts'
import { getProductsPublic } from '@/lib/supabase/products'

export const revalidate = 300

export default async function HomePage() {
  const products = await getProductsPublic({ limit: 12, sort: 'popular' })

  return (
    <div>
      <Navbar />
      <HeroBanner />
      <FeaturedProducts />
      <ProductGrid products={products} />
    </div>
  )
}
