// ============================================================
// MercadoRD — Homepage
// Ruta: src/app/page.tsx
// ============================================================
// Server Component estático — la carga de productos y su
// paginación viven en HomeProductGrid (Client Component), que
// usa createPublicClient() para no romper el ISR de esta página.
//
// Narrativa fija del home (rediseño visual, misma lógica/funcionalidad
// de siempre — cada sección se oculta sola si no califica ningún
// producto real, nunca se rellena con mock), pedida explícitamente en
// este orden:
//   Hero → Categorías → Destacados → 3 banners promocionales →
//   Proveedores destacados → Recién publicados → el resto de
//   descubrimiento (ofertas del día, actividad reciente, más vendidos,
//   últimas unidades, tendencias, populares, cerca de ti, catálogo
//   paginado — que también trae "Tiendas destacadas" al final).
//   ShippingBenefitsStrip (franja de envío/beneficios debajo de los 3
//   banners) se quitó por completo a pedido explícito — esa info ya
//   vive en la barra de confianza del Navbar.
// ============================================================

import { Navbar } from '../components/shop/Navbar'
import { HeroBanner } from '../components/shop/HeroBanner'
import { HomeCategoryStrip } from '../components/shop/HomeCategoryStrip'
import { HomeProductGrid } from '../components/shop/HomeProductGrid'
import { FeaturedProducts } from '../components/shop/FeaturedProducts'
import { PromoBannersRow } from '../components/shop/PromoBannersRow'
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

      <HeroBanner />
      <HomeCategoryStrip />
      <FeaturedProducts />
      <PromoBannersRow />
      <FeaturedProviders />
      <RecentlyPublished />

      {/* Descubrimiento adicional — cada una ya decide ocultarse si no
          califica ningún producto real */}
      <DailyDeals />
      <RecentActivity />
      <BestSellers />
      <LowStock />
      <Trending />
      <Popular />
      <NearbyProducts />
      <HomeProductGrid />
    </div>
  )
}
