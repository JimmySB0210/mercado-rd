// ============================================================
// MercadoRD — Homepage
// Ruta: src/app/page.tsx
// ============================================================
// Server Component estático — la carga de productos y su
// paginación viven en HomeProductGrid (Client Component), que
// usa createPublicClient() para no romper el ISR de esta página.
//
// Orden responsivo (Fase 2A Batch 2): en mobile las categorías van
// antes del hero, en desktop se mantiene hero primero — mismo árbol
// de componentes en ambos casos, solo cambia el `order` de flexbox
// según el breakpoint, así no hace falta duplicar/condicionar nada.
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
import { FeaturedProviders } from '../components/shop/FeaturedProviders'

export const revalidate = 300

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="order-2 md-860:order-1">
        <HeroBanner />
      </div>
      {/* Justo debajo del hero en ambos breakpoints */}
      <div className="order-3 md-860:order-2">
        <ShippingBenefitsStrip />
      </div>
      <div className="order-1 md-860:order-3">
        <HomeCategoryStrip />
      </div>
      <div className="order-4">
        <FeaturedProducts />
      </div>
      {/* "Ofertas del día" — debajo de "Productos destacados" */}
      <div className="order-4">
        <DailyDeals />
      </div>
      {/* Fase 1, homepage vivo — cada una se oculta sola si no
          califica ningún producto real, nunca se rellena con mock */}
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
        <HomeProductGrid />
      </div>
      <div className="order-4">
        <FeaturedProviders />
      </div>
    </div>
  )
}
