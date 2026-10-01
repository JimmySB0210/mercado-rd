'use client'
// ============================================================
// MercadoRD — "Confianza del vendedor" (página de producto + tienda)
// Ruta: src/components/shop/VendorTrustBar.tsx
// ============================================================
// El fetch de las 3 métricas (rating/respuesta/a-tiempo) vive en
// useVendorTrustStats.ts, compartido con VendorInfoBar.tsx (barra de
// vendedor de la página de producto) para no repetir las mismas 3
// llamadas RPC en la misma página. Cada métrica exige una muestra
// mínima antes de mostrarse — si no alcanza, esa línea específica no
// aparece (nunca "N/A"). Si ninguna alcanza, el componente entero no
// se renderiza.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { useVendorTrustStats, responseTimeKey } from '@/lib/hooks/useVendorTrustStats'

interface Props {
  vendorId: string
  className?: string
}

export function VendorTrustBar({ vendorId, className = '' }: Props) {
  const { t } = useTranslation('products')
  const { loading, rating, response, onTime, showRating, showResponse, showOnTime } = useVendorTrustStats(vendorId)

  if (loading) return null
  if (!showRating && !showResponse && !showOnTime) return null

  const statCount = [showRating, showResponse, showOnTime].filter(Boolean).length
  const gridColsClass = statCount === 3 ? 'grid-cols-3' : statCount === 2 ? 'grid-cols-2' : 'grid-cols-1'

  return (
    <div
      className={`bg-[var(--color-card-bg)] p-4 ${className}`}
      style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('trustBarTitle')}</h2>
      <div className={`grid ${gridColsClass} divide-x divide-gray-100 text-center`}>
        {showRating && (
          <div className="px-2">
            <p className="text-base font-bold text-gray-900">⭐ {rating!.average.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('trustRatingLabel')}</p>
          </div>
        )}
        {showResponse && (
          <div className="px-2">
            <p className="text-base font-bold text-gray-900">{t(responseTimeKey(response!.median_minutes!))}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('trustResponseLabel')}</p>
          </div>
        )}
        {showOnTime && (
          <div className="px-2">
            <p className="text-base font-bold text-gray-900">{Math.round(onTime!.rate!)}%</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('trustOnTimeLabel')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
