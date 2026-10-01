'use client'
// ============================================================
// MercadoRD — Métricas reales de confianza del vendedor
// Ruta: src/lib/hooks/useVendorTrustStats.ts
// ============================================================
// Extraído de VendorTrustBar.tsx para que VendorInfoBar.tsx (barra de
// vendedor de la página de producto) pueda mostrar el mismo rating y
// tiempo de respuesta reales SIN repetir las 3 llamadas RPC — ambos
// componentes llaman a este mismo hook en vez de cada uno hacer su
// propio fetch. Cada métrica exige una muestra mínima antes de
// mostrarse (igual que antes) — si no alcanza, el llamador simplemente
// no la muestra (nunca "N/A").
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const MIN_SAMPLE_SIZE = 5

export interface VendorRatingData { average: number; count: number }
export interface VendorResponseData { median_minutes: number | null; sample_size: number }
export interface VendorOnTimeData { rate: number | null; sample_size: number }

export type ResponseTimeKey =
  | 'trustResponseUnder1h'
  | 'trustResponseUnder4h'
  | 'trustResponseUnder12h'
  | 'trustResponseUnder24h'
  | 'trustResponse1to2Days'
  | 'trustResponseOver2Days'

export function responseTimeKey(medianMinutes: number): ResponseTimeKey {
  if (medianMinutes <= 60) return 'trustResponseUnder1h'
  if (medianMinutes <= 240) return 'trustResponseUnder4h'
  if (medianMinutes <= 720) return 'trustResponseUnder12h'
  if (medianMinutes <= 1440) return 'trustResponseUnder24h'
  if (medianMinutes <= 2880) return 'trustResponse1to2Days'
  return 'trustResponseOver2Days'
}

export function useVendorTrustStats(vendorId: string) {
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState<VendorRatingData | null>(null)
  const [response, setResponse] = useState<VendorResponseData | null>(null)
  const [onTime, setOnTime] = useState<VendorOnTimeData | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const supabase = createClient()

    Promise.all([
      supabase.rpc('get_vendor_rating', { p_vendor_id: vendorId }),
      supabase.rpc('get_vendor_response_minutes', { p_vendor_id: vendorId }),
      supabase.rpc('get_vendor_on_time_rate', { p_vendor_id: vendorId }),
    ]).then(([ratingRes, responseRes, onTimeRes]) => {
      if (cancelled) return
      if (ratingRes.error) console.error('[useVendorTrustStats] get_vendor_rating', ratingRes.error)
      if (responseRes.error) console.error('[useVendorTrustStats] get_vendor_response_minutes', responseRes.error)
      if (onTimeRes.error) console.error('[useVendorTrustStats] get_vendor_on_time_rate', onTimeRes.error)
      setRating(ratingRes.data ?? null)
      setResponse(responseRes.data ?? null)
      setOnTime(onTimeRes.data ?? null)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [vendorId])

  const showRating = !!rating && rating.count >= MIN_SAMPLE_SIZE
  const showResponse = !!response && response.sample_size >= MIN_SAMPLE_SIZE && response.median_minutes !== null
  const showOnTime = !!onTime && onTime.sample_size >= MIN_SAMPLE_SIZE && onTime.rate !== null

  return { loading, rating, response, onTime, showRating, showResponse, showOnTime }
}
