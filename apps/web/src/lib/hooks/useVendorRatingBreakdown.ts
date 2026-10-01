'use client'
// ============================================================
// MercadoRD — Desglose de estrellas del vendedor completo
// Ruta: src/lib/hooks/useVendorRatingBreakdown.ts
// ============================================================
// get_vendor_rating_breakdown(p_vendor_id) agrega reviews.vendor_id
// directo — TODAS las reseñas de TODOS los productos del vendedor, no
// solo el producto actual (confirmado en vivo contra la BD real: 5
// filas {stars, count, average, total}, average/total repetidos
// idénticos en cada fila). Acá solo se usa `count` por fila para las
// barras -- average/total YA llegan por useVendorTrustStats
// (get_vendor_rating, compartido con VendorInfoBar) para no leer el
// mismo promedio de dos fuentes distintas en la misma página.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BreakdownRow { stars: number; count: number }

// [count de 5★, count de 4★, count de 3★, count de 2★, count de 1★] —
// mismo orden que espera RatingBreakdown. null mientras carga.
export function useVendorRatingBreakdown(vendorId: string): number[] | null {
  const [counts, setCounts] = useState<number[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setCounts(null)
    const supabase = createClient()

    supabase
      .rpc('get_vendor_rating_breakdown', { p_vendor_id: vendorId })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[useVendorRatingBreakdown] get_vendor_rating_breakdown', error)
          return
        }
        const rows = (data ?? []) as BreakdownRow[]
        setCounts([5, 4, 3, 2, 1].map(stars => rows.find(r => r.stars === stars)?.count ?? 0))
      })

    return () => { cancelled = true }
  }, [vendorId])

  return counts
}
