// ============================================================
// MercadoRD — Homepage
// Ruta: src/app/page.tsx
// ============================================================
// Server Component estático — la carga de productos y su
// paginación viven en HomeProductGrid (Client Component), que
// usa createPublicClient() para no romper el ISR de esta página.
//
// Orden fijo en todos los breakpoints: Hero siempre primero, seguido
// de "Productos destacados" y luego "Explora por categoría".
// ============================================================

import { Navbar } from '../components/shop/Navbar'
import { HeroBanner } from '../components/shop/HeroBanner'
import { HomeCategoryStrip } from '../components/shop/HomeCategoryStrip'
import { ShippingBenefitsStrip } from '../components/shop/ShippingBenefitsStrip'
import { HomeProductGrid } from '../components/shop/HomeProductGrid'
import { FeaturedProducts } from '../components/shop/FeaturedProducts'
import { DailyDeals } from '../components/shop/DailyDeals'
import { RecentlyPublished } from '../components/shop/RecentlyPublished'
import { BestSellers } from '../components/shop/BestSellers'
import { LowStock } from '../components/shop/LowStock'
import { RecentActivity } from '../components/shop/RecentActivity'
import { Trending } from '../components/shop/Trending'
import { Popular } from '../components/shop/Popular'
import { NearbyProducts } from '../components/shop/NearbyProducts'
import { FeaturedProviders } from '../components/shop/FeaturedProviders'

export const revalidate = 300

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <div>
        <HeroBanner />
      </div>
      {/* Justo debajo del hero en ambos breakpoints */}
      <div>
        <ShippingBenefitsStrip />
      </div>
      <div>
        <FeaturedProducts />
      </div>
      <div>
        <HomeCategoryStrip />
      </div>
      {/* "Ofertas del día" — debajo de "Productos destacados" */}
      <div className="order-4">
        <DailyDeals />
      </div>
      {/* Fase 1-2, homepage vivo — cada una se oculta sola si no
          califica ningún producto real, nunca se rellena con mock */}
      <div className="order-4">
        <RecentActivity />
      </div>
      <div className="order-4">
        <RecentlyPublished />
      </div>
      <div className="order-4">
        <BestSellers />
      </div>
      <div className="order-4">
        <LowStock />
      </div>
      <div className="order-4">
        <Trending />
      </div>
      <div className="order-4">
        <Popular />
      </div>
      <div className="order-4">
        <NearbyProducts />
      </div>
      <div className="order-4">
        <HomeProductGrid />
      </div>
      <div className="order-4">
        <FeaturedProviders />
      </div>
    </div>
  )
}
