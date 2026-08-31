'use client'
// ============================================================
// MercadoRD — "Confianza del vendedor" (página de producto + tienda)
// Ruta: src/components/shop/VendorTrustBar.tsx
// ============================================================
// Llama a las 3 funciones RPC de métricas de vendor. Cada métrica
// exige una muestra mínima antes de mostrarse — si no alcanza, esa
// línea específica no aparece (nunca "N/A"), igual que las
// verificaciones sin proveedor. Si ninguna alcanza, el componente
// entero no se renderiza.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'

const MIN_SAMPLE_SIZE = 5

interface RatingData { average: number; count: number }
interface ResponseData { median_minutes: number | null; sample_size: number }
interface OnTimeData { rate: number | null; sample_size: number }

interface Props {
  vendorId: string
  className?: string
}

type ResponseTimeKey =
  | 'trustResponseUnder1h'
  | 'trustResponseUnder4h'
  | 'trustResponseUnder12h'
  | 'trustResponseUnder24h'
  | 'trustResponse1to2Days'
  | 'trustResponseOver2Days'

function responseTimeKey(medianMinutes: number): ResponseTimeKey {
  if (medianMinutes <= 60) return 'trustResponseUnder1h'
  if (medianMinutes <= 240) return 'trustResponseUnder4h'
  if (medianMinutes <= 720) return 'trustResponseUnder12h'
  if (medianMinutes <= 1440) return 'trustResponseUnder24h'
  if (medianMinutes <= 2880) return 'trustResponse1to2Days'
  return 'trustResponseOver2Days'
}

export function VendorTrustBar({ vendorId, className = '' }: Props) {
  const { t } = useTranslation('products')
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState<RatingData | null>(null)
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [onTime, setOnTime] = useState<OnTimeData | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    Promise.all([
      supabase.rpc('get_vendor_rating', { p_vendor_id: vendorId }),
      supabase.rpc('get_vendor_response_minutes', { p_vendor_id: vendorId }),
      supabase.rpc('get_vendor_on_time_rate', { p_vendor_id: vendorId }),
    ]).then(([ratingRes, responseRes, onTimeRes]) => {
      if (cancelled) return
      if (ratingRes.error) console.error('[VendorTrustBar] get_vendor_rating', ratingRes.error)
      if (responseRes.error) console.error('[VendorTrustBar] get_vendor_response_minutes', responseRes.error)
      if (onTimeRes.error) console.error('[VendorTrustBar] get_vendor_on_time_rate', onTimeRes.error)
      setRating(ratingRes.data ?? null)
      setResponse(responseRes.data ?? null)
      setOnTime(onTimeRes.data ?? null)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [vendorId])

  if (loading) return null

  const showRating = !!rating && rating.count >= MIN_SAMPLE_SIZE
  const showResponse = !!response && response.sample_size >= MIN_SAMPLE_SIZE && response.median_minutes !== null
  const showOnTime = !!onTime && onTime.sample_size >= MIN_SAMPLE_SIZE && onTime.rate !== null

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
