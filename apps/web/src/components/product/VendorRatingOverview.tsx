'use client'
// ============================================================
// MercadoRD — "Conoce a {vendedor}" (página de producto)
// Ruta: src/components/product/VendorRatingOverview.tsx
// ============================================================
// Sección propia, standalone — vive justo después de "Opiniones de
// compradores" (pestaña Reseñas) y antes de "Productos de este
// vendedor" (VendorProductsCarousel, en page.tsx). Ni pegada a las
// pestañas ni a VendorInfoBar de más arriba.
//
// Columna izquierda: desglose de estrellas del VENDEDOR completo
// (todos sus productos, vía get_vendor_rating_breakdown) — mismo
// componente visual que RatingBreakdown ya usa para un solo producto
// en ProductReviewsList.tsx, alimentado acá por datos agregados
// distintos. average/total vienen de rating (useVendorTrustStats,
// resuelto una sola vez en ProductPageContent.tsx) para no leer el
// mismo promedio de dos fuentes -- get_vendor_rating_breakdown solo
// aporta el conteo por estrella.
//
// Columna derecha: repite a propósito la misma VendorStatsLine que ya
// muestra VendorInfoBar más arriba -- refuerzo antes del carrusel de
// productos del vendedor, no un error ni un dato nuevo.
//
// Sin desglose (muestra insuficiente, showRating=false): la columna
// izquierda no se renderiza -- mostrar 5 barras en 0% no es honesto,
// mismo criterio que el resto de las métricas de confianza del sitio.
// La sección entera sigue visible (conteo de productos, verificado,
// envía a todo RD no dependen de reseñas).
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { RatingBreakdown } from '@/components/shop/ProductReviewsList'
import { VendorStatsLine } from '@/components/product/VendorStatsLine'
import { useVendorRatingBreakdown } from '@/lib/hooks/useVendorRatingBreakdown'
import type { VendorRatingData, VendorResponseData } from '@/lib/hooks/useVendorTrustStats'

interface Props {
  vendorId: string
  businessName: string
  productCount: number
  shipsNationwide: boolean
  rating: VendorRatingData | null
  response: VendorResponseData | null
  showRating: boolean
  showResponse: boolean
}

export function VendorRatingOverview({
  vendorId, businessName, productCount, shipsNationwide,
  rating, response, showRating, showResponse,
}: Props) {
  const { t } = useTranslation('products')
  const counts = useVendorRatingBreakdown(vendorId)

  const showBreakdown = showRating && counts != null

  return (
    <div
      className="bg-[var(--color-card-bg)] mt-6 p-5 sm:p-6"
      style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        {t('vendorRatingOverviewHeading', { vendorName: businessName })}
      </h2>
      <div className={`grid grid-cols-1 gap-6 items-center ${showBreakdown ? 'md:grid-cols-2' : ''}`}>
        {showBreakdown && (
          <RatingBreakdown average={rating!.average} total={rating!.count} counts={counts!} />
        )}
        <VendorStatsLine
          rating={rating}
          response={response}
          showRating={showRating}
          showResponse={showResponse}
          productCount={productCount}
          shipsNationwide={shipsNationwide}
        />
      </div>
    </div>
  )
}
