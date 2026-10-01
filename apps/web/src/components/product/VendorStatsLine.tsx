'use client'
// ============================================================
// MercadoRD — Fila de estadísticas del vendedor (reusable)
// Ruta: src/components/product/VendorStatsLine.tsx
// ============================================================
// Puramente presentacional — sin fetch propio. Extraído de
// VendorInfoBar.tsx para que VendorRatingOverview.tsx ("Conoce a
// {vendedor}") repita exactamente la misma fila de datos más abajo en
// la página (repetición intencional, a pedido explícito) sin
// duplicar las llamadas RPC: ambos reciben rating/response ya
// resueltos por UNA sola llamada a useVendorTrustStats en
// ProductPageContent.tsx, no una por componente.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { responseTimeKey, type VendorRatingData, type VendorResponseData } from '@/lib/hooks/useVendorTrustStats'

interface Props {
  rating: VendorRatingData | null
  response: VendorResponseData | null
  showRating: boolean
  showResponse: boolean
  productCount: number
  shipsNationwide: boolean
}

export function VendorStatsLine({ rating, response, showRating, showResponse, productCount, shipsNationwide }: Props) {
  const { t } = useTranslation('products')

  return (
    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-gray-500">
      {showRating && <span>⭐ {rating!.average.toFixed(1)} ({rating!.count} {t('reviewsSuffix')})</span>}
      <span>{t('vendorProductCount', { count: productCount })}</span>
      {showResponse && <span>{t('vendorRespondsIn', { time: t(responseTimeKey(response!.median_minutes!)) })}</span>}
      {shipsNationwide && <span>🚚 {t('shipsNationwideLabel')}</span>}
    </div>
  )
}
