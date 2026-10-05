// ============================================================
// MercadoRD — Calificación y ventas reales de una tienda
// Ruta: src/components/shop/VendorRealStatsLine.tsx
// ============================================================
// Cada dato tiene su propia regla de visibilidad:
//   - Calificación: solo con MIN_SAMPLE_SIZE reseñas reales o más (el
//     mismo mínimo que VendorTrustBar).
//   - Ventas: solo si real_total_sales > 0.
// Si ninguna de las dos aplica, no se renderiza nada (ni una línea vacía).
// ============================================================

import { Star } from 'lucide-react'
import { MIN_SAMPLE_SIZE } from '@/lib/hooks/useVendorTrustStats'
import type { VendorRealStats } from '@/lib/queries/vendorRealStatsBatch'

export function getVisibleRating(stats?: VendorRealStats): number | null {
  if (!stats || stats.realRatingAvg === null) return null
  return stats.realRatingCount >= MIN_SAMPLE_SIZE ? stats.realRatingAvg : null
}

export function getVisibleSales(stats?: VendorRealStats): number | null {
  if (!stats || stats.realTotalSales <= 0) return null
  return stats.realTotalSales
}

export function VendorRealStatsLine({ stats, salesLabel }: { stats?: VendorRealStats; salesLabel: string }) {
  const rating = getVisibleRating(stats)
  const sales = getVisibleSales(stats)

  if (rating === null && sales === null) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
      {rating !== null && (
        <>
          <Star size={12} fill="#F5A623" color="#F5A623" />
          {rating.toFixed(1)}
        </>
      )}
      {rating !== null && sales !== null && ' · '}
      {sales !== null && `${sales} ${salesLabel}`}
    </div>
  )
}
