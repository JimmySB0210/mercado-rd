'use client'
// ============================================================
// MercadoRD — Tarifa de envío real para la provincia actual
// Ruta: src/lib/hooks/useShippingRate.ts
// ============================================================
// Usado por ProductCard.tsx (Fase 2A Batch 3) para mostrar "Envío
// desde RD$X" con el costo real por provincia. Cache a nivel de
// módulo — compartida por todas las instancias de ProductCard en la
// misma página, así elegir una provincia dispara UNA sola consulta a
// shipping_rates en vez de una por tarjeta visible.
// ============================================================

import { useEffect, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import { useLocationStore } from '@/lib/store/location'

const rateCache = new Map<number, number | null>()

// undefined = todavía no hay provincia seleccionada, o la consulta no
// ha resuelto (no mostrar nada). number = tarifa real en centavos.
// null = hay provincia pero no tiene tarifa cargada (tampoco mostrar
// nada — no adivinar un valor).
export function useShippingRateForCurrentProvince(): number | null | undefined {
  const province = useLocationStore(s => s.province)
  const [rate, setRate] = useState<number | null | undefined>(
    province ? rateCache.get(province.id) : undefined
  )

  useEffect(() => {
    if (!province) {
      setRate(undefined)
      return
    }

    if (rateCache.has(province.id)) {
      setRate(rateCache.get(province.id) ?? null)
      return
    }

    let active = true
    const supabase = createPublicClient()
    supabase
      .from('shipping_rates')
      .select('price_rdp')
      .eq('province_id', province.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('[useShippingRateForCurrentProvince]', error); return }
        const value = data?.price_rdp ?? null
        rateCache.set(province.id, value)
        if (active) setRate(value)
      })

    return () => { active = false }
  }, [province])

  return rate
}
