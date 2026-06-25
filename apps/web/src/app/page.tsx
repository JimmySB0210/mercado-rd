// ============================================================
// MercadoRD — Homepage
// Ruta: src/app/page.tsx
// ============================================================
// Server Component estático — la carga de productos y su
// paginación viven en HomeProductGrid (Client Component), que
// usa createPublicClient() para no romper el ISR de esta página.
// HeroBanner no cambia.
// ============================================================

import { Navbar } from '../components/shop/Navbar'
import { HeroBanner } from '../components/shop/HeroBanner'
import { HomeProductGrid } from '../components/shop/HomeProductGrid'
import { FeaturedProducts } from '../components/shop/FeaturedProducts'

export const revalidate = 300

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <HeroBanner />
      <FeaturedProducts />
      <HomeProductGrid />
    </div>
  )
}
