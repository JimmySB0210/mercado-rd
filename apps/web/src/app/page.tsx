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
import { getProducts } from '@/lib/supabase/products'

export default async function HomePage() {
  const products = await getProducts({ limit: 12, sort: 'popular' })

  return (
    <div>
      <Navbar />
      <HeroBanner />
      <FeaturedProducts />
      <ProductGrid products={products} />
    </div>
  )
}
