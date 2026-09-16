'use client'
// ============================================================
// MercadoRD — Detección batched de "este producto tiene variantes"
// Ruta: src/lib/hooks/useHasVariantsMap.ts
// ============================================================
// ProductCard solo puede ofrecer "Agregar al carrito" directo cuando NO
// hace falta elegir talla/color — y el único indicador confiable de eso
// es si el producto tiene filas activas en product_variants (el sistema
// nuevo de variantes dinámicas; sizes/colors planos en products ya se
// revisan aparte, dentro de ProductCard). Consultar product_variants
// producto por producto sería N+1 sobre una grilla de docenas de
// tarjetas — este hook hace UNA sola consulta batched por lista de
// productos.
//
// Devuelve undefined mientras carga (ProductCard trata undefined igual
// que "no verificado" → nunca ofrece agregar directo, nunca puede
// arriesgarse a una línea de carrito sin variante elegida).
// ============================================================

import { useEffect, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public'

export function useHasVariantsMap(productIds: string[]): Set<string> | undefined {
  const key = productIds.join(',')
  const [variantIds, setVariantIds] = useState<Set<string> | undefined>(undefined)

  useEffect(() => {
    if (productIds.length === 0) {
      setVariantIds(new Set())
      return
    }

    let active = true
    const supabase = createPublicClient()
    supabase
      .from('product_variants')
      .select('product_id')
      .eq('is_active', true)
      .in('product_id', productIds)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('[useHasVariantsMap]', error)
          setVariantIds(new Set())
          return
        }
        setVariantIds(new Set((data ?? []).map(r => r.product_id)))
      })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return variantIds
}
